import { useEffect, useState, useRef, useCallback } from "react";
import type { WebSocketMessage, CursorPosition } from "@shared/schema";

interface ConnectedUser {
  userId: string;
  username: string;
  color: string;
}

export function useWebSocket(roomId: string, userId: string, username: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [currentCode, setCurrentCode] = useState<string>("");
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
      
      // Send join message
      sendMessage({
        type: 'userJoin',
        payload: {},
        userId,
        username,
        roomId
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'userJoin':
            if (message.userId !== userId) {
              setConnectedUsers(prev => {
                const exists = prev.find(user => user.userId === message.userId);
                if (!exists) {
                  return [...prev, {
                    userId: message.userId,
                    username: message.username,
                    color: message.payload.color
                  }];
                }
                return prev;
              });
            }
            break;
            
          case 'userLeave':
            setConnectedUsers(prev => 
              prev.filter(user => user.userId !== message.userId)
            );
            setCursors(prev => 
              prev.filter(cursor => cursor.userId !== message.userId)
            );
            break;
            
          case 'codeChange':
            if (message.userId !== userId) {
              setCurrentCode(message.payload.content);
            }
            break;
            
          case 'cursorMove':
            if (message.userId !== userId) {
              setCursors(prev => {
                const filtered = prev.filter(cursor => cursor.userId !== message.userId);
                const user = connectedUsers.find(u => u.userId === message.userId);
                if (user) {
                  return [...filtered, {
                    ...message.payload,
                    userId: message.userId,
                    username: message.username,
                    color: user.color
                  }];
                }
                return filtered;
              });
            }
            break;
            
          case 'participantsList':
            setConnectedUsers(message.payload.map((p: any) => ({
              userId: p.userId,
              username: p.username,
              color: p.color
            })));
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
  }, [roomId, userId, username, connectedUsers]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Add current user to connected users if not already present
  useEffect(() => {
    setConnectedUsers(prev => {
      const exists = prev.find(user => user.userId === userId);
      if (!exists) {
        return [...prev, {
          userId,
          username,
          color: '#007ACC' // Default blue color for current user
        }];
      }
      return prev;
    });
  }, [userId, username]);

  return {
    isConnected,
    connectedUsers,
    sendMessage,
    currentCode,
    cursors
  };
}
