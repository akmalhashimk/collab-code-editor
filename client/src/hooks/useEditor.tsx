import { useState, useCallback, useRef, useEffect } from "react";

export interface EditorState {
  content: string;
  cursorPosition: { line: number; column: number };
  selection: { start: number; end: number };
}

export function useEditor(initialContent: string = "") {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const updateCursorPosition = useCallback((position: { line: number; column: number }) => {
    setCursorPosition(position);
  }, []);

  const updateSelection = useCallback((sel: { start: number; end: number }) => {
    setSelection(sel);
  }, []);

  const insertText = useCallback((text: string, position?: number) => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const insertPosition = position ?? textarea.selectionStart;
      const newContent = content.slice(0, insertPosition) + text + content.slice(insertPosition);
      setContent(newContent);
      
      // Update cursor position after insertion
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = insertPosition + text.length;
        textarea.focus();
      }, 0);
    }
  }, [content]);

  const getLineFromPosition = useCallback((position: number): number => {
    const textBeforePosition = content.slice(0, position);
    return textBeforePosition.split('\n').length;
  }, [content]);

  const getColumnFromPosition = useCallback((position: number): number => {
    const textBeforePosition = content.slice(0, position);
    const lines = textBeforePosition.split('\n');
    return lines[lines.length - 1].length + 1;
  }, [content]);

  const handleSelectionChange = useCallback(() => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      setSelection({ start, end });
      
      const line = getLineFromPosition(start);
      const column = getColumnFromPosition(start);
      setCursorPosition({ line, column });
    }
  }, [getLineFromPosition, getColumnFromPosition]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return {
    content,
    cursorPosition,
    selection,
    editorRef,
    updateContent,
    updateCursorPosition,
    updateSelection,
    insertText,
    handleSelectionChange,
    getLineFromPosition,
    getColumnFromPosition
  };
}

