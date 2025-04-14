// frontend/src/FileUpload.jsx
import { useState } from 'react';
import TextEditor from './TextEditor';
import ReactMarkdown from 'react-markdown';
import ValidationResults from './ValidationResults';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [memo, setMemo] = useState('');
  const [memoStatus, setMemoStatus] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [isLoadingMemo, setIsLoadingMemo] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Define the backend URL based on the Vite environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleFileChange = (e) => {
    // Reset previous state when a new file is selected
    setFile(e.target.files[0]);
    setUploadStatus('');
    setExtractedText('');
    setUploadId('');
    setMemo('');
    setMemoStatus('');
    setHasEdits(false);
    setIsLoadingMemo(false);
    setValidationResults(null);
    setValidationError('');
    setSelectedText('');
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file.');
      return;
    }
    setUploadStatus('Uploading...');
    // Reset previous results before new upload
    setExtractedText('');
    setUploadId('');
    setMemo('');
    setMemoStatus('');
    setValidationResults(null);
    setValidationError('');
    setSelectedText('');
    setHasEdits(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/upload`, { // Updated URL
        method: 'POST',
        body: formData,
      });
      const data = await response.json(); // Get the JSON response from the backend

      console.log('Upload Response Data:', data);

      if (response.ok && data.extractedText) {
        setUploadStatus('Upload successful!');
        setExtractedText(data.extractedText); // Use extractedText from response
        setUploadId(data.uploadId); // Set uploadId from response
      } else {
        const errorMsg = data?.error || (data?.extractedText ? 'Upload ok but no text extracted.' : response.statusText) || 'Unknown upload error';
        setUploadStatus(`Error: ${errorMsg}`);
        setExtractedText('');
        setUploadId('');
        setMemo('');
      }
    } catch (err) {
      console.error("Upload fetch error:", err);
      setUploadStatus('Upload failed due to a network or server error.');
      setExtractedText('');
      setUploadId('');
      setMemo('');
    }
  };

  const handleSaveEditedContent = async (editedContent) => {
    if (!uploadId) {
      setUploadStatus('No upload ID available to save edits.');
      return;
    }
    setUploadStatus('Saving content...');
    try {
      const response = await fetch(`${backendUrl}/content/${encodeURIComponent(uploadId)}`, { // Updated URL
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent }),
      });
      const data = await response.json();
      if (response.ok) {
        setUploadStatus('Content saved successfully!');
        setHasEdits(true);
        setExtractedText(editedContent);
      } else {
        setUploadStatus(`Error saving content: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Save error:", err);
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
    setMemo('');
    setValidationResults(null);
    setValidationError('');
    setSelectedText('');

    try {
      const response = await fetch(`${backendUrl}/generate-memo/${encodeURIComponent(uploadId)}`, { // Updated URL
        method: 'POST',
      });
      const data = await response.json();
      console.log('Generate Memo Response Data:', data);

      if (response.ok && data.memo !== 'Error generating memo.') {
        setMemo(data.memo || '');
        setMemoStatus(`Memo generated successfully${hasEdits ? ' from edited content' : ' from original content'}!`);
      } else {
        const errorMsg = data?.error || (data.memo === 'Error generating memo.' ? 'Memo generation failed on server' : response.statusText) || 'Unknown memo generation error';
        setMemoStatus(`Error: ${errorMsg}`);
        setMemo('');
      }
    } catch (err) {
      console.error("Memo generation error:", err);
      setMemoStatus('Failed to generate memo due to a network or server error.');
      setMemo('');
    } finally {
      setIsLoadingMemo(false);
    }
  };

  const handleMemoMouseUp = () => {
    const text = window.getSelection().toString();
    if (text.trim() !== '') {
      setSelectedText(text);
    }
  };

  const handleValidateSelectedText = async () => {
    if (!selectedText || selectedText.trim() === '') {
      setMemoStatus('Please select some text in the memo to validate.');
      setValidationResults(null);
      setValidationError('');
      return;
    }
    setValidationLoading(true);
    setValidationError('');
    setMemoStatus(`Validating: "${selectedText.substring(0, 30)}..."`);
    setValidationResults(null);

    try {
      const response = await fetch(`${backendUrl}/validate-memo-content`, { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: selectedText }),
      });
      const data = await response.json();
      console.log('Validation Response Data:', data);

      if (response.ok) {
        setValidationResults(data.results || []);
        setMemoStatus('Validation complete.');
        if (!data.results || data.results.length === 0) {
          setMemoStatus('Validation complete. No relevant results found.');
        }
      } else {
        const errorMsg = data?.error || response.statusText || 'Validation failed.';
        setValidationError(errorMsg);
        setMemoStatus('');
      }
    } catch (err) {
      console.error("Validation error:", err);
      setValidationError('Failed to validate due to a network or server error.');
      setMemoStatus('');
    } finally {
      setValidationLoading(false);
    }
  };

  const handleCopyMemo = () => {
    if (!memo) {
      setMemoStatus('Nothing to copy.');
      return;
    }
    navigator.clipboard.writeText(memo)
      .then(() => setMemoStatus('Memo copied to clipboard!'))
      .catch((err) => {
        console.error("Copy error:", err);
        setMemoStatus('Failed to copy memo.');
      });
  };

  return (
    <div>
      <h2>Upload Pitch Deck</h2>
      <input type="file" onChange={handleFileChange} accept=".pdf,.ppt,.pptx" />
      <button onClick={handleUpload} disabled={!file || uploadStatus === 'Uploading...'}>
        {uploadStatus === 'Uploading...' ? 'Uploading...' : 'Upload'}
      </button>
      {uploadStatus && <p>{uploadStatus}</p>}

      {extractedText && uploadId && (
        <div style={{ marginTop: '20px' }}>
          <h3>Edit Extracted Content</h3>
          <TextEditor key={uploadId} initialContent={extractedText} onSave={handleSaveEditedContent} />
          <button onClick={handleGenerateMemo} disabled={isLoadingMemo} style={{ marginTop: '10px' }}>
            {isLoadingMemo ? 'Generating...' : 'Generate Memo'}
          </button>
          {memoStatus && <p>{memoStatus}</p>}
        </div>
      )}

      {(memo || isLoadingMemo) && (
        <div className="memo-container">
          <h3>Generated Investment Memo</h3>
          {isLoadingMemo ? (
            <p>Loading memo...</p>
          ) : (
            memo ? (
              <div className="memo-content" onMouseUp={handleMemoMouseUp}>
                <ReactMarkdown>{memo}</ReactMarkdown>
              </div>
            ) : (
              <p>Memo content is empty.</p>
            )
          )}
          {!isLoadingMemo && memo && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleCopyMemo}>Copy Memo</button>
              <button onClick={handleValidateSelectedText} disabled={!selectedText.trim() || validationLoading}>
                {validationLoading ? 'Validating...' : 'Validate Selected Text'}
              </button>
              {selectedText && !validationLoading && (
                 <span style={{ fontStyle: 'italic', color: '#888' }}>
                    Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                 </span>
              )}
            </div>
          )}

          {(validationLoading || validationError || validationResults) && (
            <div style={{ marginTop: '15px' }}>
                <ValidationResults
                    results={validationResults}
                    loading={validationLoading}
                    error={validationError}
                />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
