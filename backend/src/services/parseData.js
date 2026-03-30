const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Safe number conversion with validation
 */
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Detect if a value is numeric
 */
const isNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return false;
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
 * Analyze data with detailed statistics and accurate type detection
 */
const analyzeData = (data, columns) => {
  const analysis = {};

  columns.forEach((col) => {
    const values = data.map((row) => row[col]).filter((v) => v !== null && v !== undefined && v !== '');

    if (!values.length) {
      analysis[col] = {
        type: 'unknown',
        sampleValues: [],
        uniqueCount: 0,
      };
      return;
    }

    // Accurate type detection
    const numericValues = values.filter(isNumericValue).map(parseNumber).filter(v => v !== null);
    const isFullyNumeric = numericValues.length === values.length;
    const isPartiallyNumeric = numericValues.length > 0 && numericValues.length < values.length;

    let type = 'text';
    if (isFullyNumeric) {
      type = 'numeric';
    } else if (isPartiallyNumeric) {
      type = 'mixed';
    }

    // Check for date
    const dateParses = values.filter(v => !isNaN(Date.parse(v)) && v.toString().length > 3).length;
    if (dateParses > values.length * 0.7) {
      type = 'date';
    }

    analysis[col] = {
      type,
      sampleValues: values.slice(0, 3),
      uniqueCount: new Set(values).size,
      totalCount: values.length,
    };

    // Detailed numeric statistics
    if (isFullyNumeric && numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      
      analysis[col].sum = sum;
      analysis[col].min = Math.min(...numericValues);
      analysis[col].max = Math.max(...numericValues);
      analysis[col].avg = parseFloat(avg.toFixed(2));
      analysis[col].median = median;
      analysis[col].range = analysis[col].max - analysis[col].min;
      
      // Standard deviation
      const variance = numericValues.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / numericValues.length;
      analysis[col].stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
    }
  });

  return analysis;
};

module.exports = {
  parseCSV,
  parseExcel,
  parseJSON,
  analyzeData,
  parseNumber,
  isNumericValue,
};
