import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ContentEditor.css';

interface ContentEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function ContentEditor({ value, onChange, placeholder }: ContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Save and restore cursor position
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  }, []);

  const restoreSelection = useCallback((range: Range | null) => {
    if (range) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized && value) {
      try {
        const content = value.startsWith('<') ? value : `<p>${value}</p>`;
        editorRef.current.innerHTML = content;
        setIsInitialized(true);
      } catch {
        editorRef.current.innerHTML = `<p>${value}</p>`;
        setIsInitialized(true);
      }
    } else if (editorRef.current && !isInitialized && !value) {
      editorRef.current.innerHTML = '';
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onChange?.(content);
  }, [onChange]);

  const execCommand = useCallback((command: string, value: string | boolean = false) => {
    const savedRange = saveSelection();
    
    // Focus the editor first
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Execute the command
    document.execCommand(command, false, value as string);
    
    // Restore selection if needed
    if (savedRange && command !== 'undo' && command !== 'redo') {
      setTimeout(() => restoreSelection(savedRange), 10);
    }
    
    // Update content
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [saveSelection, restoreSelection, onChange]);

  const insertTable = useCallback(() => {
    const savedRange = saveSelection();
    
    // Ask user for table dimensions
    const rowsInput = prompt('Number of rows (including header):', '3');
    const colsInput = prompt('Number of columns:', '3');
    
    if (!rowsInput || !colsInput) return; // User cancelled
    
    const rows = parseInt(rowsInput, 10);
    const cols = parseInt(colsInput, 10);
    
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1 || rows > 20 || cols > 10) {
      alert('Please enter valid numbers (rows: 1-20, columns: 1-10)');
      return;
    }
    
    // Generate table HTML
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; color: inherit;">';
    
    // Generate header row
    tableHTML += '<thead><tr>';
    for (let col = 1; col <= cols; col++) {
      tableHTML += `<th style="border: 1px solid #dee2e6; padding: 12px; background-color: #f8f9fa; color: inherit; text-align: left;">Header ${col}</th>`;
    }
    tableHTML += '</tr></thead>';
    
    // Generate body rows
    tableHTML += '<tbody>';
    for (let row = 2; row <= rows; row++) {
      tableHTML += '<tr>';
      for (let col = 1; col <= cols; col++) {
        tableHTML += `<td style="border: 1px solid #dee2e6; padding: 12px; color: inherit;">Cell ${row}-${col}</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br></p>';
    
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, tableHTML);
      onChange?.(editorRef.current.innerHTML);
    }
  }, [saveSelection, onChange]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url && editorRef.current) {
      editorRef.current.focus();
      const img = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" /><p><br></p>`;
      document.execCommand('insertHTML', false, img);
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const changeFontColor = useCallback(() => {
    const color = prompt('Enter color (hex code like #000000 or color name like red):');
    if (color) {
      execCommand('foreColor', color);
    }
  }, [execCommand]);

  const changeBackgroundColor = useCallback(() => {
    const color = prompt('Enter background color (hex code like #ffff00 or color name like yellow):');
    if (color) {
      execCommand('backColor', color);
    }
  }, [execCommand]);

  // Handle paste events to clean up content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="content-editor">
      <div className="editor-toolbar">
        <button type="button" onClick={() => execCommand('undo')} className="toolbar-btn" title="Undo">
          ↶
        </button>
        <button type="button" onClick={() => execCommand('redo')} className="toolbar-btn" title="Redo">
          ↷
        </button>
        
        <div className="toolbar-divider" />
        
        <button type="button" onClick={() => execCommand('bold')} className="toolbar-btn" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="toolbar-btn" title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="toolbar-btn" title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => execCommand('strikeThrough')} className="toolbar-btn" title="Strikethrough">
          <s>S</s>
        </button>
        
        <div className="toolbar-divider" />
        
        <button type="button" onClick={changeFontColor} className="toolbar-btn" title="Text Color">
          🎨 Color
        </button>
        <button type="button" onClick={changeBackgroundColor} className="toolbar-btn" title="Background Color">
          🖍️ Highlight
        </button>
        
        <div className="toolbar-divider" />
        
        <select 
          className="toolbar-select"
          onChange={(e) => {
            if (e.target.value) {
              execCommand('formatBlock', e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
        >
          <option value="">Format</option>
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        
        <div className="toolbar-divider" />
        
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Bullet List">
          • List
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="toolbar-btn" title="Numbered List">
          1. List
        </button>
        
        <div className="toolbar-divider" />
        
        <button type="button" onClick={() => execCommand('justifyLeft')} className="toolbar-btn" title="Align Left">
          ⬅
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="toolbar-btn" title="Align Center">
          ⬌
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="toolbar-btn" title="Align Right">
          ➡
        </button>
        
        <div className="toolbar-divider" />
        
        <button type="button" onClick={insertLink} className="toolbar-btn" title="Insert Link">
          🔗 Link
        </button>
        <button type="button" onClick={insertImage} className="toolbar-btn" title="Insert Image">
          🖼️ Image
        </button>
        <button type="button" onClick={insertTable} className="toolbar-btn" title="Insert Table">
          📊 Table
        </button>
      </div>
      
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
    </div>
  );
}

// Helper function to convert HTML content for preview
export function lexicalStateToHtml(content: string): string {
  // Since we're storing HTML directly, just return it
  return content || '';
}