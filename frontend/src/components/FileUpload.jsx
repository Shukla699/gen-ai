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
        <h1>📊 AI Dashboard Generator</h1>
        <p className="subtitle">Upload your data and let AI create a beautiful dashboard</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="file-label">
              <div className="upload-area">
                <span className="upload-icon">📁</span>
                <p>
                  {file ? `✓ ${file.name}` : 'Click to select a file or drag and drop'}
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
            {loading ? '🔄 Generating Dashboard...' : '✨ Generate Dashboard'}
          </button>
        </form>

        <div className="supported-formats">
          <p>📋 Supported formats: CSV, Excel (.xlsx, .xls), JSON</p>
        </div>
      </div>
    </div>
  );
}
