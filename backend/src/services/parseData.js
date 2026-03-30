const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Safe number conversion with validation
 */
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  // Handle currency strings like "$1,234.56"
  if (typeof value === 'string') {
    value = value.replace(/[$,]/g, '');
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Detect if a value is numeric
 */
const isNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') {
    value = value.replace(/[$,]/g, '');
  }
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Parse CSV file and return JSON data with column analysis
 */
const parseCSV = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data.length) {
      throw new Error('CSV file is empty');
    }

    return {
      data,
      columns: Object.keys(data[0]),
      rowCount: data.length,
    };
  } catch (error) {
    throw new Error(`CSV parsing error: ${error.message}`);
  }
};

/**
 * Parse Excel file
 */
const parseExcel = (filePath) => {
  return parseCSV(filePath);
};

/**
 * Parse JSON file
 */
const parseJSON = (filePath) => {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of objects');
    }

    if (!data.length) {
      throw new Error('JSON array is empty');
    }

    return {
      data,
      columns: Object.keys(data[0]),
      rowCount: data.length,
    };
  } catch (error) {
    throw new Error(`JSON parsing error: ${error.message}`);
  }
};

/**
 * Comprehensive EDA Analysis - Similar to pandas describe()
 */
const analyzeData = (data, columns) => {
  const analysis = {
    summary: {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      missingValues: {},
      duplicates: 0,
    },
    columns: {},
    correlations: {},
    outliers: {},
    distributions: {},
    topValues: {},
    trends: {},
  };

  // Check for duplicates
  const seen = new Set();
  data.forEach((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      analysis.summary.duplicates++;
    }
    seen.add(key);
  });

  // Analyze each column
  columns.forEach((col) => {
    const values = data.map((row) => row[col]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

    // Count missing values
    const missingCount = values.length - nonNullValues.length;
    analysis.summary.missingValues[col] = missingCount;

    // Type detection
    const numericValues = nonNullValues.filter(isNumericValue).map(parseNumber).filter((v) => v !== null);
    const isFullyNumeric = numericValues.length === nonNullValues.length && nonNullValues.length > 0;
    const isPartiallyNumeric = numericValues.length > 0 && numericValues.length < nonNullValues.length;

    // Check for dates
    const dateParses = nonNullValues.filter((v) => {
      if (typeof v !== 'string') return false;
      const parsed = Date.parse(v);
      return !isNaN(parsed) && v.length > 5;
    }).length;
    const isDate = dateParses > nonNullValues.length * 0.7;

    let type = 'text';
    if (isFullyNumeric) {
      type = 'numeric';
      analysis.summary.numericColumns.push(col);
    } else if (isDate) {
      type = 'date';
      analysis.summary.dateColumns.push(col);
    } else {
      type = 'text';
      analysis.summary.categoricalColumns.push(col);
    }

    // Base column info
    analysis.columns[col] = {
      type,
      totalCount: values.length,
      nonNullCount: nonNullValues.length,
      missingCount,
      missingPercent: ((missingCount / values.length) * 100).toFixed(2),
      uniqueCount: new Set(nonNullValues.map(String)).size,
      sampleValues: nonNullValues.slice(0, 5),
    };

    // Numeric column statistics (like pandas describe)
    if (type === 'numeric' && numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const n = sorted.length;
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / n;

      // Quartiles
      const q1Index = Math.floor(n * 0.25);
      const q2Index = Math.floor(n * 0.5);
      const q3Index = Math.floor(n * 0.75);
      const q1 = sorted[q1Index];
      const median = sorted[q2Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;

      // Variance and standard deviation
      const variance = numericValues.reduce((sq, val) => sq + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // Skewness
      const skewness = numericValues.reduce((sk, val) => sk + Math.pow((val - mean) / stdDev, 3), 0) / n;

      // Kurtosis
      const kurtosis = numericValues.reduce((ku, val) => ku + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;

      analysis.columns[col] = {
        ...analysis.columns[col],
        count: n,
        sum: parseFloat(sum.toFixed(2)),
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        mode: getMostFrequent(numericValues),
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        range: Math.max(...numericValues) - Math.min(...numericValues),
        q1: parseFloat(q1.toFixed(2)),
        q3: parseFloat(q3.toFixed(2)),
        iqr: parseFloat(iqr.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        variance: parseFloat(variance.toFixed(2)),
        skewness: parseFloat(skewness.toFixed(4)),
        kurtosis: parseFloat(kurtosis.toFixed(4)),
        coeffOfVariation: parseFloat(((stdDev / mean) * 100).toFixed(2)),
      };

      // Outlier detection using IQR method
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = numericValues.filter((v) => v < lowerBound || v > upperBound);
      analysis.outliers[col] = {
        lowerBound: parseFloat(lowerBound.toFixed(2)),
        upperBound: parseFloat(upperBound.toFixed(2)),
        count: outliers.length,
        percent: parseFloat(((outliers.length / n) * 100).toFixed(2)),
        values: outliers.slice(0, 10),
      };

      // Distribution bins (histogram data)
      const binCount = Math.min(10, Math.ceil(Math.sqrt(n)));
      const binWidth = (analysis.columns[col].max - analysis.columns[col].min) / binCount;
      const bins = Array(binCount).fill(0);
      numericValues.forEach((v) => {
        const binIndex = Math.min(Math.floor((v - analysis.columns[col].min) / binWidth), binCount - 1);
        bins[binIndex]++;
      });
      analysis.distributions[col] = {
        bins,
        binWidth: parseFloat(binWidth.toFixed(2)),
        binCount,
      };
    }

    // Categorical column analysis
    if (type === 'text') {
      const valueCounts = {};
      nonNullValues.forEach((v) => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      const sortedCounts = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      analysis.topValues[col] = sortedCounts.map(([value, count]) => ({
        value,
        count,
        percent: parseFloat(((count / nonNullValues.length) * 100).toFixed(2)),
      }));

      analysis.columns[col].topValue = sortedCounts[0]?.[0];
      analysis.columns[col].topValueCount = sortedCounts[0]?.[1];
    }
  });

  // Calculate correlations between numeric columns
  const numericCols = analysis.summary.numericColumns;
  if (numericCols.length >= 2) {
    numericCols.forEach((col1) => {
      analysis.correlations[col1] = {};
      numericCols.forEach((col2) => {
        if (col1 !== col2) {
          const correlation = calculateCorrelation(data, col1, col2);
          analysis.correlations[col1][col2] = parseFloat(correlation.toFixed(4));
        }
      });
    });
  }

  // Trend analysis for time-series like columns
  const quarterColumns = columns.filter((col) => col.match(/^Q[1-4]/i) || col.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i));
  if (quarterColumns.length > 1) {
    const totals = quarterColumns.map((col) => {
      const values = data.map((row) => parseNumber(row[col])).filter((v) => v !== null);
      return values.reduce((a, b) => a + b, 0);
    });

    analysis.trends.timeSeries = {
      columns: quarterColumns,
      totals,
      growth: [],
    };

    for (let i = 1; i < totals.length; i++) {
      const growth = ((totals[i] - totals[i - 1]) / totals[i - 1]) * 100;
      analysis.trends.timeSeries.growth.push({
        from: quarterColumns[i - 1],
        to: quarterColumns[i],
        percent: parseFloat(growth.toFixed(2)),
      });
    }
  }

  // Group analysis for categorical columns with numeric values
  analysis.summary.categoricalColumns.forEach((catCol) => {
    const firstNumCol = analysis.summary.numericColumns[0];
    if (firstNumCol) {
      const groupedData = {};
      data.forEach((row) => {
        const category = String(row[catCol] || 'Unknown');
        const value = parseNumber(row[firstNumCol]);
        if (value !== null) {
          if (!groupedData[category]) {
            groupedData[category] = [];
          }
          groupedData[category].push(value);
        }
      });

      const groupStats = Object.entries(groupedData).map(([category, values]) => ({
        category,
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      }));

      groupStats.sort((a, b) => b.sum - a.sum);

      if (!analysis.groupAnalysis) {
        analysis.groupAnalysis = {};
      }
      analysis.groupAnalysis[catCol] = {
        groupBy: catCol,
        metric: firstNumCol,
        groups: groupStats.slice(0, 10),
      };
    }
  });

  return analysis;
};

/**
 * Get most frequent value (mode)
 */
const getMostFrequent = (arr) => {
  const counts = {};
  let maxCount = 0;
  let mode = arr[0];

  arr.forEach((val) => {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      mode = val;
    }
  });

  return mode;
};

/**
 * Calculate Pearson correlation coefficient
 */
const calculateCorrelation = (data, col1, col2) => {
  const pairs = data
    .map((row) => [parseNumber(row[col1]), parseNumber(row[col2])])
    .filter(([a, b]) => a !== null && b !== null);

  if (pairs.length < 2) return 0;

  const n = pairs.length;
  const sum1 = pairs.reduce((s, [a]) => s + a, 0);
  const sum2 = pairs.reduce((s, [, b]) => s + b, 0);
  const sum1Sq = pairs.reduce((s, [a]) => s + a * a, 0);
  const sum2Sq = pairs.reduce((s, [, b]) => s + b * b, 0);
  const pSum = pairs.reduce((s, [a, b]) => s + a * b, 0);

  const num = pSum - (sum1 * sum2) / n;
  const den = Math.sqrt((sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n));

  if (den === 0) return 0;
  return num / den;
};

module.exports = {
  parseCSV,
  parseExcel,
  parseJSON,
  analyzeData,
  parseNumber,
  isNumericValue,
  calculateCorrelation,
};
