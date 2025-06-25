import { useRef, useEffect, useState } from "react";
import { X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserCursor from "./UserCursor";
import type { Room, CursorPosition } from "@shared/schema";

interface EditorProps {
  room: Room;
  code: string;
  onCodeChange: (code: string) => void;
  cursors: CursorPosition[];
  onCursorMove: (position: { line: number; column: number }) => void;
}

export default function Editor({ room, code, onCodeChange, cursors, onCursorMove }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState("App.jsx");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  // Mock tabs for demo
  const tabs = [
    { name: "App.jsx", language: "javascript", active: true, hasChanges: true },
    { name: "TodoList.jsx", language: "javascript", active: false, hasChanges: false },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = code;
    }
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onCodeChange(newCode);
    setHasUnsavedChanges(true);
  };

  const handleCursorMove = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const position = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, position);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    setCursorPosition({ line, column });
    onCursorMove({ line, column });
  };

  const renderLineNumbers = () => {
    const lines = (code || "").split('\n').length;
    return Array.from({ length: Math.max(lines, 20) }, (_, i) => (
      <div key={i + 1} className="text-editor-secondary text-right text-sm leading-6 select-none">
        {i + 1}
      </div>
    ));
  };

  const renderSyntaxHighlighting = (text: string) => {
    // Basic syntax highlighting for JSX/JavaScript
    return text
      .replace(/(import|export|const|let|var|function|return|if|else|for|while|class|extends)\b/g, 
        '<span class="text-blue-400">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
        '<span class="text-green-400">$1$2$1</span>')
      .replace(/\/\/.*$/gm, 
        '<span class="text-gray-500">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, 
        '<span class="text-gray-500">$&</span>')
      .replace(/\b(\d+)\b/g, 
        '<span class="text-yellow-300">$1</span>')
      .replace(/(<\/?[a-zA-Z][^>]*>)/g, 
        '<span class="text-red-400">$1</span>');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab bar */}
      <div className="panel-bg border-b border-editor flex items-center">
        <div className="flex">
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className={`flex items-center px-4 py-2 space-x-2 cursor-pointer border-r border-editor ${
                tab.active ? 'tab-active' : 'tab-inactive'
              }`}
              onClick={() => setActiveTab(tab.name)}
            >
              <Circle className="w-3 h-3 text-blue-400" />
              <span className="text-sm">{tab.name}</span>
              {tab.hasChanges && (
                <div className="w-2 h-2 bg-warning-yellow rounded-full"></div>
              )}
              <Button variant="ghost" size="sm" className="p-0 h-4 w-4 text-editor-secondary hover:text-editor-primary">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div className="w-16 panel-bg border-r border-editor p-4 font-mono text-sm">
            {renderLineNumbers()}
          </div>
          
          {/* Code editor */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-editor-primary font-mono text-sm leading-6 resize-none border-none outline-none"
              style={{ 
                background: 'var(--editor-bg)',
                caretColor: 'var(--text-primary)',
                whiteSpace: 'pre',
                wordWrap: 'normal',
                overflowWrap: 'normal'
              }}
              onChange={handleCodeChange}
              onSelect={handleCursorMove}
              onKeyUp={handleCursorMove}
              onClick={handleCursorMove}
              spellCheck={false}
              defaultValue={code}
            />
            
            {/* Syntax highlighted overlay */}
            <div 
              className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-hidden"
              style={{ 
                color: 'transparent',
                whiteSpace: 'pre',
                wordWrap: 'normal',
                overflowWrap: 'normal'
              }}
              dangerouslySetInnerHTML={{ 
                __html: renderSyntaxHighlighting(code || "") 
              }}
            />

            {/* User cursors */}
            {cursors.map((cursor) => (
              <UserCursor key={cursor.userId} cursor={cursor} />
            ))}
          </div>
        </div>

        {/* Live collaboration indicator */}
        <div className="absolute top-4 right-4 panel-bg border border-editor rounded-lg p-3 text-xs">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-success-green rounded-full"></div>
            <span className="text-editor-primary">Live Collaboration</span>
          </div>
          <div className="space-y-1">
            {cursors.slice(0, 2).map((cursor) => (
              <div key={cursor.userId} className="flex items-center space-x-2 text-editor-secondary">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cursor.color }}
                ></div>
                <span>{cursor.username} at line {cursor.line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
      }
                
