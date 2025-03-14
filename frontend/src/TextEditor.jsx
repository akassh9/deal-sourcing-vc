import { useState } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

// Initialize Markdown parser
const mdParser = new MarkdownIt();

function TextEditor({ initialContent, onSave }) {
  const [content, setContent] = useState(initialContent || '');

  const handleEditorChange = ({ text }) => {
    setContent(text); // Update content with Markdown text
  };

  const handleSaveClick = () => {
    onSave(content); // Send raw Markdown text to parent
  };

  const handleResetClick = () => {
    setContent(initialContent || ''); // Reset to original Markdown
  };

  return (
    <div className="editor-container">
      <MdEditor
        value={content}
        style={{ height: '400px' }} // Set editor height
        renderHTML={(text) => mdParser.render(text)} // Render Markdown preview
        onChange={handleEditorChange}
        view={{ menu: true, md: true, html: true }} // Show toolbar, Markdown, and preview
        canView={{
          menu: true,
          md: true,
          html: true,
          fullScreen: false, // Disable fullscreen for simplicity
        }}
        plugins={['header', 'font-bold', 'font-italic', 'list-unordered', 'list-ordered', 'clear']}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleSaveClick} style={{ marginRight: '10px' }}>
          Save Changes
        </button>
        <button onClick={handleResetClick}>
          Reset to Original
        </button>
      </div>
    </div>
  );
}

export default TextEditor;