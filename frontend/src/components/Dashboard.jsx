import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Scatter, Doughnut } from 'react-chartjs-2';
import DataTable from './DataTable';
import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard({ dashboardData, onBackClick }) {
  const [metrics, setMetrics] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterColumn, setFilterColumn] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [filteredData, setFilteredData] = useState(dashboardData.data);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});

  const { dashboardConfig, data, columns, fileInfo, insights } = dashboardData;

  useEffect(() => {
    applyFilters();
  }, [appliedFilters, dashboardConfig]);

  const applyFilters = () => {
    let filtered = data || [];
    
    // Apply all active filters
    Object.entries(appliedFilters).forEach(([column, value]) => {
      if (value !== null && value !== '' && value !== 'all') {
        filtered = filtered.filter(row => row[column]?.toString() === value?.toString());
      }
    });

    setFilteredData(filtered);
    calculateMetrics(filtered);
  };

  const calculateMetrics = async (dataToUse = filteredData) => {
    try {
      const metricsToCalc = dashboardConfig.metrics || [];
      const response = await fetch('http://localhost:3000/api/dashboard/calculate-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToUse, metrics: metricsToCalc }),
      });

      const result = await response.json();
      if (result.success) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const addFilter = (column, value) => {
    setAppliedFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const removeFilter = (column) => {
    setAppliedFilters(prev => {
      const updated = { ...prev };
      delete updated[column];
      return updated;
    });
  };

  const clearAllFilters = () => {
    setAppliedFilters({});
    setFilterColumn(null);
    setFilterValue(null);
  };

  const getMetricColor = (index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  const getChartColor = (index) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
      '#06B6D4', '#14B8A6', '#84CC16', '#FB923C', '#F472B6', '#A78BFA'
    ];
    return colors[index % colors.length];
  };

  const prepareChartData = (chart) => {
    if (!chart || !filteredData || filteredData.length === 0) return null;

    const chartData = {
      labels: [],
      datasets: [],
    };

    if (chart.type === 'table') {
      return null;
    }

    const yAxis = Array.isArray(chart.yAxis) ? chart.yAxis : [chart.yAxis];
    const groupedData = {};

    // Parse numeric values safely
    const parseValue = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    // Group data by x-axis label
    filteredData.forEach((row) => {
      const label = row[chart.xAxis]?.toString() || 'Unknown';
      if (!groupedData[label]) {
        groupedData[label] = {};
        yAxis.forEach((axis) => {
          groupedData[label][axis] = [];
        });
      }
      yAxis.forEach((axis) => {
        const value = parseValue(row[axis]);
        if (value !== null) {
          groupedData[label][axis].push(value);
        }
      });
    });

    chartData.labels = Object.keys(groupedData).sort();

    // Determine aggregation method based on chart type
    const getAggregatedValue = (values, chartType) => {
      if (!values || values.length === 0) return 0;
      
      // For pie/doughnut, use sum to show total contribution
      if (chartType === 'pie' || chartType === 'doughnut') {
        return values.reduce((a, b) => a + b, 0);
      }
      
      // For others, use average for comparison
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    yAxis.forEach((axis, idx) => {
      const values = chartData.labels.map((label) => {
        const vals = groupedData[label][axis];
        return getAggregatedValue(vals, chart.type);
      });

      const color = getChartColor(idx);
      chartData.datasets.push({
        label: axis,
        data: values,
        backgroundColor: chart.type === 'pie' || chart.type === 'doughnut' ? 
          chartData.labels.map((_, i) => getChartColor(i)) :
          color,
        borderColor: chart.type === 'pie' || chart.type === 'doughnut' ? 
          chartData.labels.map((_, i) => getChartColor(i)) :
          color,
        borderWidth: chart.type === 'pie' || chart.type === 'doughnut' ? 2 : 2,
        fill: chart.type === 'line' || chart.type === 'area',
        tension: chart.type === 'line' ? 0.4 : undefined,
        pointRadius: chart.type === 'scatter' || chart.type === 'line' ? 4 : undefined,
      });
    });

    return chartData;
  };

  const renderChart = (chart) => {
    if (!chart) return null;

    const chartData = prepareChartData(chart);
    if (!chartData && chart.type !== 'table') return null;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12 }
          }
        },
        title: { display: false },
      },
      scales: (chart.type === 'pie' || chart.type === 'doughnut' || chart.type === 'scatter') ? {} : {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      },
    };

    const chartComponents = {
      bar: <Bar data={chartData} options={options} />,
      line: <Line data={chartData} options={options} />,
      pie: <Pie data={chartData} options={options} />,
      doughnut: <Doughnut data={chartData} options={options} />,
      scatter: <Scatter data={chartData} options={options} />,
      table: <DataTable data={filteredData} columns={columns} />,
    };

    return chartComponents[chart.type] || null;
  };

  const formatMetricValue = (value) => {
    if (typeof value !== 'number') return value;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(0)}`;
  };

  const getFilterOptions = (column) => {
    const values = [...new Set(filteredData.map(row => row[column]))];
    return values.slice(0, 20); // Limit to 20 options for performance
  };

  // Group charts by section for organized display
  const getChartsByType = () => {
    const charts = dashboardConfig.charts || [];
    return {
      main: charts.filter(c => ['bar', 'line'].includes(c.type)).slice(0, 2),
      distribution: charts.filter(c => ['pie', 'doughnut'].includes(c.type)).slice(0, 2),
      advanced: charts.filter(c => ['scatter'].includes(c.type)).slice(0, 1),
      table: charts.filter(c => c.type === 'table').slice(0, 1),
    };
  };

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR - Filters & Slicers */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🔍 Filters</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          {/* Data Info Section */}
          <div className="filter-section">
            <h3>📊 Data Overview</h3>
            <div className="data-info">
              <div className="info-item">
                <span className="info-label">Total Records</span>
                <span className="info-value">{filteredData.length.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Shown / Total</span>
                <span className="info-value">{filteredData.length.toLocaleString()} / {data.length.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fields</span>
                <span className="info-value">{columns.length}</span>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {Object.keys(appliedFilters).length > 0 && (
            <div className="filter-section">
              <h3>✅ Active Filters</h3>
              <div className="active-filters">
                {Object.entries(appliedFilters).map(([col, val]) => (
                  <div key={col} className="filter-tag">
                    <span className="filter-label">{col}</span>
                    <span className="filter-value">{val}</span>
                    <button 
                      className="filter-remove"
                      onClick={() => removeFilter(col)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Filter Columns */}
          <div className="filter-section">
            <h3>📋 Filter by Column</h3>
            <div className="columns-list">
              {columns.slice(0, 10).map((col) => (
                <details key={col} className="filter-dropdown">
                  <summary className="column-item">
                    <span className="column-icon">▼</span>
                    <span className="column-name">{col}</span>
                  </summary>
                  <div className="filter-options">
                    {getFilterOptions(col).map((val) => (
                      <label key={val} className="filter-option">
                        <input
                          type="checkbox"
                          checked={appliedFilters[col]?.toString() === val?.toString()}
                          onChange={() => addFilter(col, val)}
                        />
                        {String(val).slice(0, 20)}
                      </label>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            {columns.length > 10 && (
              <p className="filter-note">Showing first 10 columns</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="filter-section">
            <h3>📈 Top Metrics</h3>
            <div className="quick-stats">
              {(dashboardConfig.metrics || []).slice(0, 3).map((metric, idx) => (
                <div key={metric.id} className="quick-stat" style={{ borderLeftColor: getMetricColor(idx) }}>
                  <span className="stat-label">{metric.label}</span>
                  <span className="stat-value">{formatMetricValue(metrics[metric.id]?.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        {/* HEADER */}
        <div className="dashboard-header">
          <div className="header-left">
            <button className="back-btn" onClick={onBackClick}>
              ← Upload Data
            </button>
            <div className="header-title">
              <h1>{dashboardConfig.dashboardTitle || 'Dashboard'}</h1>
              <p className="header-subtitle">
                {appliedFilters && Object.keys(appliedFilters).length > 0 
                  ? `Filtered view: ${filteredData.length.toLocaleString()} records`
                  : `Viewing ${filteredData.length.toLocaleString()} of ${data.length.toLocaleString()} records`}
              </p>
            </div>
          </div>
          <button 
            className="menu-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰ Filters
          </button>
        </div>

        {/* SECTION 1: KPI CARDS */}
        <div className="section kpi-section">
          <h2 className="section-title">📊 Key Performance Indicators (KPIs)</h2>
          <div className="kpi-grid">
            {(dashboardConfig.metrics || []).map((metric, idx) => (
              <div
                key={metric.id}
                className="kpi-card"
                style={{ borderLeftColor: getMetricColor(idx) }}
              >
                <div className="kpi-header">
                  <div>
                    <h3>{metric.label}</h3>
                    <p className="kpi-description">{metric.description || 'Key metric'}</p>
                  </div>
                  <span 
                    className="kpi-icon"
                    style={{ backgroundColor: getMetricColor(idx) }}
                  >
                    📊
                  </span>
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">
                    {formatMetricValue(metrics[metric.id]?.value)}
                  </div>
                  <div className="kpi-footer">
                    <span className="kpi-trend">↑ 12% vs previous period</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: INSIGHTS */}
        {insights && (
          <div className="section insights-section">
            <h2 className="section-title">💡 Key Insights & Analysis</h2>
            <div className="insights-card">
              <div className="insights-content">
                {insights}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: MAIN VISUALIZATIONS (Bar & Line Charts) */}
        {(() => {
          const charts = getChartsByType();
          if (charts.main.length > 0) {
            return (
              <div className="section main-visuals-section">
                <h2 className="section-title">📈 Main Analysis</h2>
                <div className="charts-container">
                  {charts.main.map((chart) => (
                    <div key={chart.id} className="chart-card">
                      <div className="chart-header">
                        <div>
                          <h3>{chart.title}</h3>
                          <p className="chart-description">{chart.description}</p>
                        </div>
                        <span className="chart-badge">{chart.type.toUpperCase()}</span>
                      </div>
                      <div className="chart-wrapper" style={{ height: '320px' }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        })()}

        {/* SECTION 4: DISTRIBUTION ANALYSIS (Pie & Doughnut Charts) */}
        {(() => {
          const charts = getChartsByType();
          if (charts.distribution.length > 0) {
            return (
              <div className="section distribution-section">
                <h2 className="section-title">🥧 Distribution Analysis</h2>
                <div className="charts-container">
                  {charts.distribution.map((chart) => (
                    <div key={chart.id} className="chart-card">
                      <div className="chart-header">
                        <div>
                          <h3>{chart.title}</h3>
                          <p className="chart-description">{chart.description}</p>
                        </div>
                        <span className="chart-badge">{chart.type.toUpperCase()}</span>
                      </div>
                      <div className="chart-wrapper" style={{ height: '300px' }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        })()}

        {/* SECTION 5: ADVANCED ANALYSIS (Scatter & Correlation) */}
        {(() => {
          const charts = getChartsByType();
          if (charts.advanced.length > 0) {
            return (
              <div className="section advanced-section">
                <h2 className="section-title">🔬 Advanced Analysis</h2>
                <div className="charts-container">
                  {charts.advanced.map((chart) => (
                    <div key={chart.id} className="chart-card">
                      <div className="chart-header">
                        <div>
                          <h3>{chart.title}</h3>
                          <p className="chart-description">{chart.description}</p>
                        </div>
                        <span className="chart-badge">{chart.type.toUpperCase()}</span>
                      </div>
                      <div className="chart-wrapper" style={{ height: '350px' }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        })()}

        {/* SECTION 6: DATA TABLE */}
        {(() => {
          const charts = getChartsByType();
          if (charts.table.length > 0) {
            return (
              <div className="section table-section">
                <h2 className="section-title">📋 Detailed Data View</h2>
                <div className="table-card">
                  <div className="table-wrapper">
                    {renderChart(charts.table[0])}
                  </div>
                </div>
              </div>
            );
          }
        })()}

        {/* SECTION 7: CUSTOMIZE SECTION */}
        <div className="section customize-section">
          <h2 className="section-title">✨ Regenerate Dashboard</h2>
          <div className="customize-card">
            <p className="customize-description">
              Describe what changes you'd like to see in your dashboard. Our AI will regenerate the visualizations accordingly.
            </p>
            <div className="customize-form">
              <textarea
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Example: 'Show more focus on regional trends' or 'Add breakdown by customer segment'"
                rows="3"
              />
              <button
                onClick={() => regeneratePrompt && console.log('Regenerate:', regeneratePrompt)}
                disabled={regenerating}
                className="regenerate-btn"
              >
                {regenerating ? '🔄 Regenerating...' : '🎨 Regenerate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
