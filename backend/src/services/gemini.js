const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple cache for dashboard configs (reuse without calling API)
const dashboardCache = new Map();

/**
 * Generate default dashboard without AI (Free tier fallback) - IMPROVED
 */
const generateDefaultDashboard = (data, columns, analysis) => {
  const numericColumns = columns.filter(col => analysis[col]?.type === 'numeric');
  const textColumns = columns.filter(col => analysis[col]?.type === 'text');
  const dateColumns = columns.filter(col => analysis[col]?.type === 'date');

  const charts = [];
  const metrics = [];

  // CHART 1: If multiple numeric columns, create a time-series or aggregation bar chart
  if (numericColumns.length > 1) {
    // Check if columns look like time series (Q1, Q2, Q3, Q4 or month names)
    const isTimeSeries = numericColumns.some(col => 
      col.match(/^(Q[1-4]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Month|Week|Year|Day)/i)
    );

    if (isTimeSeries) {
      // Line chart for time series
      charts.push({
        id: 'chart1',
        title: 'Trend Analysis Over Time',
        type: 'line',
        xAxis: textColumns[0] || 'Index',
        yAxis: numericColumns.slice(0, 2),
        description: 'Shows progression and trends across time periods'
      });
    } else {
      // Bar chart for comparison
      charts.push({
        id: 'chart1',
        title: `${numericColumns[0]} Distribution`,
        type: 'bar',
        xAxis: textColumns[0] || numericColumns[1],
        yAxis: numericColumns[0],
        description: `Compares ${numericColumns[0]} across different categories`
      });
    }
  } else if (numericColumns.length === 1 && textColumns.length > 0) {
    // Single numeric column with category
    charts.push({
      id: 'chart1',
      title: `${numericColumns[0]} by ${textColumns[0]}`,
      type: 'bar',
      xAxis: textColumns[0],
      yAxis: numericColumns[0],
      description: `Shows ${numericColumns[0]} distribution across ${textColumns[0]} categories`
    });
  }

  // CHART 2: Pie chart for categorical distribution (if text column exists)
  if (textColumns.length > 0 && numericColumns.length > 0) {
    charts.push({
      id: 'chart2',
      title: `Distribution by ${textColumns[0]}`,
      type: 'pie',
      xAxis: textColumns[0],
      yAxis: numericColumns[0],
      description: `Shows proportion of ${numericColumns[0]} across ${textColumns[0]}`
    });
  }

  // CHART 3: Scatter plot for correlation (if we have multiple numeric columns)
  if (numericColumns.length >= 2) {
    charts.push({
      id: 'chart3',
      title: `${numericColumns[0]} vs ${numericColumns[1]} Correlation`,
      type: 'scatter',
      xAxis: numericColumns[0],
      yAxis: numericColumns[1],
      description: `Shows relationship between ${numericColumns[0]} and ${numericColumns[1]}`
    });
  }

  // CHART 4: Second pie for second text column (if exists)
  if (textColumns.length > 1 && numericColumns.length > 0) {
    charts.push({
      id: 'chart4',
      title: `Distribution by ${textColumns[1]}`,
      type: 'doughnut',
      xAxis: textColumns[1],
      yAxis: numericColumns[0],
      description: `Shows proportion of ${numericColumns[0]} across ${textColumns[1]}`
    });
  }

  // CHART 5: Data table
  charts.push({
    id: 'chart-table',
    title: 'Full Dataset',
    type: 'table',
    description: 'Complete data table with sorting and filtering'
  });

  // GENERATE METRICS
  // Metric 1: Sum of first numeric column
  if (numericColumns.length > 0) {
    metrics.push({
      id: 'metric1',
      label: `Total ${numericColumns[0]}`,
      column: numericColumns[0],
      aggregation: 'sum',
      description: `Sum of all ${numericColumns[0]} values`
    });

    metrics.push({
      id: 'metric2',
      label: `Avg ${numericColumns[0]}`,
      column: numericColumns[0],
      aggregation: 'avg',
      description: `Average ${numericColumns[0]} value`
    });

    metrics.push({
      id: 'metric3',
      label: `Max ${numericColumns[0]}`,
      column: numericColumns[0],
      aggregation: 'max',
      description: `Highest ${numericColumns[0]} value`
    });

    if (numericColumns.length > 1) {
      metrics.push({
        id: 'metric4',
        label: `Total ${numericColumns[1]}`,
        column: numericColumns[1],
        aggregation: 'sum',
        description: `Sum of all ${numericColumns[1]} values`
      });
    } else {
      metrics.push({
        id: 'metric4',
        label: `Record Count`,
        column: columns[0],
        aggregation: 'count',
        description: `Total number of records`
      });
    }
  }

  // Generate insights
  let insightsText = `📊 Dataset Analysis Summary\n\n`;
  insightsText += `• Total Records: ${data.length} rows\n`;
  insightsText += `• Fields: ${columns.length} columns\n`;
  insightsText += `• Numeric Fields: ${numericColumns.join(', ') || 'None'}\n`;
  insightsText += `• Category Fields: ${textColumns.join(', ') || 'None'}\n\n`;
  
  if (numericColumns.length > 0) {
    insightsText += `Key Statistics:\n`;
    numericColumns.slice(0, 2).forEach(col => {
      const stat = analysis[col];
      if (stat) {
        insightsText += `• ${col}: Min=${stat.min}, Max=${stat.max}, Avg=${stat.avg}\n`;
      }
    });
  }

  insightsText += `\nRecommendations:\n`;
  insightsText += `• Use filters to explore specific categories\n`;
  insightsText += `• Compare values across different dimensions\n`;
  insightsText += `• Identify trends and patterns in the data`;

  return {
    dashboardTitle: `Dashboard - ${columns.join(', ').substring(0, 40)}...`,
    insights: insightsText,
    charts,
    metrics
  };
};

/**
 * Retry with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.status === 503 || error.message.includes('Service Unavailable') || error.message.includes('Too Many Requests') || error.message.includes('429')) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`⏳ API busy, retrying in ${waitTime}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Generate dashboard configuration using Gemini AI (with fallback)
 */
const generateDashboardConfig = async (data, columns, analysis, userPrompt = '') => {
  try {
    console.log('📊 Generating dashboard configuration...');
    
    // Generate cache key
    const cacheKey = `${columns.join('-')}-${data.length}`;
    
    // Check cache first
    if (dashboardCache.has(cacheKey)) {
      console.log('✅ Using cached dashboard configuration');
      return dashboardCache.get(cacheKey);
    }

    // Try AI first (with quota check)
    try {
      console.log('🤖 Attempting AI-powered dashboard generation...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const sampleData = data.slice(0, 5);
      const dataContext = JSON.stringify(
        {
          totalRows: data.length,
          columns,
          sampleData,
          columnAnalysis: analysis,
        },
        null,
        2
      );

      const prompt = `
You are a dashboard design expert. Analyze the following data and suggest visualizations in JSON format.

DATA CONTEXT:
${dataContext}

USER REQUEST: ${userPrompt || 'Create a comprehensive dashboard with the most relevant visualizations'}

Respond with a JSON object (no markdown, just raw JSON) with this structure:
{
  "dashboardTitle": "string - title based on data",
  "insights": ["string - 2-3 key insights about the data"],
  "charts": [
    {
      "id": "chart1",
      "title": "string - chart title",
      "type": "bar|line|pie|scatter|table",
      "xAxis": "column name",
      "yAxis": "column name or array of column names",
      "description": "why this chart is useful"
    }
  ],
  "metrics": [
    {
      "id": "metric1",
      "label": "string - metric name",
      "column": "column name",
      "aggregation": "sum|avg|count|max|min"
    }
  ]
}

IMPORTANT:
- Only use columns that exist in the provided columns array
- For table type, omit xAxis and yAxis
- Return only valid JSON, no additional text
`;

      const result = await retryWithBackoff(() => model.generateContent(prompt));
      const responseText = result.response.text();

      let dashboardConfig;
      try {
        dashboardConfig = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          dashboardConfig = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response as JSON');
        }
      }

      // Cache the result
      dashboardCache.set(cacheKey, dashboardConfig);
      console.log('✅ AI-powered dashboard generated and cached');
      return dashboardConfig;
    } catch (aiError) {
      if (aiError.message.includes('429') || aiError.message.includes('quota')) {
        console.log('⚠️  API quota exceeded, using fallback dashboard');
      } else {
        console.log('⚠️  AI generation failed, using fallback dashboard:', aiError.message);
      }
      
      // Fallback: Generate default dashboard without AI
      const defaultDashboard = generateDefaultDashboard(data, columns, analysis);
      dashboardCache.set(cacheKey, defaultDashboard);
      return defaultDashboard;
    }
  } catch (error) {
    console.error('Dashboard generation error:', error.message);
    throw new Error(`Dashboard generation error: ${error.message}`);
  }
};

/**
 * Generate natural language insights from data - IMPROVED
 */
const generateInsights = async (data, columns, analysis) => {
  try {
    console.log('💡 Generating insights...');

    // Try AI first
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Prepare comprehensive data analysis
      const summaryStats = {};
      const topValues = {};
      
      columns.forEach((col) => {
        const analysis_col = analysis[col];
        if (analysis_col && analysis_col.type === 'numeric') {
          summaryStats[col] = {
            min: analysis_col.min,
            max: analysis_col.max,
            avg: analysis_col.avg,
            median: analysis_col.median,
            sum: analysis_col.sum,
            range: analysis_col.range,
          };
        } else if (analysis_col && analysis_col.type === 'text') {
          const values = data.map(r => r[col]);
          const valueCounts = {};
          values.forEach(v => {
            valueCounts[v] = (valueCounts[v] || 0) + 1;
          });
          topValues[col] = Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([val, count]) => `${val} (${count})`);
        }
      });

      const prompt = `
You are a data analyst. Analyze this dataset and provide 4-6 concise, actionable key insights in bullet-point format.

DATASET OVERVIEW:
- Total Records: ${data.length}
- Columns: ${columns.join(', ')}

STATISTICS:
${JSON.stringify(summaryStats, null, 2)}

TOP VALUES BY CATEGORY:
${JSON.stringify(topValues, null, 2)}

REQUIREMENTS for your response:
✓ Be specific with numbers and percentages
✓ Highlight the most important findings
✓ Identify trends and patterns
✓ Suggest actionable next steps
✓ Keep each insight to 1-2 sentences
✓ Format as bullet points only

Provide the insights now:
`;

      const result = await retryWithBackoff(() => model.generateContent(prompt));
      console.log('✅ AI insights generated');
      return result.response.text();
    } catch (aiError) {
      if (aiError.message.includes('429') || aiError.message.includes('quota')) {
        console.log('⚠️  API quota exceeded, using detailed fallback insights');
      } else {
        console.log('⚠️  AI insights failed, using fallback insights:', aiError.message);
      }

      // Fallback: Generate detailed insights
      const numericCols = columns.filter(col => analysis[col]?.type === 'numeric');
      const textCols = columns.filter(col => analysis[col]?.type === 'text');
      
      let insights = `📊 Data Insights & Analysis\n\n`;
      
      // Record count
      insights += `📈 Dataset Size\n`;
      insights += `• Total Records: ${data.length.toLocaleString()}\n`;
      insights += `• Total Columns: ${columns.length}\n\n`;
      
      // Numeric analysis
      if (numericCols.length > 0) {
        insights += `💰 Numeric Metrics\n`;
        numericCols.slice(0, 3).forEach((col) => {
          const stat = analysis[col];
          if (stat && stat.sum !== undefined) {
            const percent = ((stat.sum / (stat.sum + 1)) * 100).toFixed(1);
            insights += `• ${col}: Total ${stat.sum.toLocaleString()} | Avg ${stat.avg} | Range ${stat.min}-${stat.max}\n`;
          }
        });
        insights += '\n';
      }

      // Category analysis
      if (textCols.length > 0) {
        insights += `🏷️  Category Distribution\n`;
        textCols.slice(0, 2).forEach((col) => {
          const stat = analysis[col];
          if (stat) {
            insights += `• ${col}: ${stat.uniqueCount} unique values\n`;
          }
        });
        insights += '\n';
      }

      // Recommendations
      insights += `💡 Recommendations\n`;
      insights += `• Use sidebar filters to explore specific categories\n`;
      insights += `• Compare performance across different segments\n`;
      insights += `• Look for trends in the line chart visualization\n`;
      insights += `• Export detailed data from the table view`;

      return insights;
    }
  } catch (error) {
    console.error('Insights generation error:', error.message);
    
    // Ultimate fallback
    return `📊 Data Insights\n• Total Records: ${data.length.toLocaleString()}\n• Columns: ${columns.length}\n• Ready for analysis`;
  }
};

module.exports = {
  generateDashboardConfig,
  generateInsights,
};
