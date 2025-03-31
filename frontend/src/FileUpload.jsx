// frontend/src/FileUpload.jsx
import { useState } from 'react'; // Removed useEffect as it wasn't strictly necessary based on current flow
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
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json(); // Get the JSON response from the backend

      // Add this log to see exactly what the frontend receives
      console.log('Upload Response Data:', data);

      if (response.ok && data.extractedText) { // Check if response is ok AND extractedText exists
        setUploadStatus('Upload successful!');

        // --- THIS IS THE KEY PART ---
        // Use the 'extractedText' field directly from the response data
        setExtractedText(data.extractedText);
        // --- END KEY PART ---

        setUploadId(data.uploadId); // Set uploadId from response
        // Clear any previous memo/reasoning from prior uploads (already done at start of function)
      } else {
        // Use error message from backend response if available, or provide a default
        const errorMsg = data?.error || (data?.extractedText ? 'Upload ok but no text extracted.' : response.statusText) || 'Unknown upload error';
        setUploadStatus(`Error: ${errorMsg}`);
        setExtractedText(''); // Clear text on error
        setUploadId('');
        setMemo('');
      }
    } catch (err) {
      console.error("Upload fetch error:", err); // Log the actual error
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
    setUploadStatus('Saving content...'); // Indicate saving process
    try {
      const response = await fetch(`http://localhost:3001/content/${encodeURIComponent(uploadId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent }),
      });
      const data = await response.json();
      if (response.ok) {
        setUploadStatus('Content saved successfully!');
        setHasEdits(true); // Mark that edits have been saved
        // Update state locally to reflect saved content if TextEditor doesn't handle it
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
    setMemo(''); // Clear previous memo
    setValidationResults(null); // Clear previous validation results
    setValidationError('');
    setSelectedText('');

    try {
      const response = await fetch(`http://localhost:3001/generate-memo/${encodeURIComponent(uploadId)}`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Generate Memo Response Data:', data); // Log memo generation response

      if (response.ok && data.memo !== 'Error generating memo.') { // Check for specific error string too
        setMemo(data.memo || ''); // Ensure memo is set, even if empty string returned
        setMemoStatus(`Memo generated successfully${hasEdits ? ' from edited content' : ' from original content'}!`);
      } else {
        // Use error from response or provide default
        const errorMsg = data?.error || (data.memo === 'Error generating memo.' ? 'Memo generation failed on server' : response.statusText) || 'Unknown memo generation error';
        setMemoStatus(`Error: ${errorMsg}`);
        setMemo(''); // Clear memo on error
      }
    } catch (err) {
      console.error("Memo generation error:", err);
      setMemoStatus('Failed to generate memo due to a network or server error.');
      setMemo(''); // Clear memo on error
    } finally {
      setIsLoadingMemo(false);
    }
  };

  const handleMemoMouseUp = () => {
    const text = window.getSelection().toString();
    if (text.trim() !== '') { // Only set if selection is not just whitespace
      setSelectedText(text);
    }
  };

  const handleValidateSelectedText = async () => {
    if (!selectedText || selectedText.trim() === '') {
      // Use memoStatus for transient messages like this
      setMemoStatus('Please select some text in the memo to validate.');
      // Clear previous validation state
      setValidationResults(null);
      setValidationError('');
      return;
    }
    setValidationLoading(true);
    setValidationError(''); // Clear previous errors specifically
    setMemoStatus(`Validating: "${selectedText.substring(0, 30)}..."`); // Show snippet being validated
    setValidationResults(null); // Clear previous results

    try {
      const response = await fetch('http://localhost:3001/validate-memo-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: selectedText }),
      });
      const data = await response.json();
      console.log('Validation Response Data:', data); // Log validation response

      if (response.ok) {
        setValidationResults(data.results || []); // Ensure results is always an array
        setMemoStatus('Validation complete.'); // Clear validating message
        if (!data.results || data.results.length === 0) {
             setMemoStatus('Validation complete. No relevant results found.');
        }
      } else {
        const errorMsg = data?.error || response.statusText || 'Validation failed.';
        setValidationError(errorMsg); // Use specific error state
        setMemoStatus(''); // Clear validating message
      }
    } catch (err) {
      console.error("Validation error:", err);
      setValidationError('Failed to validate due to a network or server error.'); // Use specific error state
      setMemoStatus(''); // Clear validating message
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
      {/* Disable button during upload */}
      <button onClick={handleUpload} disabled={!file || uploadStatus === 'Uploading...'}>
        {uploadStatus === 'Uploading...' ? 'Uploading...' : 'Upload'}
      </button>
      {/* Display upload status message */}
      {uploadStatus && <p>{uploadStatus}</p>}

      {/* Show editor and generate button only after successful upload and text exists */}
      {extractedText && uploadId && (
        <div style={{ marginTop: '20px' }}> {/* Add margin */}
          <h3>Edit Extracted Content</h3>
          {/* Key prop forces re-render if initialContent changes, useful if user uploads new file */}
          <TextEditor key={uploadId} initialContent={extractedText} onSave={handleSaveEditedContent} />
          {/* Disable button during memo generation */}
          <button onClick={handleGenerateMemo} disabled={isLoadingMemo} style={{ marginTop: '10px' }}>
            {isLoadingMemo ? 'Generating...' : 'Generate Memo'}
          </button>
          {/* Display memo status message */}
          {memoStatus && <p>{memoStatus}</p>}
        </div>
      )}

      {/* Show memo section only when memo exists or is loading */}
      {(memo || isLoadingMemo) && (
        <div className="memo-container">
          <h3>Generated Investment Memo</h3>
          {isLoadingMemo ? (
            <p>Loading memo...</p>
          ) : (
            memo ? ( // Only render if memo is not empty
              <div className="memo-content" onMouseUp={handleMemoMouseUp}>
                {/* Use ReactMarkdown to render memo content */}
                <ReactMarkdown>{memo}</ReactMarkdown>
              </div>
            ) : (
              // Display message if memo generation resulted in empty content (and not loading)
              <p>Memo content is empty.</p>
            )
          )}
          {/* Buttons below memo: Show only if not loading and memo exists */}
          {!isLoadingMemo && memo && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleCopyMemo}>Copy Memo</button>
              {/* Disable validation button if no text selected or validation is loading */}
              <button onClick={handleValidateSelectedText} disabled={!selectedText.trim() || validationLoading}>
                {validationLoading ? 'Validating...' : 'Validate Selected Text'}
              </button>
              {/* Display currently selected text snippet */}
              {selectedText && !validationLoading && (
                 <span style={{ fontStyle: 'italic', color: '#888' }}>
                    Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                 </span>
              )}
            </div>
          )}

          {/* Validation Results Section: Show if loading, has error, or results exist */}
          {(validationLoading || validationError || validationResults) && (
            <div style={{marginTop: '15px'}}> {/* Add margin */}
                <ValidationResults
                    results={validationResults}
                    loading={validationLoading}
                    error={validationError} // Pass specific error state
                />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;