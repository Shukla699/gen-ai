const fs = require('fs');
const path = require('path');
const { parseCSV, parseExcel, parseJSON, analyzeData } = require('../services/parseData');
const { generateDashboardConfig, generateInsights } = require('../services/gemini');

/**
 * Upload file and generate dashboard
 */
const uploadAndGenerateDashboard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

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

    // Analyze data
    const analysis = analyzeData(data, columns);

    // Get user prompt if provided
    const { prompt } = req.body;

    // Generate dashboard config using AI
    const dashboardConfig = await generateDashboardConfig(data, columns, analysis, prompt);

    // Generate insights
    const insights = await generateInsights(data, columns, analysis);

    // Store data in session/memory (in production, use database)
    const sessionId = req.sessionID || Date.now().toString();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

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
      dashboardConfig,
      insights,
      data: data.slice(0, 100), // Send first 100 rows
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
 * Regenerate dashboard with custom prompt
 */
const regenerateDashboard = async (req, res) => {
  try {
    // In a real app, you'd retrieve the stored data from a session/database
    // For now, this is a placeholder
    const { data, columns, prompt } = req.body;

    if (!data || !columns) {
      return res.status(400).json({ error: 'Data and columns are required' });
    }

    const analysis = analyzeData(data, columns);
    const dashboardConfig = await generateDashboardConfig(data, columns, analysis, prompt);

    res.json({
      success: true,
      dashboardConfig,
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
          .map((val) => {
            if (val === null || val === undefined || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
          })
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

        results[id] = {
          value: typeof result === 'number' ? result : 0,
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

module.exports = {
  uploadAndGenerateDashboard,
  regenerateDashboard,
  calculateMetrics,
};
