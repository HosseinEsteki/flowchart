/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlowchartNode,
  FlowchartEdge,
  FlowchartNodeType,
  FlowchartProject,
  FlowchartPage,
  FlowchartVersion,
  Collaborator,
  ChatMessage,
} from './types/flowchart';
import { THEMES } from './constants/themes';
import { TRANSLATIONS } from './constants/translations';
import { TEMPLATES } from './constants/templates';
import { Point, getNodeBoundingBox } from './utils/canvasMath';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CollaborationModal } from './components/CollaborationModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PagesBar } from './components/PagesBar';
import { ProjectsModal, ProjectSummary } from './components/ProjectsModal';

const DEFAULT_PROJECT_ID = 'project-default';

function ensureProjectPages(p: FlowchartProject): FlowchartProject {
  const pages =
    p.pages && p.pages.length > 0
      ? p.pages
      : [
          {
            id: 'page-1',
            name: 'صفحه ۱',
            nodes: p.nodes || [],
            edges: p.edges || [],
          },
        ];

  const activePageId =
    p.activePageId && pages.some((pg) => pg.id === p.activePageId)
      ? p.activePageId
      : pages[0].id;

  const activePage = pages.find((pg) => pg.id === activePageId) || pages[0];

  return {
    ...p,
    pages,
    activePageId,
    nodes: activePage.nodes || [],
    edges: activePage.edges || [],
  };
}

function syncProjectWithPages(p: FlowchartProject): FlowchartProject {
  const curPages =
    p.pages && p.pages.length > 0
      ? p.pages
      : [
          {
            id: 'page-1',
            name: 'صفحه ۱',
            nodes: p.nodes || [],
            edges: p.edges || [],
          },
        ];

  const activePageId =
    p.activePageId && curPages.some((pg) => pg.id === p.activePageId)
      ? p.activePageId
      : curPages[0].id;

  const updatedPages = curPages.map((pg) =>
    pg.id === activePageId
      ? { ...pg, nodes: p.nodes, edges: p.edges }
      : pg
  );

  return {
    ...p,
    pages: updatedPages,
    activePageId,
  };
}

export default function App() {
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  const t = TRANSLATIONS[lang];

  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('flowcraft_backup_project');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.theme && THEMES[parsed.theme]) {
          return parsed.theme;
        }
      }
    } catch (_) {}
    return 'slate';
  });
  const currentTheme = THEMES[activeThemeId] || THEMES.slate;

  // Project state
  const [project, setProject] = useState<FlowchartProject>(() => {
    try {
      const cached = localStorage.getItem('flowcraft_backup_project');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.nodes || parsed.pages)) {
          return ensureProjectPages(parsed);
        }
      }
    } catch (_) {}

    const initialTmpl = TEMPLATES[0];
    const now = Date.now();
    const defaultPageId = 'page-1';
    return {
      id: DEFAULT_PROJECT_ID,
      title: 'فلوچارت احراز هویت و تأیید دو مرحله‌ای',
      createdAt: now,
      updatedAt: now,
      theme: 'slate',
      activePageId: defaultPageId,
      pages: [
        {
          id: defaultPageId,
          name: 'صفحه اصلی - جریان ورود',
          nodes: initialTmpl.nodes,
          edges: initialTmpl.edges,
        },
      ],
      nodes: initialTmpl.nodes,
      edges: initialTmpl.edges,
      versions: [
        {
          id: `ver-${now}`,
          timestamp: now,
          name: 'نسخه آغازین خودکار',
          author: 'سیستم',
          nodeCount: initialTmpl.nodes.length,
          edgeCount: initialTmpl.edges.length,
          nodes: initialTmpl.nodes,
          edges: initialTmpl.edges,
        },
      ],
    };
  });

  // Projects list state
  const [projectsList, setProjectsList] = useState<ProjectSummary[]>([]);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<Array<{ nodes: FlowchartNode[]; edges: FlowchartEdge[] }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ nodes: FlowchartNode[]; edges: FlowchartEdge[] }>>([]);

  // Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Canvas viewport
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 40, y: 30 });
  const [gridMode, setGridMode] = useState<'dots' | 'lines' | 'none'>('dots');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Saving indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // User Identity
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substring(2, 7)}`);
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    const names = ['مهندس احمدی', 'سارا رضایی', 'علی محمدی', 'نیما حسینی', 'پریسا کاظمی'];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [currentUserColor, setCurrentUserColor] = useState<string>(() => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  // Teammates & Chat
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleSendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat',
          message: {
            id: `msg-${Date.now()}`,
            userId: currentUserId,
            userName: currentUserName,
            userColor: currentUserColor,
            text,
            timestamp: Date.now(),
          },
        })
      );
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Clipboard for copy/paste
  const clipboardNodeRef = useRef<FlowchartNode | null>(null);

  // Record undo state before modifying
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-25),
      {
        nodes: JSON.parse(JSON.stringify(project.nodes)),
        edges: JSON.parse(JSON.stringify(project.edges)),
      },
    ]);
    setRedoStack([]);
  }, [project.nodes, project.edges]);

  // Load Projects list from backend API
  const loadProjectsList = useCallback(() => {
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectsList(data);
          try {
            localStorage.setItem('flowcraft_projects_list', JSON.stringify(data));
          } catch (_) {}
        }
      })
      .catch((err) => {
        console.warn('Projects list load note:', err?.message || err);
        try {
          const cached = localStorage.getItem('flowcraft_projects_list');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setProjectsList(parsed);
          }
        } catch (_) {}
      });
  }, []);

  // Load initial projects list & project
  useEffect(() => {
    loadProjectsList();

    fetch(`/api/projects/${DEFAULT_PROJECT_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data && (data.nodes || data.pages)) {
          const normalized = ensureProjectPages(data);
          setProject(normalized);
          if (normalized.theme && THEMES[normalized.theme]) {
            setActiveThemeId(normalized.theme);
          }
        }
      })
      .catch((err) => {
        console.warn('Initial project fetch note (using local cache):', err.message);
        try {
          const cached = localStorage.getItem('flowcraft_backup_project');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.nodes || parsed.pages)) {
              const normalized = ensureProjectPages(parsed);
              setProject(normalized);
              if (normalized.theme && THEMES[normalized.theme]) {
                setActiveThemeId(normalized.theme);
              }
            }
          }
        } catch (_) {}
      });
  }, [loadProjectsList]);

  // WebSocket real-time connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-collab`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onerror = (err) => {
        console.warn('Real-time connection note (running local):', err);
      };
    } catch (e) {
      console.warn('WebSocket init note:', e);
      return;
    }

    ws.onopen = () => {
      ws?.send(
        JSON.stringify({
          type: 'join',
          projectId: project.id || DEFAULT_PROJECT_ID,
          user: {
            id: currentUserId,
            name: currentUserName,
            color: currentUserColor,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'presence') {
          setCollaborators(msg.users);
        } else if (msg.type === 'cursor_move') {
          setCollaborators((prev) =>
            prev.map((c) =>
              c.id === msg.userId ? { ...c, cursor: { x: msg.x, y: msg.y } } : c
            )
          );
        } else if (msg.type === 'node_update') {
          setProject((prev) => {
            const exists = prev.nodes.some((n) => n.id === msg.node.id);
            const nextNodes = exists
              ? prev.nodes.map((n) => (n.id === msg.node.id ? msg.node : n))
              : [...prev.nodes, msg.node];
            return syncProjectWithPages({ ...prev, nodes: nextNodes });
          });
        } else if (msg.type === 'node_delete') {
          setProject((prev) => {
            const nextNodes = prev.nodes.filter((n) => n.id !== msg.nodeId);
            const nextEdges = prev.edges.filter(
              (e) => e.sourceNodeId !== msg.nodeId && e.targetNodeId !== msg.nodeId
            );
            return syncProjectWithPages({ ...prev, nodes: nextNodes, edges: nextEdges });
          });
        } else if (msg.type === 'edge_update') {
          setProject((prev) => {
            const exists = prev.edges.some((e) => e.id === msg.edge.id);
            const nextEdges = exists
              ? prev.edges.map((e) => (e.id === msg.edge.id ? msg.edge : e))
              : [...prev.edges, msg.edge];
            return syncProjectWithPages({ ...prev, edges: nextEdges });
          });
        } else if (msg.type === 'edge_delete') {
          setProject((prev) => {
            const nextEdges = prev.edges.filter((e) => e.id !== msg.edgeId);
            return syncProjectWithPages({ ...prev, edges: nextEdges });
          });
        } else if (msg.type === 'batch_sync') {
          setProject((prev) =>
            syncProjectWithPages({
              ...prev,
              nodes: msg.nodes,
              edges: msg.edges,
            })
          );
        } else if (msg.type === 'chat') {
          setChatMessages((prev) => [...prev.slice(-40), msg.message]);
        } else if (msg.type === 'version_saved') {
          setProject((prev) => ({
            ...prev,
            versions: [msg.version, ...prev.versions.filter((v) => v.id !== msg.version.id)],
          }));
        }
      } catch (e) {
        console.warn('WS message parse note:', e);
      }
    };

    ws.onclose = () => {
      console.log('WS disconnected');
    };

    return () => {
      ws?.close();
    };
  }, [currentUserId, currentUserName, currentUserColor, project.id]);

  // Debounced auto-save to cloud
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerCloudSave = useCallback(
    (updatedProject: FlowchartProject) => {
      setIsSaving(true);
      const synced = syncProjectWithPages(updatedProject);

      // Immediate local preservation
      try {
        localStorage.setItem('flowcraft_backup_project', JSON.stringify(synced));
        localStorage.setItem(`flowcraft_project_${synced.id}`, JSON.stringify(synced));
      } catch (_) {}

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        fetch(`/api/projects/${synced.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: synced.title,
            description: synced.description,
            theme: synced.theme,
            nodes: synced.nodes,
            edges: synced.edges,
            pages: synced.pages,
            activePageId: synced.activePageId,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(() => {
            setIsSaving(false);
            loadProjectsList();
          })
          .catch((e) => {
            console.warn('Cloud save sync notice (saved to local cache):', e?.message || e);
            setIsSaving(false);
          });
      }, 800);
    },
    [loadProjectsList]
  );

  // Send Cursor Position over WebSocket (throttled)
  const lastCursorSendRef = useRef<number>(0);
  const handleCursorMove = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorSendRef.current > 40 && wsRef.current?.readyState === WebSocket.OPEN) {
      lastCursorSendRef.current = now;
      wsRef.current.send(
        JSON.stringify({
          type: 'cursor',
          x,
          y,
        })
      );
    }
  };

  // --- Central Node & Edge Synchronized Update ---
  const updateProjectData = useCallback(
    (newNodes: FlowchartNode[], newEdges: FlowchartEdge[], customTitle?: string) => {
      setProject((prev) => {
        const curPages =
          prev.pages && prev.pages.length > 0
            ? prev.pages
            : [{ id: 'page-1', name: 'صفحه ۱', nodes: prev.nodes, edges: prev.edges }];
        const activePageId = prev.activePageId || curPages[0].id;

        const updatedPages = curPages.map((pg) =>
          pg.id === activePageId ? { ...pg, nodes: newNodes, edges: newEdges } : pg
        );

        const updated: FlowchartProject = {
          ...prev,
          title: customTitle !== undefined ? customTitle : prev.title,
          nodes: newNodes,
          edges: newEdges,
          pages: updatedPages,
          activePageId,
          updatedAt: Date.now(),
        };

        triggerCloudSave(updated);
        return updated;
      });
    },
    [triggerCloudSave]
  );

  // --- Multi-Page Handlers ---
  const handleSelectPage = (pageId: string) => {
    if (pageId === project.activePageId) return;

    setProject((prev) => {
      const curPages = prev.pages || [];
      // sync current page before switching
      const syncedPages = curPages.map((pg) =>
        pg.id === prev.activePageId ? { ...pg, nodes: prev.nodes, edges: prev.edges } : pg
      );
      const targetPage = syncedPages.find((pg) => pg.id === pageId);
      if (!targetPage) return prev;

      const updated: FlowchartProject = {
        ...prev,
        pages: syncedPages,
        activePageId: pageId,
        nodes: targetPage.nodes || [],
        edges: targetPage.edges || [],
        updatedAt: Date.now(),
      };
      triggerCloudSave(updated);
      return updated;
    });

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleAddPage = () => {
    setProject((prev) => {
      const curPages = prev.pages || [
        { id: 'page-1', name: 'صفحه ۱', nodes: prev.nodes, edges: prev.edges },
      ];
      const newPageNum = curPages.length + 1;
      const newPageId = `page-${Date.now()}`;
      const newPageName = `صفحه ${newPageNum}`;
      const newPage: FlowchartPage = {
        id: newPageId,
        name: newPageName,
        nodes: [],
        edges: [],
      };

      const syncedPages = curPages.map((pg) =>
        pg.id === prev.activePageId ? { ...pg, nodes: prev.nodes, edges: prev.edges } : pg
      );
      const updatedPages = [...syncedPages, newPage];

      const updated: FlowchartProject = {
        ...prev,
        pages: updatedPages,
        activePageId: newPageId,
        nodes: [],
        edges: [],
        updatedAt: Date.now(),
      };
      triggerCloudSave(updated);
      return updated;
    });

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleRenamePage = (pageId: string, newName: string) => {
    setProject((prev) => {
      const curPages = prev.pages || [];
      const updatedPages = curPages.map((pg) =>
        pg.id === pageId ? { ...pg, name: newName } : pg
      );
      const updated: FlowchartProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      triggerCloudSave(updated);
      return updated;
    });
  };

  const handleDuplicatePage = (pageId: string) => {
    setProject((prev) => {
      const curPages = prev.pages || [];
      const targetPage = curPages.find((pg) => pg.id === pageId);
      if (!targetPage) return prev;

      const newPageId = `page-${Date.now()}`;
      const duplicatedNodes = JSON.parse(JSON.stringify(targetPage.nodes));
      const duplicatedEdges = JSON.parse(JSON.stringify(targetPage.edges));

      const newPage: FlowchartPage = {
        id: newPageId,
        name: `${targetPage.name} (کپی)`,
        nodes: duplicatedNodes,
        edges: duplicatedEdges,
      };

      const syncedPages = curPages.map((pg) =>
        pg.id === prev.activePageId ? { ...pg, nodes: prev.nodes, edges: prev.edges } : pg
      );

      const targetIndex = syncedPages.findIndex((pg) => pg.id === pageId);
      const updatedPages = [...syncedPages];
      updatedPages.splice(targetIndex + 1, 0, newPage);

      const updated: FlowchartProject = {
        ...prev,
        pages: updatedPages,
        activePageId: newPageId,
        nodes: duplicatedNodes,
        edges: duplicatedEdges,
        updatedAt: Date.now(),
      };
      triggerCloudSave(updated);
      return updated;
    });

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (!project.pages || project.pages.length <= 1) return;
    setConfirmDialog({
      isOpen: true,
      title: t.deletePage,
      message: t.deletePageConfirm,
      confirmLabel: 'حذف',
      cancelLabel: 'انصراف',
      isDestructive: true,
      onConfirm: () => {
        setProject((prev) => {
          const curPages = prev.pages || [];
          if (curPages.length <= 1) return prev;
          const remainingPages = curPages.filter((pg) => pg.id !== pageId);
          let nextActiveId = prev.activePageId;
          let nextNodes = prev.nodes;
          let nextEdges = prev.edges;

          if (prev.activePageId === pageId) {
            nextActiveId = remainingPages[0].id;
            nextNodes = remainingPages[0].nodes;
            nextEdges = remainingPages[0].edges;
          }

          const updated: FlowchartProject = {
            ...prev,
            pages: remainingPages,
            activePageId: nextActiveId,
            nodes: nextNodes,
            edges: nextEdges,
            updatedAt: Date.now(),
          };
          triggerCloudSave(updated);
          return updated;
        });
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      },
    });
  };

  // --- Multi-Project Handlers ---
  const handleSelectProject = (projectId: string) => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.id) {
          const normalized = ensureProjectPages(data);
          setProject(normalized);
          if (normalized.theme && THEMES[normalized.theme]) {
            setActiveThemeId(normalized.theme);
          }
          try {
            localStorage.setItem('flowcraft_backup_project', JSON.stringify(normalized));
          } catch (_) {}
          loadProjectsList();
        }
      })
      .catch((err) => {
        console.warn('Project switch note:', err?.message || err);
        try {
          const cached = localStorage.getItem(`flowcraft_project_${projectId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            const normalized = ensureProjectPages(parsed);
            setProject(normalized);
            if (normalized.theme && THEMES[normalized.theme]) {
              setActiveThemeId(normalized.theme);
            }
          }
        } catch (_) {}
      });

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleCreateProject = (title: string, templateId?: string) => {
    let initialNodes: FlowchartNode[] = [];
    let initialEdges: FlowchartEdge[] = [];
    let pTheme = 'slate';

    if (templateId) {
      const tmpl = TEMPLATES.find((tmplItem) => tmplItem.id === templateId);
      if (tmpl) {
        initialNodes = JSON.parse(JSON.stringify(tmpl.nodes));
        initialEdges = JSON.parse(JSON.stringify(tmpl.edges));
      }
    }

    const defaultPageId = 'page-1';
    const initialPages: FlowchartPage[] = [
      {
        id: defaultPageId,
        name: 'صفحه ۱',
        nodes: initialNodes,
        edges: initialEdges,
      },
    ];

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        theme: pTheme,
        pages: initialPages,
        nodes: initialNodes,
        edges: initialEdges,
      }),
    })
      .then((res) => res.json())
      .then((newProj) => {
        if (newProj && newProj.id) {
          const normalized = ensureProjectPages(newProj);
          setProject(normalized);
          setActiveThemeId(normalized.theme || 'slate');
          try {
            localStorage.setItem('flowcraft_backup_project', JSON.stringify(normalized));
          } catch (_) {}
          loadProjectsList();
        }
      })
      .catch((e) => {
        console.warn('Create project note:', e?.message || e);
        // Offline fallback creation
        const now = Date.now();
        const offlineId = `project-${Math.random().toString(36).substring(2, 8)}`;
        const offlineProj: FlowchartProject = {
          id: offlineId,
          title,
          createdAt: now,
          updatedAt: now,
          theme: pTheme,
          activePageId: defaultPageId,
          pages: initialPages,
          nodes: initialNodes,
          edges: initialEdges,
          versions: [],
        };
        setProject(offlineProj);
        setActiveThemeId(pTheme);
        try {
          localStorage.setItem('flowcraft_backup_project', JSON.stringify(offlineProj));
          localStorage.setItem(`flowcraft_project_${offlineId}`, JSON.stringify(offlineProj));
        } catch (_) {}
        loadProjectsList();
      });
  };

  const handleDuplicateProject = (projectId: string) => {
    fetch(`/api/projects/${projectId}/duplicate`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.project) {
          loadProjectsList();
        }
      })
      .catch((e) => {
        console.warn('Duplicate project note:', e?.message || e);
        loadProjectsList();
      });
  };

  const handleDeleteProject = (projectId: string) => {
    fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        loadProjectsList();
        if (project.id === projectId) {
          const other = projectsList.find((p) => p.id !== projectId);
          if (other) {
            handleSelectProject(other.id);
          } else {
            handleCreateProject('پروژه جدید');
          }
        }
      })
      .catch((e) => {
        console.warn('Delete project note:', e?.message || e);
        loadProjectsList();
      });
  };

  const handleImportProjectJson = (data: FlowchartProject) => {
    const normalized = ensureProjectPages({
      ...data,
      id: `project-${Math.random().toString(36).substring(2, 8)}`,
      title: data.title ? `${data.title} (وارد شده)` : 'پروژه وارد شده',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setProject(normalized);
    if (normalized.theme && THEMES[normalized.theme]) {
      setActiveThemeId(normalized.theme);
    }
    triggerCloudSave(normalized);
    loadProjectsList();
  };

  // --- Node & Edge Manipulation Handlers ---
  const handleAddNode = (type: FlowchartNodeType) => {
    pushUndo();

    const canvasCenterX = (-pan.x + (window.innerWidth - 300) / 2) / zoom;
    const canvasCenterY = (-pan.y + (window.innerHeight - 100) / 2) / zoom;

    const baseSizes: Record<FlowchartNodeType, { width: number; height: number }> = {
      terminal: { width: 140, height: 60 },
      process: { width: 160, height: 75 },
      decision: { width: 150, height: 95 },
      'input-output': { width: 160, height: 70 },
      document: { width: 150, height: 85 },
      subroutine: { width: 160, height: 75 },
      database: { width: 130, height: 95 },
      connector: { width: 60, height: 60 },
      note: { width: 160, height: 100 },
    };

    const size = baseSizes[type] || { width: 150, height: 75 };
    const paletteKey = type === 'input-output' ? 'inputOutput' : type;
    const pColor = currentTheme.palette[paletteKey] || currentTheme.palette.process;

    const defaultLabels: Record<FlowchartNodeType, string> = {
      terminal: 'شروع / پایان',
      process: 'پردازش داده‌ها',
      decision: 'آیا معتبر است؟',
      'input-output': 'دریافت ورودی',
      document: 'گزارش خروجی',
      subroutine: 'فراخوانی سرویس',
      database: 'پایگاه داده',
      connector: 'A',
      note: 'یادداشت توضیحی...',
    };

    const newNode: FlowchartNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: Math.round(canvasCenterX - size.width / 2 + (Math.random() * 40 - 20)),
      y: Math.round(canvasCenterY - size.height / 2 + (Math.random() * 40 - 20)),
      width: size.width,
      height: size.height,
      label: defaultLabels[type] || 'گره جدید',
      fill: pColor.fill,
      stroke: pColor.stroke,
      strokeWidth: 2,
      strokeStyle: 'solid',
      textColor: pColor.text,
      fontSize: 13,
      fontWeight: type === 'terminal' || type === 'decision' ? 'bold' : 'normal',
      textAlign: 'center',
    };

    const updatedNodes = [...project.nodes, newNode];
    updateProjectData(updatedNodes, project.edges);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'node_update', node: newNode }));
    }
  };

  const handleUpdateNode = (node: FlowchartNode) => {
    const updatedNodes = project.nodes.map((n) => (n.id === node.id ? node : n));
    updateProjectData(updatedNodes, project.edges);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'node_update', node }));
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    pushUndo();
    const updatedNodes = project.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = project.edges.filter(
      (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    updateProjectData(updatedNodes, updatedEdges);
    setSelectedNodeId(null);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'node_delete', nodeId }));
    }
  };

  const handleDuplicateNode = (nodeId: string) => {
    const target = project.nodes.find((n) => n.id === nodeId);
    if (!target) return;
    pushUndo();

    const dupNode: FlowchartNode = {
      ...JSON.parse(JSON.stringify(target)),
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: target.x + 35,
      y: target.y + 35,
    };

    const updatedNodes = [...project.nodes, dupNode];
    updateProjectData(updatedNodes, project.edges);
    setSelectedNodeId(dupNode.id);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'node_update', node: dupNode }));
    }
  };

  // Edge operations
  const handleCreateEdge = (edge: FlowchartEdge) => {
    pushUndo();
    const updatedEdges = [...project.edges, edge];
    updateProjectData(project.nodes, updatedEdges);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'edge_update', edge }));
    }
  };

  const handleUpdateEdge = (edge: FlowchartEdge) => {
    const updatedEdges = project.edges.map((e) => (e.id === edge.id ? edge : e));
    updateProjectData(project.nodes, updatedEdges);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'edge_update', edge }));
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    pushUndo();
    const updatedEdges = project.edges.filter((e) => e.id !== edgeId);
    updateProjectData(project.nodes, updatedEdges);
    setSelectedEdgeId(null);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'edge_delete', edgeId }));
    }
  };

  // Load Template
  const executeLoadTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find((tItem) => tItem.id === templateId);
    if (!tmpl) return;
    pushUndo();

    const newTitle =
      tmpl.titleKey === 'templateAuth'
        ? 'فلوچارت احراز هویت و تأیید دو مرحله‌ای'
        : t[tmpl.titleKey];

    const newNodes = JSON.parse(JSON.stringify(tmpl.nodes));
    const newEdges = JSON.parse(JSON.stringify(tmpl.edges));
    updateProjectData(newNodes, newEdges, newTitle);

    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    // Center canvas around new template bounding box
    const bbox = getNodeBoundingBox(tmpl.nodes, 60);
    setPan({
      x: Math.max(20, (window.innerWidth - 300 - bbox.width) / 2 - bbox.minX),
      y: Math.max(20, (window.innerHeight - 150 - bbox.height) / 2 - bbox.minY),
    });
    setZoom(1);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'batch_sync',
          nodes: newNodes,
          edges: newEdges,
        })
      );
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'بارگذاری قالب جدید',
      message: t.applyTemplateConfirm,
      confirmLabel: 'بارگذاری قالب',
      cancelLabel: 'انصراف',
      isDestructive: false,
      onConfirm: () => executeLoadTemplate(templateId),
    });
  };

  // Save named version snapshot
  const handleSaveVersion = (name: string) => {
    fetch(`/api/projects/${project.id}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        author: currentUserName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.version) {
          setProject((prev) => ({
            ...prev,
            versions: [data.version, ...prev.versions],
          }));
        }
      })
      .catch((e) => console.warn('Snapshot sync notice:', e?.message || e));
  };

  // Restore version snapshot
  const executeRestoreVersion = (versionId: string) => {
    pushUndo();
    fetch(`/api/projects/${project.id}/restore/${versionId}`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.project) {
          const normalized = ensureProjectPages(data.project);
          setProject(normalized);
        }
      })
      .catch((e) => console.warn('Restore sync notice:', e?.message || e));
  };

  const handleRestoreVersion = (versionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'بازگردانی نسخه قبلی',
      message: t.restoreConfirm,
      confirmLabel: 'بازگردانی',
      cancelLabel: 'انصراف',
      isDestructive: false,
      onConfirm: () => executeRestoreVersion(versionId),
    });
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(project.nodes)),
        edges: JSON.parse(JSON.stringify(project.edges)),
      },
    ]);

    updateProjectData(previous.nodes, previous.edges);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'batch_sync', nodes: previous.nodes, edges: previous.edges })
      );
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(project.nodes)),
        edges: JSON.parse(JSON.stringify(project.edges)),
      },
    ]);

    updateProjectData(next.nodes, next.edges);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'batch_sync', nodes: next.nodes, edges: next.edges })
      );
    }
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          handleDeleteEdge(selectedEdgeId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedNodeId) {
          e.preventDefault();
          handleDuplicateNode(selectedNodeId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedNodeId) {
          const node = project.nodes.find((n) => n.id === selectedNodeId);
          if (node) clipboardNodeRef.current = node;
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardNodeRef.current) {
          e.preventDefault();
          const target = clipboardNodeRef.current;
          pushUndo();
          const pasteNode: FlowchartNode = {
            ...JSON.parse(JSON.stringify(target)),
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            x: target.x + 40,
            y: target.y + 40,
          };
          updateProjectData([...project.nodes, pasteNode], project.edges);
          setSelectedNodeId(pasteNode.id);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setExportModalOpen(false);
        setShortcutsModalOpen(false);
        setCollaborationModalOpen(false);
        setVersionsModalOpen(false);
        setIsProjectsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const selectedNode = project.nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedEdge = project.edges.find((e) => e.id === selectedEdgeId) || null;

  return (
    <div
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen w-screen overflow-hidden transition-colors"
      style={{ backgroundColor: currentTheme.ui.bg, color: currentTheme.ui.textPrimary }}
    >
      {/* 1. Header */}
      <Header
        title={project.title}
        onTitleChange={(newTitle) => {
          setProject((prev) => {
            const updated = { ...prev, title: newTitle };
            triggerCloudSave(updated);
            return updated;
          });
        }}
        lang={lang}
        t={t}
        onToggleLang={() => setLang((prev) => (prev === 'fa' ? 'en' : 'fa'))}
        activeThemeId={activeThemeId}
        onThemeSelect={(themeId) => {
          setActiveThemeId(themeId);
          setProject((prev) => {
            const updated = { ...prev, theme: themeId };
            triggerCloudSave(updated);
            return updated;
          });
        }}
        collaborators={collaborators}
        isSaving={isSaving}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((prev) => Math.min(3, prev + 0.15))}
        onZoomOut={() => setZoom((prev) => Math.max(0.3, prev - 0.15))}
        onResetZoom={() => {
          setZoom(1);
          setPan({ x: 40, y: 30 });
        }}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenCollaboration={() => setCollaborationModalOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenVersions={() => setVersionsModalOpen(true)}
        onOpenProjects={() => {
          loadProjectsList();
          setIsProjectsModalOpen(true);
        }}
        projectCount={projectsList.length}
      />

      {/* 2. Main Work Area: Sidebar + Center (Canvas + PagesBar) + Properties Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          theme={currentTheme}
          t={t}
          lang={lang}
          onAddNode={handleAddNode}
          onLoadTemplate={handleLoadTemplate}
          versions={project.versions}
          onSaveVersion={handleSaveVersion}
          onRestoreVersion={handleRestoreVersion}
          collaborators={collaborators}
          currentUserId={currentUserId}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          roomCode={project.id}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Canvas
            svgRef={svgRef}
            theme={currentTheme}
            t={t}
            nodes={project.nodes}
            edges={project.edges}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) setSelectedEdgeId(null);
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id);
              if (id) setSelectedNodeId(null);
            }}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onCreateEdge={handleCreateEdge}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            collaborators={collaborators}
            onCursorMove={handleCursorMove}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            gridMode={gridMode}
            snapToGrid={snapToGrid}
          />

          {/* Multi-Page Tabs Bar */}
          <PagesBar
            pages={
              project.pages && project.pages.length > 0
                ? project.pages
                : [{ id: 'page-1', name: 'صفحه ۱', nodes: project.nodes, edges: project.edges }]
            }
            activePageId={project.activePageId || 'page-1'}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onRenamePage={handleRenamePage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            theme={currentTheme}
            t={t}
          />
        </div>

        <PropertiesPanel
          theme={currentTheme}
          t={t}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          gridMode={gridMode}
          setGridMode={setGridMode}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          nodeCount={project.nodes.length}
          edgeCount={project.edges.length}
          onClearCanvas={() => {
            setConfirmDialog({
              isOpen: true,
              title: 'پاکسازی صفحه فلوچارت',
              message: t.clearConfirm,
              confirmLabel: 'پاکسازی همه',
              cancelLabel: 'انصراف',
              isDestructive: true,
              onConfirm: () => {
                pushUndo();
                updateProjectData([], []);
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: 'batch_sync', nodes: [], edges: [] }));
                }
              },
            });
          }}
        />
      </div>

      {/* 3. Modals */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentProjectId={project.id}
        projects={projectsList}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onImportProjectJson={handleImportProjectJson}
        theme={currentTheme}
        t={t}
        lang={lang}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        theme={currentTheme}
        t={t}
        project={project}
        svgRef={svgRef}
      />

      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        theme={currentTheme}
        t={t}
      />

      <CollaborationModal
        isOpen={collaborationModalOpen}
        onClose={() => setCollaborationModalOpen(false)}
        theme={currentTheme}
        t={t}
        collaborators={collaborators}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserColor={currentUserColor}
        onUpdateUserProfile={(name, color) => {
          setCurrentUserName(name);
          setCurrentUserColor(color);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'join',
                projectId: project.id,
                user: { id: currentUserId, name, color },
              })
            );
          }
        }}
        roomCode={project.id}
      />

      <VersionHistoryModal
        isOpen={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        theme={currentTheme}
        t={t}
        versions={project.versions}
        onSaveVersion={handleSaveVersion}
        onRestoreVersion={handleRestoreVersion}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        theme={currentTheme}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}
