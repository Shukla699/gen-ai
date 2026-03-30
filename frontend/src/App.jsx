import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import ThemeSwitcher from './components/ThemeSwitcher';
import './App.css';

function AppContent() {
  const [dashboardData, setDashboardData] = useState(null);
  const [viewMode, setViewMode] = useState('upload');

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
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <svg className="brand-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
            <span className="brand-text">AI Dashboard</span>
          </div>
          <ThemeSwitcher />
        </div>
      </header>
      
      <main className="app-main">
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
            <div className="back-section">
              <button className="back-btn" onClick={handleBackClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Upload
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
