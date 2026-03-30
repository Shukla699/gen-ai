import { useState } from 'react';
import '../styles/FileUpload.css';

export default function FileUpload({ onDashboardGenerated }) {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExt)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a CSV, Excel, or JSON file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (prompt) {
      formData.append('prompt', prompt);
    }

    try {
      const response = await fetch('http://localhost:3000/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      onDashboardGenerated(result);
      setFile(null);
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="upload-card">
        <h1>AI Dashboard Generator</h1>
        <p className="subtitle">Upload your data and let AI create a beautiful dashboard</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="file-label">
              <div className="upload-area">
                <span className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                <p>
                  {file ? (
                    <span style={{ color: 'var(--accent)' }}>Selected: {file.name}</span>
                  ) : (
                    'Click to select a file or drag and drop'
                  )}
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </div>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="prompt">Describe your dashboard (optional):</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Show sales trends and top products' or leave blank for auto-detection"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={!file || loading} className="submit-btn">
            {loading ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Generating Dashboard...
              </>
            ) : (
              'Generate Dashboard'
            )}
          </button>
        </form>

        <div className="supported-formats">
          <p>Supported formats: CSV, Excel (.xlsx, .xls), JSON</p>
        </div>
      </div>
    </div>
  );
}
