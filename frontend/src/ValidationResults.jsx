// frontend/src/ValidationResults.jsx
import React from 'react';

function ValidationResults({ results, loading, error }) {
  if (loading) return <p>Loading validation results...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!results || results.length === 0) return <p>No validation results.</p>;

  return (
    <div className="validation-results">
      <h3>Validation Results</h3>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              <strong>{result.title}</strong>
            </a>
            <p>{result.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ValidationResults;
