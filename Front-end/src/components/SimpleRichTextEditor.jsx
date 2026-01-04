/**
 * Simple Rich Text Editor Component
 * Basit bir zengin metin editörü - Bold, Italic, Underline, Liste desteği
 */
import React, { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

const SimpleRichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = '', 
  minHeight = 200,
  label,
  required = false,
  hint
}) => {
  const editorRef = useRef(null);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // Trigger onChange with updated HTML
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const ToolbarButton = ({ icon: Icon, command, title }) => (
    <button
      type="button"
      onClick={() => execCommand(command)}
      title={title}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'transparent',
        borderRadius: 6,
        cursor: 'pointer',
        color: '#4B5563',
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#F3F4F6';
        e.target.style.color = '#1F2937';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
        e.target.style.color = '#4B5563';
      }}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          fontSize: 14, 
          fontWeight: 500,
          color: '#374151'
        }}>
          {label} {required && '*'}
        </label>
      )}
      
      <div style={{
        border: '2px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
      onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          borderBottom: '1px solid #E5E7EB',
          background: '#FAFAFA'
        }}>
          <ToolbarButton icon={Bold} command="bold" title="Kalın (Ctrl+B)" />
          <ToolbarButton icon={Italic} command="italic" title="İtalik (Ctrl+I)" />
          <ToolbarButton icon={Underline} command="underline" title="Altı Çizili (Ctrl+U)" />
          
          <div style={{ 
            width: 1, 
            height: 20, 
            background: '#E5E7EB', 
            margin: '0 8px' 
          }} />
          
          <ToolbarButton icon={List} command="insertUnorderedList" title="Madde İşaretli Liste" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numaralı Liste" />
        </div>
        
        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: value || '' }}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: 16,
            outline: 'none',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#374151',
            background: '#FFFFFF',
            fontFamily: 'inherit'
          }}
        />
      </div>
      
      {hint && (
        <div style={{ 
          fontSize: 11, 
          color: '#9CA3AF', 
          marginTop: 6 
        }}>
          {hint}
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin-left: 20px;
          margin-bottom: 8px;
        }
        [contenteditable] li {
          margin-bottom: 4px;
        }
        [contenteditable] p {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichTextEditor;

