import { useState } from 'react';
import TextEditor from './TextEditor';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [uploadId, setUploadId] = useState('');

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
      console.log('Frontend received:', data); // Full response
      if (response.ok) {
        setUploadStatus('Upload successful!');
        const text =
          data.extractedData?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'No text extracted.';
        setExtractedText(text);
        console.log('Extracted text set to:', text);
        setUploadId(data.uploadId); // Should be "Kecha Pitch Deck.pdf"
        console.log('Upload ID set to:', data.uploadId); // Debug
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setUploadStatus('Upload failed due to a network error.');
    }
  };

  const handleSaveEditedContent = async (editedContent) => {
    if (!uploadId) {
      setUploadStatus('No upload ID available to save edits.');
      console.log('No uploadId:', uploadId); // Debug
      return;
    }

    console.log('Saving edits:', editedContent, 'for uploadId:', uploadId); // Debug
    try {
      const response = await fetch(`http://localhost:3001/content/${encodeURIComponent(uploadId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent }),
      });

      const data = await response.json();
      console.log('PUT response:', data); // Debug
      if (response.ok) {
        console.log('Content saved to backend:', data);
        setUploadStatus('Content saved successfully!');
      } else {
        console.error('Save error:', data);
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Network error saving content:', err);
      setUploadStatus('Failed to save content due to a network error.');
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
          <h3>Edit Extracted Content</h3>
          <TextEditor
            initialContent={extractedText}
            onSave={handleSaveEditedContent}
          />
        </div>
      )}
    </div>
  );
}

export default FileUpload;