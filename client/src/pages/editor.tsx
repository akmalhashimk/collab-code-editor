import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Users, Share2, Code, Wifi, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Editor from "@/components/Editor";
import FileExplorer from "@/components/FileExplorer";
import ActivityPanel from "@/components/ActivityPanel";
import ShareModal from "@/components/ShareModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Room, RoomParticipant } from "@shared/schema";

export default function EditorPage() {
  const { roomName } = useParams<{ roomName?: string }>();
  const currentRoomName = roomName || "react-todo-app";
  const [showShareModal, setShowShareModal] = useState(false);
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [username] = useState(() => `User${Math.floor(Math.random() * 1000)}`);

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: [`/api/rooms/name/${currentRoomName}`],
    enabled: !!currentRoomName,
  });

  const { data: participants = [] } = useQuery<RoomParticipant[]>({
    queryKey: [`/api/rooms/${room?.id}/participants`],
    enabled: !!room?.id,
  });

  const { 
    isConnected, 
    connectedUsers, 
    sendMessage, 
    currentCode, 
    cursors 
  } = useWebSocket(room?.id?.toString() || "1", userId, username);

  if (isLoadingRoom) {
    return (
      <div className="editor-container h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-vscode-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-editor-secondary">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="editor-container h-screen flex items-center justify-center">
        <div className="text-center">
          <Code className="w-16 h-16 text-editor-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Room Not Found</h1>
          <p className="text-editor-secondary">The requested collaboration room could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container h-screen flex flex-col">
      {/* Header */}
      <header className="panel-bg border-b border-editor h-12 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="text-vscode-blue text-lg" />
            <span className="font-semibold text-editor-primary">CodeSync</span>
          </div>
          <div className="text-editor-secondary text-sm">
            Room: <span className="text-warning-yellow font-mono">{room.name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User presence indicators */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {connectedUsers.slice(0, 3).map((user, index) => (
                <div 
                  key={user.userId}
                  className="w-8 h-8 rounded-full border-2 border-panel-bg flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.username}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {connectedUsers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-editor-secondary border-2 border-panel-bg flex items-center justify-center text-xs font-semibold text-white">
                  +{connectedUsers.length - 3}
                </div>
              )}
            </div>
            <span className="text-editor-secondary text-sm flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {connectedUsers.length} online
            </span>
          </div>
          
          <Button 
            onClick={() => setShowShareModal(true)}
            className="bg-vscode-blue hover:bg-blue-600 text-white"
            size="sm"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Room
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <FileExplorer room={room} />

        {/* Main Editor */}
        <main className="flex-1 flex flex-col">
          <Editor 
            room={room}
            code={currentCode || room.code || ""}
            onCodeChange={(code) => {
              sendMessage({
                type: 'codeChange',
                payload: { content: code, changes: [] },
                userId,
                username,
                roomId: room.id.toString()
              });
            }}
            cursors={cursors}
            onCursorMove={(position) => {
              sendMessage({
                type: 'cursorMove',
                payload: position,
                userId,
                username,
                roomId: room.id.toString()
              });
            }}
          />
        </main>

        {/* Activity Panel */}
        <ActivityPanel 
          room={room} 
          participants={connectedUsers}
          onSaveVersion={() => {
            // TODO: Implement save version
          }}
        />
      </div>

      {/* Status bar */}
      <div className="bg-vscode-blue h-6 flex items-center justify-between px-4 text-xs text-white">
        <div className="flex items-center space-x-4">
          <span>JavaScript React</span>
          <span>UTF-8</span>
          <span>LF</span>
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3" />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Ln 1, Col 1</span>
          <span>{connectedUsers.length} collaborators</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-red-300'}`}></div>
            <span>Auto-sync</span>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        room={room}
      />
    </div>
  );
          }
