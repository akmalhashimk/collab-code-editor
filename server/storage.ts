import { 
  rooms, 
  roomParticipants, 
  codeVersions, 
  files,
  type Room, 
  type InsertRoom, 
  type RoomParticipant, 
  type InsertRoomParticipant,
  type CodeVersion,
  type InsertCodeVersion,
  type FileItem,
  type InsertFile
} from "@shared/schema";

export interface IStorage {
  // Room management
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByName(name: string): Promise<Room | undefined>;
  updateRoomCode(id: number, code: string): Promise<Room | undefined>;
  
  // Participant management
  addParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  getParticipants(roomId: number): Promise<RoomParticipant[]>;
  removeParticipant(roomId: number, userId: string): Promise<void>;
  
  // File management
  createFile(file: InsertFile): Promise<FileItem>;
  getFiles(roomId: number): Promise<FileItem[]>;
  updateFile(id: number, content: string): Promise<FileItem | undefined>;
  deleteFile(id: number): Promise<void>;
  
  // Version control
  saveVersion(version: InsertCodeVersion): Promise<CodeVersion>;
  getVersions(roomId: number): Promise<CodeVersion[]>;
}

export class MemStorage implements IStorage {
  private rooms: Map<number, Room>;
  private participants: Map<number, RoomParticipant>;
  private files: Map<number, FileItem>;
  private versions: Map<number, CodeVersion>;
  private currentRoomId: number;
  private currentParticipantId: number;
  private currentFileId: number;
  private currentVersionId: number;

  constructor() {
    this.rooms = new Map();
    this.participants = new Map();
    this.files = new Map();
    this.versions = new Map();
    this.currentRoomId = 1;
    this.currentParticipantId = 1;
    this.currentFileId = 1;
    this.currentVersionId = 1;
    
    // Initialize with default room and files
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultRoom: Room = {
      id: 1,
      name: "react-todo-app",
      code: `import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import './index.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo,
        completed: false
      }]);
      setNewTodo('');
    }
  };

  return (
    <div className="app">
      <h1>Todo App</h1>
      <div className="todo-input">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <TodoList todos={todos} setTodos={setTodos} />
    </div>
  );
}

export default App;`,
      language: "javascript",
      createdAt: new Date(),
      isPublic: true
    };

    this.rooms.set(1, defaultRoom);

    // Default files
    const defaultFiles: FileItem[] = [
      {
        id: 1,
        roomId: 1,
        name: "src",
        content: "",
        language: "folder",
        path: "/src",
        isFolder: true,
        parentId: null
      },
      {
        id: 2,
        roomId: 1,
        name: "components",
        content: "",
        language: "folder",
        path: "/src/components",
        isFolder: true,
        parentId: 1
      },
      {
        id: 3,
        roomId: 1,
        name: "App.jsx",
        content: defaultRoom.code,
        language: "javascript",
        path: "/src/components/App.jsx",
        isFolder: false,
        parentId: 2
      },
      {
        id: 4,
        roomId: 1,
        name: "TodoList.jsx",
        content: `import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, setTodos }) {
  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo} 
          todos={todos} 
          setTodos={setTodos} 
        />
      ))}
    </div>
  );
}

export default TodoList;`,
        language: "javascript",
        path: "/src/components/TodoList.jsx",
        isFolder: false,
        parentId: 2
      },
      {
        id: 5,
        roomId: 1,
        name: "TodoItem.jsx",
        content: `import React from 'react';

function TodoItem({ todo, todos, setTodos }) {
  const toggleTodo = () => {
    setTodos(todos.map(t => 
      t.id === todo.id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = () => {
    setTodos(todos.filter(t => t.id !== todo.id));
  };

  return (
    <div className="todo-item">
      <input 
        type="checkbox" 
        checked={todo.completed}
        onChange={toggleTodo}
      />
      <span className={todo.completed ? 'completed' : ''}>
        {todo.text}
      </span>
      <button onClick={deleteTodo}>Delete</button>
    </div>
  );
}

export default TodoItem;`,
        language: "javascript",
        path: "/src/components/TodoItem.jsx",
        isFolder: false,
        parentId: 2
      },
      {
        id: 6,
        roomId: 1,
        name: "index.css",
        content: `.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.todo-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.todo-input button {
  padding: 10px 20px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-item.completed {
  text-decoration: line-through;
  opacity: 0.6;
}`,
        language: "css",
        path: "/src/index.css",
        isFolder: false,
        parentId: 1
      }
    ];

    defaultFiles.forEach(file => {
      this.files.set(file.id, file);
      this.currentFileId = Math.max(this.currentFileId, file.id + 1);
    });

    this.currentRoomId = 2;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = { 
      ...insertRoom, 
      id, 
      createdAt: new Date() 
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.name === name);
  }

  async updateRoomCode(id: number, code: string): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (room) {
      const updatedRoom = { ...room, code };
      this.rooms.set(id, updatedRoom);
      return updatedRoom;
    }
    return undefined;
  }

  async addParticipant(insertParticipant: InsertRoomParticipant): Promise<RoomParticipant> {
    const id = this.currentParticipantId++;
    const participant: RoomParticipant = { 
      ...insertParticipant, 
      id, 
      joinedAt: new Date() 
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipants(roomId: number): Promise<RoomParticipant[]> {
    return Array.from(this.participants.values()).filter(p => p.roomId === roomId);
  }

  async removeParticipant(roomId: number, userId: string): Promise<void> {
    const toRemove = Array.from(this.participants.entries()).find(
      ([_, p]) => p.roomId === roomId && p.userId === userId
    );
    if (toRemove) {
      this.participants.delete(toRemove[0]);
    }
  }

  async createFile(insertFile: InsertFile): Promise<FileItem> {
    const id = this.currentFileId++;
    const file: FileItem = { ...insertFile, id };
    this.files.set(id, file);
    return file;
  }

  async getFiles(roomId: number): Promise<FileItem[]> {
    return Array.from(this.files.values()).filter(f => f.roomId === roomId);
  }

  async updateFile(id: number, content: string): Promise<FileItem | undefined> {
    const file = this.files.get(id);
    if (file) {
      const updatedFile = { ...file, content };
      this.files.set(id, updatedFile);
      return updatedFile;
    }
    return undefined;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  async saveVersion(insertVersion: InsertCodeVersion): Promise<CodeVersion> {
    const id = this.currentVersionId++;
    const version: CodeVersion = { 
      ...insertVersion, 
      id, 
      createdAt: new Date() 
    };
    this.versions.set(id, version);
    return version;
  }

  async getVersions(roomId: number): Promise<CodeVersion[]> {
    return Array.from(this.versions.values())
      .filter(v => v.roomId === roomId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
