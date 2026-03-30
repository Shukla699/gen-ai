import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import './App.css';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [viewMode, setViewMode] = useState('upload'); // 'upload', 'traditional', 'eda'

  const handleDashboardGenerated = (data) => {
    setDashboardData(data);
    setViewMode('traditional');
  };

  const handleBackClick = () => {
    setDashboardData(null);
    setViewMode('upload');
  };

  const handleViewEDA = () => {
    setViewMode('eda');
  };

  return (
    <div className="app-container">
      {viewMode === 'upload' && (
        <div>
          <FileUpload onDashboardGenerated={handleDashboardGenerated} />
          <div className="quick-access">
            <button className="view-eda-btn" onClick={handleViewEDA}>
              📊 View EDA Dashboard
            </button>
          </div>
        </div>
      )}
      {viewMode === 'traditional' && dashboardData && (
        <Dashboard dashboardData={dashboardData} onBackClick={handleBackClick} />
      )}
      {viewMode === 'eda' && (
        <div>
          <EnhancedDashboard uploadedData={dashboardData} />
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <button className="back-btn" onClick={handleBackClick}>
              ← Back to Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
