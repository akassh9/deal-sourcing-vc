import { useState } from 'react';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file.');
      return;
    }
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      console.log('Frontend received:', data); // Add this to debug
      if (response.ok) {
        setUploadStatus('Upload successful!');
        const text = data.extractedData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted.';
        setExtractedText(text);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setUploadStatus('Upload failed due to a network error.');
    }
  };

  return (
    <div>
      <h2>Upload Pitch Deck</h2>
      <input type="file" onChange={handleFileChange} accept=".pdf,.ppt,.pptx" />
      <button onClick={handleUpload}>Upload</button>
      <p>{uploadStatus}</p>

      {extractedText && (
        <div>
          <h3>Extracted Content:</h3>
          <p>{extractedText}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
