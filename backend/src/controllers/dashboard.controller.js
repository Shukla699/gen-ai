const fs = require('fs');
const path = require('path');
const { parseCSV, parseExcel, parseJSON, analyzeData, parseNumber } = require('../services/parseData');
const { generateDashboardConfig, generateInsights } = require('../services/gemini');

/**
 * Upload file and generate dashboard with comprehensive EDA
 */
const uploadAndGenerateDashboard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing uploaded file:', req.file.originalname);

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let parseResult;

    // Parse file based on type
    if (fileExt === '.csv') {
      parseResult = parseCSV(filePath);
    } else if (['.xlsx', '.xls'].includes(fileExt)) {
      parseResult = parseExcel(filePath);
    } else if (fileExt === '.json') {
      parseResult = parseJSON(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type. Use CSV, Excel, or JSON' });
    }

    const { data, columns, rowCount } = parseResult;

    console.log(`Parsed ${rowCount} rows with ${columns.length} columns`);

    // Comprehensive EDA Analysis
    console.log('Running comprehensive EDA analysis...');
    const analysis = analyzeData(data, columns);

    // Get user prompt if provided
    const { prompt } = req.body;

    // Generate dashboard config using AI (with analysis context)
    console.log('Generating dashboard configuration...');
    const dashboardConfig = await generateDashboardConfig(data, columns, analysis, prompt);

    // Generate insights based on actual data
    console.log('Generating data insights...');
    const insights = await generateInsights(data, columns, analysis);

    // Calculate actual metrics from data
    const calculatedMetrics = calculateActualMetrics(data, dashboardConfig.metrics || [], analysis);

    // Store data in session/memory (in production, use database)
    const sessionId = req.sessionID || Date.now().toString();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log('Dashboard generated successfully');

    res.json({
      success: true,
      sessionId,
      fileInfo: {
        name: req.file.originalname,
        type: fileExt,
        rowCount,
        columnCount: columns.length,
      },
      columns,
      dashboardConfig: {
        ...dashboardConfig,
        metrics: calculatedMetrics,
      },
      insights,
      analysis: {
        summary: analysis.summary,
        correlations: analysis.correlations,
        outliers: analysis.outliers,
        trends: analysis.trends,
        groupAnalysis: analysis.groupAnalysis,
        topValues: analysis.topValues,
      },
      data: data, // Send all data for client-side filtering
      totalRows: data.length,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calculate actual metrics from data
 */
const calculateActualMetrics = (data, metricConfigs, analysis) => {
  return metricConfigs.map((metric) => {
    const { id, label, column, aggregation, description } = metric;

    // Get numeric values from the column
    const values = data
      .map((row) => parseNumber(row[column]))
      .filter((v) => v !== null && isFinite(v));

    let value = 0;
    let formattedValue = '0';

    if (values.length > 0) {
      switch (aggregation?.toLowerCase()) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
        case 'average':
        case 'mean':
          value = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          value = values.length;
          break;
        case 'max':
        case 'maximum':
          value = Math.max(...values);
          break;
        case 'min':
        case 'minimum':
          value = Math.min(...values);
          break;
        case 'median':
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          value = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          break;
        case 'stddev':
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
          value = Math.sqrt(variance);
          break;
        case 'range':
          value = Math.max(...values) - Math.min(...values);
          break;
        default:
          value = values.reduce((a, b) => a + b, 0);
      }
    }

    // Format the value
    if (typeof value === 'number') {
      if (value >= 1000000) {
        formattedValue = `${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        formattedValue = `${(value / 1000).toFixed(2)}K`;
      } else if (value % 1 !== 0) {
        formattedValue = value.toFixed(2);
      } else {
        formattedValue = value.toLocaleString();
      }
    }

    // Get trend from analysis if available
    let trend = null;
    if (analysis.trends?.timeSeries?.growth?.length > 0) {
      const lastGrowth = analysis.trends.timeSeries.growth[analysis.trends.timeSeries.growth.length - 1];
      trend = {
        direction: lastGrowth.percent >= 0 ? 'up' : 'down',
        percent: Math.abs(lastGrowth.percent),
        label: `${lastGrowth.percent >= 0 ? '+' : ''}${lastGrowth.percent}% vs ${lastGrowth.from}`,
      };
    }

    return {
      id,
      label,
      column,
      aggregation,
      description: description || `${aggregation} of ${column}`,
      value: parseFloat(value.toFixed(2)),
      formattedValue,
      validCount: values.length,
      trend,
    };
  });
};

/**
 * Regenerate dashboard with custom prompt
 */
const regenerateDashboard = async (req, res) => {
  try {
    const { data, columns, prompt } = req.body;

    if (!data || !columns) {
      return res.status(400).json({ error: 'Data and columns are required' });
    }

    const analysis = analyzeData(data, columns);
    const dashboardConfig = await generateDashboardConfig(data, columns, analysis, prompt);
    const calculatedMetrics = calculateActualMetrics(data, dashboardConfig.metrics || [], analysis);

    res.json({
      success: true,
      dashboardConfig: {
        ...dashboardConfig,
        metrics: calculatedMetrics,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calculate aggregated metrics with accuracy validation
 */
const calculateMetrics = (req, res) => {
  try {
    const { data, metrics } = req.body;

    if (!data || !metrics) {
      return res.status(400).json({ error: 'Data and metrics are required' });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data must be a non-empty array' });
    }

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: 'Metrics must be a non-empty array' });
    }

    const results = {};

    metrics.forEach((metric) => {
      try {
        const { id, column, aggregation } = metric;

        if (!id || !column || !aggregation) {
          throw new Error('Each metric must have id, column, and aggregation');
        }

        // Extract and validate values
        const rawValues = data.map((row) => row[column]);

        // Filter and convert to numbers
        const numericValues = rawValues
          .map((val) => parseNumber(val))
          .filter((v) => v !== null && isFinite(v));

        let result = 0;
        let validCount = numericValues.length;

        switch (aggregation.toLowerCase()) {
          case 'sum':
            result = numericValues.reduce((a, b) => a + b, 0);
            break;

          case 'avg':
          case 'average':
          case 'mean':
            result = validCount > 0
              ? parseFloat((numericValues.reduce((a, b) => a + b, 0) / validCount).toFixed(2))
              : 0;
            break;

          case 'count':
            result = validCount;
            break;

          case 'max':
          case 'maximum':
            result = validCount > 0 ? Math.max(...numericValues) : 0;
            break;

          case 'min':
          case 'minimum':
            result = validCount > 0 ? Math.min(...numericValues) : 0;
            break;

          case 'median':
            if (validCount > 0) {
              const sorted = [...numericValues].sort((a, b) => a - b);
              if (validCount % 2 === 0) {
                result = (sorted[validCount / 2 - 1] + sorted[validCount / 2]) / 2;
              } else {
                result = sorted[Math.floor(validCount / 2)];
              }
            }
            break;

          case 'stddev':
          case 'standarddeviation':
            if (validCount > 1) {
              const avg = numericValues.reduce((a, b) => a + b, 0) / validCount;
              const variance = numericValues.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / validCount;
              result = parseFloat(Math.sqrt(variance).toFixed(2));
            }
            break;

          case 'range':
            result = validCount > 0
              ? (Math.max(...numericValues) - Math.min(...numericValues))
              : 0;
            break;

          case 'distinct':
          case 'unique':
            result = new Set(numericValues).size;
            break;

          default:
            throw new Error(`Unknown aggregation: ${aggregation}`);
        }

        // Format the value
        let formattedValue = result.toLocaleString();
        if (result >= 1000000) {
          formattedValue = `${(result / 1000000).toFixed(2)}M`;
        } else if (result >= 1000) {
          formattedValue = `${(result / 1000).toFixed(2)}K`;
        }

        results[id] = {
          value: typeof result === 'number' ? parseFloat(result.toFixed(2)) : 0,
          formattedValue,
          label: metric.label || column,
          column,
          aggregation,
          validCount,
          totalCount: rawValues.length,
        };
      } catch (metricError) {
        console.error(`Error calculating metric ${metric.id}:`, metricError);
        results[metric.id] = {
          value: 0,
          formattedValue: '0',
          error: metricError.message,
        };
      }
    });

    res.json({
      success: true,
      metrics: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get EDA report for uploaded data
 */
const getEDAReport = async (req, res) => {
  try {
    const { data, columns } = req.body;

    if (!data || !columns) {
      return res.status(400).json({ error: 'Data and columns are required' });
    }

    const analysis = analyzeData(data, columns);

    res.json({
      success: true,
      report: {
        summary: analysis.summary,
        columns: analysis.columns,
        correlations: analysis.correlations,
        outliers: analysis.outliers,
        distributions: analysis.distributions,
        topValues: analysis.topValues,
        trends: analysis.trends,
        groupAnalysis: analysis.groupAnalysis,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadAndGenerateDashboard,
  regenerateDashboard,
  calculateMetrics,
  getEDAReport,
};
