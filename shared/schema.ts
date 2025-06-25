import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  language: text("language").default("javascript"),
  createdAt: timestamp("created_at").defaultNow(),
  isPublic: boolean("is_public").default(true),
});

export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  color: text("color").notNull(),
  isOwner: boolean("is_owner").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const codeVersions = pgTable("code_versions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  name: text("name").notNull(),
  content: text("content").default(""),
  language: text("language").default("javascript"),
  path: text("path").notNull(),
  isFolder: boolean("is_folder").default(false),
  parentId: integer("parent_id"),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true });
export const insertParticipantSchema = createInsertSchema(roomParticipants).omit({ id: true, joinedAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true });
export const insertVersionSchema = createInsertSchema(codeVersions).omit({ id: true, createdAt: true });

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertParticipantSchema>;
export type CodeVersion = typeof codeVersions.$inferSelect;
export type InsertCodeVersion = z.infer<typeof insertVersionSchema>;
export type FileItem = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

// WebSocket message types
export interface WebSocketMessage {
  type: 'codeChange' | 'cursorMove' | 'userJoin' | 'userLeave' | 'fileChange' | 'chat';
  payload: any;
  userId: string;
  username: string;
  roomId: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  userId: string;
  username: string;
  color: string;
}

export interface CodeChange {
  content: string;
  changes: any[];
  version: number;
}
