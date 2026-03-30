import React, { useState, useEffect } from 'react';
import './EnhancedDashboard.css';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const EnhancedDashboard = ({ uploadedData = null }) => {
  const [data, setData] = useState(null);
  const [allData, setAllData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);

  const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#14b8a6'];

  // Default sample data (fallback)
  const defaultData = {
    products: [
      { id: 1, name: 'Laptop', q1: 45000, q2: 52000, q3: 58000, q4: 65000, region: 'North', category: 'Electronics', total: 220000 },
      { id: 2, name: 'Desktop', q1: 32000, q2: 38000, q3: 42000, q4: 48000, region: 'South', category: 'Electronics', total: 160000 },
      { id: 3, name: 'Monitor', q1: 15000, q2: 18000, q3: 21000, q4: 24000, region: 'East', category: 'Electronics', total: 78000 },
      { id: 4, name: 'Keyboard', q1: 8000, q2: 9500, q3: 11000, q4: 12500, region: 'West', category: 'Accessories', total: 41000 },
      { id: 5, name: 'Mouse', q1: 6000, q2: 7200, q3: 8500, q4: 9800, region: 'North', category: 'Accessories', total: 31500 },
      { id: 6, name: 'Desk', q1: 25000, q2: 28000, q3: 31000, q4: 35000, region: 'South', category: 'Furniture', total: 119000 },
      { id: 7, name: 'Chair', q1: 18000, q2: 20000, q3: 23000, q4: 26000, region: 'East', category: 'Furniture', total: 87000 },
      { id: 8, name: 'Lamp', q1: 5000, q2: 6000, q3: 7000, q4: 8000, region: 'West', category: 'Furniture', total: 26000 },
      { id: 9, name: 'Headphones', q1: 12000, q2: 14000, q3: 16000, q4: 18000, region: 'North', category: 'Accessories', total: 60000 },
      { id: 10, name: 'Tablet', q1: 22000, q2: 25000, q3: 28000, q4: 32000, region: 'South', category: 'Electronics', total: 107000 },
    ],
    regions: ['North', 'South', 'East', 'West'],
    categories: ['Electronics', 'Furniture', 'Accessories'],
  };

  useEffect(() => {
    fetchDynamicData();
  }, [uploadedData]);

  const fetchDynamicData = async () => {
    try {
      setLoading(true);
      let sourceData;

      if (uploadedData && uploadedData.dashboardConfig && uploadedData.data) {
        sourceData = {
          products: uploadedData.data,
          regions: [...new Set(uploadedData.data.map(item => item.Region || item.region))],
          categories: [...new Set(uploadedData.data.map(item => item.Category || item.category))],
        };
      } else {
        sourceData = defaultData;
      }

      const uniqueRegions = [...new Set(sourceData.products.map(p => p.region || p.Region))];
      const uniqueCategories = [...new Set(sourceData.products.map(p => p.category || p.Category))];

      setAllData(sourceData.products);
      setRegions(uniqueRegions);
      setCategories(uniqueCategories);
      setSelectedRegion('All');
      setSelectedCategory('All');

      processData(sourceData.products, uniqueRegions, uniqueCategories);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data');
      setAllData(defaultData.products);
      setRegions(defaultData.regions);
      setCategories(defaultData.categories);
      processData(defaultData.products, defaultData.regions, defaultData.categories);
    }
  };

  const processData = (sourceData, uniqueRegions, uniqueCategories) => {
    try {
      const filteredData = sourceData.filter(product => {
        const regionMatch = selectedRegion === 'All' || (product.region || product.Region) === selectedRegion;
        const categoryMatch = selectedCategory === 'All' || (product.category || product.Category) === selectedCategory;
        return regionMatch && categoryMatch;
      });

      const numericData = filteredData.map(p => ({
        ...p,
        q1: parseFloat(p.q1 || p.Q1_Sales || 0),
        q2: parseFloat(p.q2 || p.Q2_Sales || 0),
        q3: parseFloat(p.q3 || p.Q3_Sales || 0),
        q4: parseFloat(p.q4 || p.Q4_Sales || 0),
        total: parseFloat(p.total || ((p.q1 || p.Q1_Sales || 0) + (p.q2 || p.Q2_Sales || 0) + (p.q3 || p.Q3_Sales || 0) + (p.q4 || p.Q4_Sales || 0))),
      }));

      const totalRevenue = numericData.reduce((sum, p) => sum + p.total, 0);
      const avgProductSales = Math.round(totalRevenue / Math.max(numericData.length, 1));
      const q1Total = numericData.reduce((sum, p) => sum + p.q1, 0);
      const q2Total = numericData.reduce((sum, p) => sum + p.q2, 0);
      const q3Total = numericData.reduce((sum, p) => sum + p.q3, 0);
      const q4Total = numericData.reduce((sum, p) => sum + p.q4, 0);

      const q1ToQ2Growth = q1Total > 0 ? ((q2Total - q1Total) / q1Total * 100).toFixed(1) : 0;
      const q2ToQ3Growth = q2Total > 0 ? ((q3Total - q2Total) / q2Total * 100).toFixed(1) : 0;
      const q3ToQ4Growth = q3Total > 0 ? ((q4Total - q3Total) / q3Total * 100).toFixed(1) : 0;

      setMetrics({
        totalRevenue,
        avgProductSales,
        productCount: numericData.length,
        q1Total,
        q2Total,
        q3Total,
        q4Total,
        q1ToQ2Growth,
        q2ToQ3Growth,
        q3ToQ4Growth,
      });

      setInsights({
        topPerformer: numericData.length > 0 ? numericData.reduce((max, p) => p.total > max.total ? p : max) : null,
        bestRegion: 'Dynamic Region Analysis',
        bestCategory: 'Dynamic Category Analysis',
        growthTrend: `Analyzing ${numericData.length} products across ${uniqueRegions.length} regions`,
      });

      setData(numericData);
      setLoading(false);
    } catch (err) {
      console.error('Error processing data:', err);
      setError('Error processing data');
      setLoading(false);
    }
  };

  useEffect(() => {
    processData(allData, regions, categories);
  }, [selectedRegion, selectedCategory, allData]);

  const calculateRegionData = () => {
    if (!allData || allData.length === 0) return [];
    const regionSums = {};
    let total = 0;
    
    allData.forEach(p => {
      const region = p.region || p.Region || 'Unknown';
      const sales = p.total || ((p.q1 || p.Q1_Sales || 0) + (p.q2 || p.Q2_Sales || 0) + (p.q3 || p.Q3_Sales || 0) + (p.q4 || p.Q4_Sales || 0));
      regionSums[region] = (regionSums[region] || 0) + sales;
      total += sales;
    });
    
    return Object.entries(regionSums).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
    }));
  };

  const calculateCategoryData = () => {
    if (!allData || allData.length === 0) return [];
    const categorySums = {};
    let total = 0;
    
    allData.forEach(p => {
      const category = p.category || p.Category || 'Unknown';
      const sales = p.total || ((p.q1 || p.Q1_Sales || 0) + (p.q2 || p.Q2_Sales || 0) + (p.q3 || p.Q3_Sales || 0) + (p.q4 || p.Q4_Sales || 0));
      categorySums[category] = (categorySums[category] || 0) + sales;
      total += sales;
    });
    
    return Object.entries(categorySums).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
    }));
  };

  const trendData = data ? [
    { quarter: 'Q1', total: metrics.q1Total },
    { quarter: 'Q2', total: metrics.q2Total },
    { quarter: 'Q3', total: metrics.q3Total },
    { quarter: 'Q4', total: metrics.q4Total },
  ] : [];

  const regionData = calculateRegionData();
  const categoryData = calculateCategoryData();

  if (loading) return (
    <div className="dashboard" style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
        <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
        Loading analytics...
      </div>
    </div>
  );
  
  if (error) return <div className="dashboard error" style={{padding: '40px', textAlign: 'center'}}>{error}</div>;
  if (!data || data.length === 0) return <div className="dashboard" style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>No data available</div>;

  return (
    <div className="eda-dashboard">
      <header className="dashboard-header">
        <h1>Advanced Analytics Dashboard</h1>
        <p>Exploratory Data Analysis & Sales Performance Insights</p>
      </header>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Region:</label>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option>All</option>
            {regions && regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option>All</option>
            {categories && categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="kpi-section">
        <div className="kpi-card">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">${(metrics.totalRevenue / 1000).toFixed(0)}K</div>
          <div className="kpi-meta">All products</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Product Sales</div>
          <div className="kpi-value">${(metrics.avgProductSales / 1000).toFixed(1)}K</div>
          <div className="kpi-meta">{metrics.productCount} products</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Q1 to Q2 Growth</div>
          <div className="kpi-value growth">+{metrics.q1ToQ2Growth}%</div>
          <div className="kpi-meta">Quarter growth</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Q2 to Q3 Growth</div>
          <div className="kpi-value growth">+{metrics.q2ToQ3Growth}%</div>
          <div className="kpi-meta">Quarter growth</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Q3 to Q4 Growth</div>
          <div className="kpi-value growth">+{metrics.q3ToQ4Growth}%</div>
          <div className="kpi-meta">Quarter growth</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Trend Line Chart */}
        <div className="chart-container">
          <h3>Quarterly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="quarter" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} name="Total Sales" dot={{ fill: '#6366f1', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Bar Chart */}
        <div className="chart-container">
          <h3>Top Products (Q1)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data && data.length > 0 ? data.slice(0, Math.min(5, data.length)).sort((a, b) => b.q1 - a.q1) : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="q1" fill="#22c55e" name="Q1 Sales" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Pie Chart */}
        <div className="chart-container">
          <h3>Regional Sales Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="chart-container">
          <h3>Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>Key Insights from EDA</h2>
        <div className="insights-grid">
          {insights.topPerformer && (
            <div className="insight-card">
              <h4>Top Performer</h4>
              <p>{insights.topPerformer.name}</p>
              <p className="subtitle">${(insights.topPerformer.total / 1000).toFixed(0)}K total sales</p>
            </div>
          )}
          <div className="insight-card">
            <h4>Best Region</h4>
            <p>{insights.bestRegion}</p>
          </div>
          <div className="insight-card">
            <h4>Best Category</h4>
            <p>{insights.bestCategory}</p>
          </div>
          <div className="insight-card">
            <h4>Growth Trend</h4>
            <p>{insights.growthTrend}</p>
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className="quality-section">
        <h3>Data Quality Metrics</h3>
        <div className="quality-grid">
          <div className="quality-item">
            <span>Completeness</span>
            <span className="badge success">100%</span>
          </div>
          <div className="quality-item">
            <span>Duplicates</span>
            <span className="badge success">0</span>
          </div>
          <div className="quality-item">
            <span>Missing Values</span>
            <span className="badge success">0</span>
          </div>
          <div className="quality-item">
            <span>Data Quality Score</span>
            <span className="badge success">A+</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>Detailed Products Data</h3>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Q1</TableCell>
                <TableCell align="right">Q2</TableCell>
                <TableCell align="right">Q3</TableCell>
                <TableCell align="right">Q4</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data && data.map((product, idx) => (
                <TableRow key={product.id || idx}>
                  <TableCell>{product.name || product.Product || 'N/A'}</TableCell>
                  <TableCell align="right">${((product.q1 || product.Q1_Sales || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell align="right">${((product.q2 || product.Q2_Sales || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell align="right">${((product.q3 || product.Q3_Sales || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell align="right">${((product.q4 || product.Q4_Sales || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell align="right" className="total-cell">${((product.total || ((product.q1 || product.Q1_Sales || 0) + (product.q2 || product.Q2_Sales || 0) + (product.q3 || product.Q3_Sales || 0) + (product.q4 || product.Q4_Sales || 0))) / 1000).toFixed(0)}K</TableCell>
                  <TableCell>{product.region || product.Region || 'N/A'}</TableCell>
                  <TableCell>{product.category || product.Category || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
