# 🛠️ Collaborative Code Editor

## 🚀 Overview

A real-time collaborative code editor built using **React**, **Node.js**, **WebSockets**, and **PostgreSQL**. It allows multiple users to write and edit code simultaneously in shared rooms, featuring live cursor tracking, file system management, and version control.

---

## 🧱 System Architecture

### 🔹 Frontend

* **Framework**: React 18 + TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS with `shadcn/ui` components
* **Routing**: Wouter
* **State Management**: TanStack React Query & React Hooks
* **Realtime**: WebSocket client for live updates

### 🔹 Backend

* **Runtime**: Node.js (Express.js + TypeScript)
* **Database**: PostgreSQL + Drizzle ORM
* **Realtime Engine**: WebSocket server
* **Sessions**: Stored in PostgreSQL
* **Hot Reload**: Vite integration for smooth development

---

## 🗓️ Database Schema

* **rooms**: Stores room metadata
* **room\_participants**: Tracks users, permissions, and cursor colors
* **files**: File/folder structure in each room
* **code\_versions**: Code history with timestamps

---

## ✨ Features

### 💬 Real-time Collaboration

* WebSocket-powered live code editing
* Live user cursors with color indicators
* Operational Transform (OT) for conflict resolution
* Presence tracking: who’s in the room

### 📁 File Management

* Hierarchical folder structure
* File creation, deletion, and editing
* Syntax highlighting based on language
* Tabbed editor interface

### 🔒 Access Control

* Unique room codes for collaboration
* Public vs Private room settings
* Role-based permissions (owner/participant)

### 🖥️ Editor UI

* VS Code-inspired theme (dark mode)
* Resizable split panels
* Activity sidebar to track changes

---

## 🔄 Data Flow

1. **User creates/joins room** via UI
2. **WebSocket** connection opens to backend
3. **Collaborative editing** begins:

   * Edits broadcast to all users
   * Cursor positions synchronized
   * OT resolves any conflicts
4. **File operations** (add/rename/delete) propagate across clients
5. **Versioning**: Automatic code snapshot saved to DB

---

## 📦 Dependencies

### Core

* `@neondatabase/serverless` – PostgreSQL driver
* `drizzle-orm` – Type-safe SQL wrapper
* `@tanstack/react-query` – Server state manager
* `ws` – WebSocket implementation

### UI & Styling

* `tailwindcss` – Utility-first styling
* `shadcn/ui` – Accessible React components
* `lucide-react` – Icon set
* `wouter` – Lightweight routing

### Development

* `tsx` – Fast TypeScript execution
* `esbuild` – Bundler for production
* `@replit/vite-plugin` – Replit-specific enhancements

---

## 🚀 Deployment

### Development Mode

* Frontend served via Vite dev server
* Backend runs on port `5000`
* Hot reload enabled

### Production Mode

* Vite builds static frontend
* `esbuild` bundles backend
* PostgreSQL hosted externally
* Hosted on Replit with autoscaling

### Environment Variables

* `DATABASE_URL` – PostgreSQL connection
* `NODE_ENV` – `development` or `production`

---

## 🛣️ Roadmap

* [x] Real-time collaborative editing
* [x] Multi-file folder structure
* [x] Role-based access control
* [x] Syntax highlighting for popular languages
* [x] Tabbed editor interface
* [x] Responsive, dark-themed UI
* [ ] Drag-and-drop file/folder UI
* [ ] Authentication via OAuth
* [ ] Replay version history with diffs
* [ ] Chat feature in rooms
* [ ] GitHub/GitLab sync integration
* [ ] Offline editing support with sync

---

## 🗓️ Changelog

* **June 25, 2025**: Initial setup

---

## 🙌 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](LICENSE)

---

## 💬 Contact

For questions or support, reach out via GitHub Issues.

---
