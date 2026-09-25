import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { FlowchartProject, FlowchartVersion } from './src/types/flowchart';
import { TEMPLATES } from './src/constants/templates';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws-collab' });

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'flowcharts.json');

app.use(express.json({ limit: '15mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory database of projects
let projectsDatabase: Record<string, FlowchartProject> = {};

function initDefaultDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      projectsDatabase = JSON.parse(data);
      if (Object.keys(projectsDatabase).length > 0) return;
    } catch (err) {
      console.error('Failed reading existing flowcharts.json, re-initializing', err);
    }
  }

  // Seed with default initial project
  const initialTemplate = TEMPLATES[0]; // Auth Flow
  const defaultId = 'project-default';
  const now = Date.now();
  const initialVersion: FlowchartVersion = {
    id: `ver-${now}`,
    timestamp: now,
    name: 'نسخه اولیه سیستم (Initial Setup)',
    author: 'سیستم (System)',
    nodeCount: initialTemplate.nodes.length,
    edgeCount: initialTemplate.edges.length,
    nodes: initialTemplate.nodes,
    edges: initialTemplate.edges,
  };

  const initialPageId = 'page-1';
  const defaultProject: FlowchartProject = {
    id: defaultId,
    title: 'فلوچارت احراز هویت و تأیید دو مرحله‌ای',
    description: 'نمودار جریان احراز هویت کاربران، کنترل دسترسی و تایید پیامک',
    createdAt: now,
    updatedAt: now,
    theme: 'slate',
    activePageId: initialPageId,
    pages: [
      {
        id: initialPageId,
        name: 'صفحه اصلی - جریان ورود',
        nodes: initialTemplate.nodes,
        edges: initialTemplate.edges,
      },
    ],
    nodes: initialTemplate.nodes,
    edges: initialTemplate.edges,
    versions: [initialVersion],
  };

  projectsDatabase[defaultId] = defaultProject;
  persistToDisk();
}

function persistToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projectsDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting projects to disk:', err);
  }
}

initDefaultDatabase();

// --- REST Endpoints ---
app.get('/api/projects', (req, res) => {
  const summary = Object.values(projectsDatabase).map((p) => {
    // Ensure pages exist
    const pages = p.pages && p.pages.length > 0
      ? p.pages
      : [{ id: 'page-1', name: 'صفحه ۱', nodes: p.nodes || [], edges: p.edges || [] }];
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      theme: p.theme,
      nodeCount: p.nodes?.length || 0,
      edgeCount: p.edges?.length || 0,
      pageCount: pages.length,
      versionCount: p.versions?.length || 0,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    };
  });
  res.json(summary);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projectsDatabase[req.params.id];
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  // Ensure pages array is populated for older projects
  if (!project.pages || project.pages.length === 0) {
    project.pages = [
      {
        id: 'page-1',
        name: 'صفحه ۱',
        nodes: project.nodes || [],
        edges: project.edges || [],
      },
    ];
    project.activePageId = 'page-1';
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { title, theme, nodes, edges, pages, description } = req.body;
  const now = Date.now();
  const id = `project-${Math.random().toString(36).substring(2, 9)}`;
  const defaultPageId = 'page-1';

  const initialPages =
    pages && pages.length > 0
      ? pages
      : [
          {
            id: defaultPageId,
            name: 'صفحه ۱',
            nodes: nodes || [],
            edges: edges || [],
          },
        ];

  const activeNodes = initialPages[0].nodes;
  const activeEdges = initialPages[0].edges;

  const newProject: FlowchartProject = {
    id,
    title: title || 'پروژه فلوچارت جدید',
    description: description || '',
    theme: theme || 'slate',
    createdAt: now,
    updatedAt: now,
    activePageId: initialPages[0].id,
    pages: initialPages,
    nodes: activeNodes,
    edges: activeEdges,
    versions: [
      {
        id: `ver-${now}`,
        timestamp: now,
        name: 'نسخه آغازین',
        author: 'کاربر',
        nodeCount: activeNodes.length,
        edgeCount: activeEdges.length,
        nodes: activeNodes,
        edges: activeEdges,
      },
    ],
  };
  projectsDatabase[id] = newProject;
  persistToDisk();
  res.json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const project = projectsDatabase[id];
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { title, theme, nodes, edges, pages, activePageId, description } = req.body;
  project.updatedAt = Date.now();
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (theme !== undefined) project.theme = theme;
  if (nodes !== undefined) project.nodes = nodes;
  if (edges !== undefined) project.edges = edges;
  if (pages !== undefined) project.pages = pages;
  if (activePageId !== undefined) project.activePageId = activePageId;

  persistToDisk();
  res.json({ success: true, project });
});

// Duplicate project
app.post('/api/projects/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const source = projectsDatabase[id];
  if (!source) {
    return res.status(404).json({ error: 'Source project not found' });
  }

  const now = Date.now();
  const newId = `project-${Math.random().toString(36).substring(2, 9)}`;
  const clonedProject: FlowchartProject = JSON.parse(JSON.stringify(source));
  clonedProject.id = newId;
  clonedProject.title = `${source.title} (کپی)`;
  clonedProject.createdAt = now;
  clonedProject.updatedAt = now;

  projectsDatabase[newId] = clonedProject;
  persistToDisk();
  res.json({ success: true, project: clonedProject });
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  if (projectsDatabase[id]) {
    delete projectsDatabase[id];
    
    // If no projects remain, recreate default
    if (Object.keys(projectsDatabase).length === 0) {
      initDefaultDatabase();
    } else {
      persistToDisk();
    }
    return res.json({ success: true, message: 'Project deleted' });
  }
  res.status(404).json({ error: 'Project not found' });
});

// Create named snapshot version
app.post('/api/projects/:id/snapshots', (req, res) => {
  const { id } = req.params;
  const project = projectsDatabase[id];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { name, author } = req.body;
  const now = Date.now();
  const newVersion: FlowchartVersion = {
    id: `ver-${now}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    name: name || `نسخه ${new Date().toLocaleTimeString('fa-IR')}`,
    author: author || 'عضو تیم',
    nodeCount: project.nodes.length,
    edgeCount: project.edges.length,
    nodes: JSON.parse(JSON.stringify(project.nodes)),
    edges: JSON.parse(JSON.stringify(project.edges)),
  };

  project.versions.unshift(newVersion);
  // Keep max 30 versions
  if (project.versions.length > 30) {
    project.versions = project.versions.slice(0, 30);
  }
  project.updatedAt = now;
  persistToDisk();

  // Broadcast version creation to websocket clients in room
  broadcastToRoom(id, {
    type: 'version_saved',
    version: newVersion,
  });

  res.json({ success: true, version: newVersion });
});

// Restore snapshot version
app.post('/api/projects/:id/restore/:snapshotId', (req, res) => {
  const { id, snapshotId } = req.params;
  const project = projectsDatabase[id];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const targetVersion = project.versions.find((v) => v.id === snapshotId);
  if (!targetVersion) return res.status(404).json({ error: 'Snapshot not found' });

  const now = Date.now();
  // Record current state before restore as backup version
  const backupVersion: FlowchartVersion = {
    id: `ver-${now}-pre-restore`,
    timestamp: now,
    name: `پشتیبان قبل از بازگردانی ${targetVersion.name}`,
    author: 'سیستم',
    nodeCount: project.nodes.length,
    edgeCount: project.edges.length,
    nodes: JSON.parse(JSON.stringify(project.nodes)),
    edges: JSON.parse(JSON.stringify(project.edges)),
  };

  project.nodes = JSON.parse(JSON.stringify(targetVersion.nodes));
  project.edges = JSON.parse(JSON.stringify(targetVersion.edges));
  project.updatedAt = now;
  project.versions.unshift(backupVersion);

  persistToDisk();

  // Broadcast restored state to all clients in room
  broadcastToRoom(id, {
    type: 'batch_sync',
    nodes: project.nodes,
    edges: project.edges,
    restoredFrom: targetVersion.name,
  });

  res.json({ success: true, project });
});

// --- WebSocket Real-Time Rooms & Collaboration ---
interface RoomClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  userColor: string;
  projectId: string;
  cursor?: { x: number; y: number } | null;
}

const rooms: Record<string, RoomClient[]> = {};

function broadcastToRoom(projectId: string, message: any, excludeWs?: WebSocket) {
  const clients = rooms[projectId];
  if (!clients) return;
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function broadcastPresence(projectId: string) {
  const clients = rooms[projectId] || [];
  const presenceList = clients.map((c) => ({
    id: c.userId,
    name: c.userName,
    color: c.userColor,
    cursor: c.cursor,
  }));
  broadcastToRoom(projectId, {
    type: 'presence',
    users: presenceList,
  });
}

wss.on('connection', (ws) => {
  let currentClient: RoomClient | null = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'join') {
        const { projectId, user } = msg;
        if (!rooms[projectId]) {
          rooms[projectId] = [];
        }

        currentClient = {
          ws,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          projectId,
          cursor: null,
        };

        rooms[projectId].push(currentClient);
        broadcastPresence(projectId);
      } else if (msg.type === 'cursor' && currentClient) {
        currentClient.cursor = { x: msg.x, y: msg.y };
        broadcastToRoom(
          currentClient.projectId,
          {
            type: 'cursor_move',
            userId: currentClient.userId,
            userName: currentClient.userName,
            userColor: currentClient.userColor,
            x: msg.x,
            y: msg.y,
          },
          ws
        );
      } else if (msg.type === 'node_update' && currentClient) {
        const project = projectsDatabase[currentClient.projectId];
        if (project) {
          const index = project.nodes.findIndex((n) => n.id === msg.node.id);
          if (index >= 0) {
            project.nodes[index] = msg.node;
          } else {
            project.nodes.push(msg.node);
          }
          project.updatedAt = Date.now();
        }
        broadcastToRoom(currentClient.projectId, msg, ws);
      } else if (msg.type === 'node_delete' && currentClient) {
        const project = projectsDatabase[currentClient.projectId];
        if (project) {
          project.nodes = project.nodes.filter((n) => n.id !== msg.nodeId);
          project.edges = project.edges.filter(
            (e) => e.sourceNodeId !== msg.nodeId && e.targetNodeId !== msg.nodeId
          );
          project.updatedAt = Date.now();
        }
        broadcastToRoom(currentClient.projectId, msg, ws);
      } else if (msg.type === 'edge_update' && currentClient) {
        const project = projectsDatabase[currentClient.projectId];
        if (project) {
          const index = project.edges.findIndex((e) => e.id === msg.edge.id);
          if (index >= 0) {
            project.edges[index] = msg.edge;
          } else {
            project.edges.push(msg.edge);
          }
          project.updatedAt = Date.now();
        }
        broadcastToRoom(currentClient.projectId, msg, ws);
      } else if (msg.type === 'edge_delete' && currentClient) {
        const project = projectsDatabase[currentClient.projectId];
        if (project) {
          project.edges = project.edges.filter((e) => e.id !== msg.edgeId);
          project.updatedAt = Date.now();
        }
        broadcastToRoom(currentClient.projectId, msg, ws);
      } else if (msg.type === 'batch_sync' && currentClient) {
        const project = projectsDatabase[currentClient.projectId];
        if (project) {
          project.nodes = msg.nodes;
          project.edges = msg.edges;
          project.updatedAt = Date.now();
        }
        broadcastToRoom(currentClient.projectId, msg, ws);
      } else if (msg.type === 'chat' && currentClient) {
        broadcastToRoom(currentClient.projectId, {
          type: 'chat',
          message: {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: currentClient.userId,
            userName: currentClient.userName,
            userColor: currentClient.userColor,
            text: msg.text,
            timestamp: Date.now(),
          },
        });
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentClient && rooms[currentClient.projectId]) {
      rooms[currentClient.projectId] = rooms[currentClient.projectId].filter(
        (c) => c.ws !== ws
      );
      broadcastPresence(currentClient.projectId);
    }
  });
});

// Debounced save
setInterval(() => {
  persistToDisk();
}, 10000);

// Mount Vite or serve static
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowCraft server listening on port ${PORT}`);
  });
}

startServer();
