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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
              View EDA Dashboard
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
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <button className="back-btn" onClick={handleBackClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
