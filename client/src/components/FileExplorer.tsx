import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FileText,
  Circle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Room, FileItem } from "@shared/schema";

interface FileExplorerProps {
  room: Room;
}

export default function FileExplorer({ room }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1, 2]));
  const [activeFile, setActiveFile] = useState<number>(3);

  const { data: files = [] } = useQuery<FileItem[]>({
    queryKey: [`/api/rooms/${room.id}/files`],
    enabled: !!room.id,
  });

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isFolder) {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="w-4 h-4 text-warning-yellow" />
      ) : (
        <Folder className="w-4 h-4 text-warning-yellow" />
      );
    }

    switch (file.language) {
      case 'javascript':
        return <Circle className="w-4 h-4 text-yellow-400" />;
      case 'css':
        return <Circle className="w-4 h-4 text-blue-300" />;
      default:
        return <FileText className="w-4 h-4 text-editor-secondary" />;
    }
  };

  const renderFileTree = (parentId: number | null = null, depth = 0) => {
    const items = files.filter(file => file.parentId === parentId);
    
    return items.map(file => (
      <div key={file.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div 
          className={`flex items-center px-2 py-1 rounded cursor-pointer file-tree-item ${
            activeFile === file.id ? 'active' : ''
          }`}
          onClick={() => {
            if (file.isFolder) {
              toggleFolder(file.id);
            } else {
              setActiveFile(file.id);
            }
          }}
        >
          {file.isFolder && (
            <div className="w-4 mr-2 flex justify-center">
              {expandedFolders.has(file.id) ? (
                <ChevronDown className="w-3 h-3 text-editor-secondary" />
              ) : (
                <ChevronRight className="w-3 h-3 text-editor-secondary" />
              )}
            </div>
          )}
          {!file.isFolder && <div className="w-4 mr-2"></div>}
          
          {getFileIcon(file)}
          <span className="text-sm ml-2 text-editor-primary">{file.name}</span>
          
          {/* File status indicators */}
          {!file.isFolder && (
            <div className="ml-auto flex items-center space-x-1">
              {file.id === 3 && (
                <>
                  <div className="w-2 h-2 bg-accent-red rounded-full" title="User editing"></div>
                  <div className="w-2 h-2 bg-warning-yellow rounded-full animate-pulse-slow" title="Unsaved changes"></div>
                </>
              )}
            </div>
          )}
        </div>
        
        {file.isFolder && expandedFolders.has(file.id) && renderFileTree(file.id, depth + 1)}
      </div>
    ));
  };

  return (
    <aside className="w-64 panel-bg border-r border-editor flex flex-col">
      <div className="p-3 border-b border-editor">
        <h3 className="font-semibold text-sm mb-2 text-editor-primary">{room.name.toUpperCase()}</h3>
        <div className="flex items-center space-x-2 text-xs text-editor-secondary">
          <div className="w-2 h-2 bg-success-green rounded-full"></div>
          <span>Synced</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-2">
            <div className="flex items-center text-editor-secondary text-xs font-semibold mb-1 px-2">
              <FolderOpen className="w-3 h-3 mr-2" />
              EXPLORER
            </div>
          </div>
          
          <div className="space-y-1">
            {renderFileTree()}
          </div>
        </div>
      </div>
    </aside>
  );
}
