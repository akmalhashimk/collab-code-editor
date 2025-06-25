import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertParticipantSchema, insertFileSchema, insertVersionSchema, type WebSocketMessage } from "@shared/schema";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  roomId: string;
  color: string;
}

const connectedClients = new Map<string, ConnectedClient>();
const roomClients = new Map<string, Set<string>>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Room routes
  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to get room" });
    }
  });

  app.get("/api/rooms/name/:name", async (req, res) => {
    try {
      const room = await storage.getRoomByName(req.params.name);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to get room" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  // Participant routes
  app.get("/api/rooms/:id/participants", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const participants = await storage.getParticipants(roomId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants" });
    }
  });

  // File routes
  app.get("/api/rooms/:id/files", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const files = await storage.getFiles(roomId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  app.post("/api/rooms/:id/files", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const fileData = insertFileSchema.parse({ ...req.body, roomId });
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const { content } = req.body;
      const file = await storage.updateFile(fileId, content);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Version routes
  app.get("/api/rooms/:id/versions", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const versions = await storage.getVersions(roomId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get versions" });
    }
  });

  app.post("/api/rooms/:id/versions", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const versionData = insertVersionSchema.parse({ ...req.body, roomId });
      const version = await storage.saveVersion(versionData);
      res.status(201).json(version);
    } catch (error) {
      res.status(400).json({ message: "Invalid version data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let clientId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        if (message.type === 'userJoin') {
          clientId = `${message.userId}-${Date.now()}`;
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          const client: ConnectedClient = {
            ws,
            userId: message.userId,
            username: message.username,
            roomId: message.roomId,
            color
          };
          
          connectedClients.set(clientId, client);
          
          if (!roomClients.has(message.roomId)) {
            roomClients.set(message.roomId, new Set());
          }
          roomClients.get(message.roomId)!.add(clientId);

          // Add participant to storage
          try {
            await storage.addParticipant({
              roomId: parseInt(message.roomId),
              userId: message.userId,
              username: message.username,
              color,
              isOwner: false
            });
          } catch (error) {
            // Participant might already exist, that's ok
          }

          // Notify others in the room
          broadcastToRoom(message.roomId, {
            type: 'userJoin',
            payload: { userId: message.userId, username: message.username, color },
            userId: message.userId,
            username: message.username,
            roomId: message.roomId
          }, clientId);

          // Send current participants to the new user
          const participants = await storage.getParticipants(parseInt(message.roomId));
          ws.send(JSON.stringify({
            type: 'participantsList',
            payload: participants
          }));
        }
        
        else if (message.type === 'codeChange') {
          // Update room code
          await storage.updateRoomCode(parseInt(message.roomId), message.payload.content);
          
          // Broadcast to other clients in the room
          broadcastToRoom(message.roomId, message, clientId);
        }
        
        else if (message.type === 'cursorMove') {
          // Broadcast cursor position to other clients
          broadcastToRoom(message.roomId, message, clientId);
        }
        
        else if (message.type === 'fileChange') {
          if (message.payload.fileId) {
            await storage.updateFile(message.payload.fileId, message.payload.content);
          }
          broadcastToRoom(message.roomId, message, clientId);
        }
        
        else if (message.type === 'chat') {
          broadcastToRoom(message.roomId, message, clientId);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (clientId) {
        const client = connectedClients.get(clientId);
        if (client) {
          // Remove from room
          const roomSet = roomClients.get(client.roomId);
          if (roomSet) {
            roomSet.delete(clientId);
            if (roomSet.size === 0) {
              roomClients.delete(client.roomId);
            }
          }

          // Remove participant from storage
          await storage.removeParticipant(parseInt(client.roomId), client.userId);

          // Notify others
          broadcastToRoom(client.roomId, {
            type: 'userLeave',
            payload: { userId: client.userId, username: client.username },
            userId: client.userId,
            username: client.username,
            roomId: client.roomId
          }, clientId);
          
          connectedClients.delete(clientId);
        }
      }
    });
  });

  function broadcastToRoom(roomId: string, message: WebSocketMessage, excludeClientId?: string) {
    const roomSet = roomClients.get(roomId);
    if (roomSet) {
      roomSet.forEach(clientId => {
        if (clientId !== excludeClientId) {
          const client = connectedClients.get(clientId);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
          }
        }
      });
    }
  }

  return httpServer;
           }
          
