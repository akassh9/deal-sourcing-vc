import { useState } from 'react';
import TextEditor from './TextEditor';
import ReactMarkdown from 'react-markdown';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [memo, setMemo] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [memoStatus, setMemoStatus] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [isLoadingMemo, setIsLoadingMemo] = useState(false);

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
      if (response.ok) {
        setUploadStatus('Upload successful!');
        const text = data.extractedData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted.';
        setExtractedText(text);
        setUploadId(data.uploadId);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setUploadStatus('Upload failed due to a network error.');
    }
  };

  const handleSaveEditedContent = async (editedContent) => {
    if (!uploadId) {
      setUploadStatus('No upload ID available to save edits.');
      console.log('No uploadId:', uploadId);
      return;
    }

    console.log('Saving edits:', editedContent, 'for uploadId:', uploadId);
    try {
      const response = await fetch(`http://localhost:3001/content/${encodeURIComponent(uploadId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Content saved to backend:', data);
        setUploadStatus('Content saved successfully!');
        setHasEdits(true); // Mark that edits exist
      } else {
        console.error('Save error:', data);
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Network error saving content:', err);
      setUploadStatus('Failed to save content due to a network error.');
    }
  };

  const handleGenerateMemo = async () => {
    if (!uploadId) {
      setMemoStatus('No upload ID available to generate memo.');
      return;
    }
    setIsLoadingMemo(true);
    setMemoStatus('Generating memo...');
    try {
      const response = await fetch(`http://localhost:3001/generate-memo/${encodeURIComponent(uploadId)}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setMemo(data.memo);
        setReasoning(data.reasoning);
        setMemoStatus(`Memo generated successfully${hasEdits ? ' from edited content' : ' from original content'}!`);
      } else {
        setMemoStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setMemoStatus('Failed to generate memo due to a network error.');
    } finally {
      setIsLoadingMemo(false);
    }
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(memo)
      .then(() => setMemoStatus('Memo copied to clipboard!'))
      .catch(() => setMemoStatus('Failed to copy memo.'));
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
          <TextEditor initialContent={extractedText} onSave={handleSaveEditedContent} />
          <button onClick={handleGenerateMemo} style={{ marginTop: '10px' }}>
            Generate Memo
          </button>
          <p>{memoStatus}</p>
        </div>
      )}

      {memo && (
        <div className="memo-container">
          <h3>Generated Investment Memo</h3>
          {isLoadingMemo ? (
            <p>Loading memo...</p>
          ) : (
            <div className="memo-content">
              <ReactMarkdown>{memo}</ReactMarkdown>
            </div>
          )}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="toggle-reasoning"
              style={{ marginRight: '10px' }}
            >
              {showReasoning ? 'Hide Reasoning' : 'Show Reasoning'}
            </button>
            <button onClick={handleCopyMemo}>
              Copy Memo
            </button>
          </div>
          {showReasoning && (
            <div className="reasoning-content">
              <h4>Reasoning Steps</h4>
              <pre>{reasoning}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;