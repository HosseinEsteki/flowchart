import JSZip from 'jszip';
import { FlowchartProject, FlowchartNode, FlowchartEdge } from '../types/flowchart';
import visNetworkRaw from '../assets/vis-network.min.js?raw';

/**
 * Generate full offline style.css bundle
 */
function generateOfflineCss(): string {
  return `/* FlowCraft Vis-Network Standalone Offline Stylesheet */
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700&display=swap');

*, ::before, ::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0b0f19;
  color: #f1f5f9;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
}

#network-canvas {
  width: 100%;
  height: calc(100vh - 68px);
  outline: none;
  background: radial-gradient(circle at 50% 50%, #151d2f 0%, #0b0f19 100%);
}

.glass-panel {
  background: rgba(17, 24, 39, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #111827;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* Animations */
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 0.4; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Layout Utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1 1 0%; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-1 { gap: 0.25rem; }
.gap-1\\.5 { gap: 0.375rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.relative { position: relative; }
.absolute { position: absolute; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.select-none { user-select: none; }
.hidden { display: none !important; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 200ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms; }
`;
}

/**
 * Determine topological/flow simulation sequence from nodes and edges
 */
function getSimulationSequence(nodes: FlowchartNode[], edges: FlowchartEdge[]): string[] {
  if (nodes.length === 0) return [];

  // Find root nodes (no incoming edges or type === 'terminal')
  const incomingCount: Record<string, number> = {};
  nodes.forEach((n) => {
    incomingCount[n.id] = 0;
  });
  edges.forEach((e) => {
    if (incomingCount[e.targetNodeId] !== undefined) {
      incomingCount[e.targetNodeId]++;
    }
  });

  const roots = nodes
    .filter((n) => incomingCount[n.id] === 0 || n.type === 'terminal')
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const visited = new Set<string>();
  const sequence: string[] = [];

  const queue: string[] = roots.map((n) => n.id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    sequence.push(currentId);

    // Get children
    const childEdges = edges.filter((e) => e.sourceNodeId === currentId);
    for (const edge of childEdges) {
      if (!visited.has(edge.targetNodeId)) {
        queue.push(edge.targetNodeId);
      }
    }
  }

  // Add any disconnected or remaining nodes
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      sequence.push(n.id);
      visited.add(n.id);
    }
  }

  return sequence;
}

/**
 * Convert flowchart node type to Persian label and Vis group
 */
function mapNodeToVis(node: FlowchartNode) {
  let group = 'process';
  let shape = 'box';
  let badgeText = 'فرآیند و عملیات';
  let defaultSub = 'گام فرآیندی';

  switch (node.type) {
    case 'terminal':
      group = 'terminal';
      shape = 'ellipse';
      badgeText = 'نقطه آغاز / پایان';
      defaultSub = 'شروع یا خاتمه فرآیند';
      break;
    case 'decision':
      group = 'decision';
      shape = 'diamond';
      badgeText = 'گیت شرط و تصمیم‌گیری';
      defaultSub = 'انشعاب شرطی';
      break;
    case 'database':
      group = 'database';
      shape = 'database';
      badgeText = 'پایگاه‌داده و مخزن اطلاعات';
      defaultSub = 'بانک اطلاعاتی / داده‌های مرکزی';
      break;
    case 'input-output':
      group = 'input_output';
      shape = 'box';
      badgeText = 'ورودی / خروجی داده';
      defaultSub = 'دریافت یا ارسال اطلاعات';
      break;
    case 'document':
      group = 'document';
      shape = 'box';
      badgeText = 'سند و گزارش مکتوب';
      defaultSub = 'پرونده یا خروجی چاپی';
      break;
    case 'subroutine':
      group = 'subroutine';
      shape = 'box';
      badgeText = 'زیرفرآیند تخصصی';
      defaultSub = 'روال از پیش تعریف‌شده';
      break;
    case 'note':
      group = 'note';
      shape = 'box';
      badgeText = 'یادداشت و مستندات';
      defaultSub = 'توضیحات راهنما';
      break;
    default:
      group = 'process';
      shape = 'box';
      badgeText = 'مرحله عملیاتی';
      defaultSub = 'اقدام فرآیندی';
      break;
  }

  const props: Record<string, string> = {
    'شناسه گره': `#${node.id.toUpperCase()}`,
    'نوع شکل': badgeText,
    'موقعیت بوم': `X: ${Math.round(node.x)} , Y: ${Math.round(node.y)}`,
    'ابعاد': `${Math.round(node.width)} × ${Math.round(node.height)} px`,
  };

  return {
    id: node.id,
    label: node.label || 'بدون عنوان',
    group,
    shape,
    sub: defaultSub,
    badgeText,
    desc: node.label
      ? `این مرحله بیانگر اقدام «${node.label.replace(/\n/g, ' ')}» در جریان این فرآیند است.`
      : 'توضیحات و مستندات این گام ثبت نشده است.',
    warning:
      node.type === 'decision'
        ? 'توجه: این گره دارای انشعاب شرطی است. مسیر خروجی بر اساس برقرار بودن یا نبودن شرط مشخص می‌گردد.'
        : undefined,
    props,
    originalX: node.x,
    originalY: node.y,
    fill: node.fill,
    stroke: node.stroke,
    textColor: node.textColor,
  };
}

/**
 * Generate full interactive HTML string for Vis-Network visualization
 */
export function generateVisNetworkHtml(project: FlowchartProject, title: string): string {
  const pages =
    project.pages && project.pages.length > 0
      ? project.pages
      : [
          {
            id: 'page-1',
            name: 'صفحه اصلی',
            description: project.description || '',
            nodes: project.nodes || [],
            edges: project.edges || [],
          },
        ];

  // Bundle data of all pages
  const pagesData = pages.map((page) => {
    const visNodes = (page.nodes || []).map(mapNodeToVis);
    const visEdges = (page.edges || []).map((e) => ({
      from: e.sourceNodeId,
      to: e.targetNodeId,
      label: e.label || '',
      color: e.color || '#64748b',
      dashes: e.style === 'dashed',
    }));
    const simSequence = getSimulationSequence(page.nodes || [], page.edges || []);
    return {
      id: page.id,
      name: page.name || 'صفحه',
      description: page.description || '',
      nodes: visNodes,
      edges: visEdges,
      simulationSequence: simSequence,
    };
  });

  const projectTitle = title || project.title || 'فلوچارت هوشمند تعاملی';
  const pagesJson = JSON.stringify(pagesData, null, 2);

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>

    <!-- Tailwind CSS (CDN with offline fallback styles) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="assets/style.css">

    <!-- Fonts: Vazirmatn -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Vis-Network for Graph Visualization (Local with CDN fallback) -->
    <script type="text/javascript" src="assets/vis-network.min.js"></script>
    <script>
      if (typeof vis === 'undefined') {
        document.write('<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"><\\/script>');
      }
    </script>

    <script>
        if (typeof tailwind !== 'undefined') {
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            vazir: ['Vazirmatn', 'sans-serif'],
                            mono: ['"Plus Jakarta Sans"', 'monospace']
                        },
                        colors: {
                            brand: {
                                blue: '#1e3a8a',
                                light: '#3b82f6',
                                accent: '#0284c7',
                                dark: '#0f172a'
                            }
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Vazirmatn', sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            overflow: hidden;
        }
        #network-canvas {
            width: 100%;
            height: calc(100vh - 68px);
            outline: none;
            background: radial-gradient(circle at 50% 50%, #151d2f 0%, #0b0f19 100%);
        }
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #111827;
        }
        ::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #4b5563;
        }
        .glass-panel {
            background: rgba(17, 24, 39, 0.88);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>
</head>
<body class="flex flex-col h-screen select-none">

    <!-- Top Navigation & Controls Bar -->
    <header class="h-[68px] glass-panel px-5 flex items-center justify-between z-20 border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                <i class="fa-solid fa-diagram-project text-white text-lg"></i>
            </div>
            <div class="min-w-0">
                <h1 class="text-base font-bold text-white flex items-center gap-2 truncate">
                    <span id="header-project-title">${projectTitle}</span>
                    <span id="header-page-badge" class="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-normal shrink-0"></span>
                </h1>
                <p id="header-page-desc" class="text-xs text-slate-400 truncate max-w-md">نمایش گراف تعاملی، شبیه‌ساز گام‌به‌گام و جریان داده</p>
            </div>
        </div>

        <!-- Graph View Switchers & Actions -->
        <div class="flex items-center gap-2.5">
            <!-- Multi-page Selector (if more than 1 page) -->
            <div id="page-switcher-wrap" class="hidden items-center bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-700/60">
                <i class="fa-solid fa-layer-group text-slate-400 text-xs ml-1.5"></i>
                <select id="page-select" onchange="switchPage(this.value)" class="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium">
                </select>
            </div>

            <!-- Layout Switcher -->
            <div class="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60">
                <button id="btn-view-hierarchical" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-600 text-white shadow-sm flex items-center gap-1.5" onclick="setGraphLayout('hierarchical')">
                    <i class="fa-solid fa-sitemap"></i>
                    <span>درختی</span>
                </button>
                <button id="btn-view-network" class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-all flex items-center gap-1.5" onclick="setGraphLayout('network')">
                    <i class="fa-solid fa-circle-nodes"></i>
                    <span>پیوندی</span>
                </button>
                <button id="btn-view-free" class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-all flex items-center gap-1.5" onclick="setGraphLayout('free')">
                    <i class="fa-solid fa-shapes"></i>
                    <span>بوم اصلی</span>
                </button>
            </div>

            <!-- Simulation Controls -->
            <div class="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60">
                <button title="گام قبلی" class="w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center transition" onclick="stepSimulation(-1)">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button id="btn-play-sim" title="اجرای خودکار شبیه‌ساز" class="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm" onclick="toggleSimulation()">
                    <i class="fa-solid fa-play"></i>
                    <span>شبیه‌ساز گام‌به‌گام</span>
                </button>
                <button title="گام بعدی" class="w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center transition" onclick="stepSimulation(1)">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
            </div>

            <!-- Quick View Fit -->
            <button class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition" onclick="fitGraphView()">
                <i class="fa-solid fa-expand"></i>
                <span>مرکزنمایی</span>
            </button>
        </div>
    </header>

    <!-- Main Workspace -->
    <div class="relative flex-1 flex overflow-hidden">

        <!-- Network Canvas -->
        <div id="network-canvas" class="flex-1"></div>

        <!-- Legend / Filter Float (Top Right) -->
        <div class="absolute top-4 right-4 glass-panel p-3.5 rounded-2xl z-10 w-64 text-xs shadow-2xl border border-slate-800/80">
            <div class="font-bold text-slate-200 mb-2.5 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-layer-group text-blue-400"></i>
                    راهنمای لایه‌های گراف
                </span>
                <span class="text-[10px] text-slate-400">کلیک روی نودها</span>
            </div>
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                    <span>شروع و پایان (Terminal)</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                    <span>فرآیندها و عملیات (Process)</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                    <span>شروط و تصمیم‌گیری (Decision)</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></span>
                    <span>ورودی / خروجی داده (I/O)</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
                    <span>پایگاه‌داده و مخازن داده (DB)</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
                    <span>اسناد مکتوب و یادداشت‌ها</span>
                </div>
            </div>
        </div>

        <!-- Search Bar Float (Top Left) -->
        <div class="absolute top-4 left-4 glass-panel p-2 rounded-2xl z-10 flex items-center gap-2 border border-slate-800 shadow-2xl w-72">
            <i class="fa-solid fa-magnifying-glass text-slate-400 mr-2 text-xs"></i>
            <input id="search-input" type="text" placeholder="جستجوی گره (عنوان، متن، شناسه)..." class="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full font-medium" oninput="searchGraph(this.value)">
            <button class="text-slate-400 hover:text-white px-2" onclick="clearSearch()" title="پاکسازی">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        </div>

        <!-- Node Inspector Drawer (Left Side Slide-in Panel) -->
        <div id="inspector-panel" class="absolute top-0 left-0 bottom-0 w-96 glass-panel z-20 transform -translate-x-full transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col p-6 overflow-y-auto">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div class="flex items-center gap-2">
                    <span id="insp-badge" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        گره عملیاتی
                    </span>
                    <span id="insp-id" class="text-xs font-mono text-slate-400">#NODE_01</span>
                </div>
                <button class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition" onclick="closeInspector()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Content Area -->
            <div class="space-y-4">
                <div>
                    <h2 id="insp-title" class="text-lg font-bold text-white mb-1">عنوان گام</h2>
                    <p id="insp-subtitle" class="text-xs text-sky-400 font-medium">المان فرآیندی</p>
                </div>

                <div class="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                    <h4 class="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-info text-blue-400"></i>
                        شرح عملکرد و جزئیات گام
                    </h4>
                    <p id="insp-description" class="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        توضیحات مربوط به این مرحله در اینجا نمایش داده می‌شود.
                    </p>
                </div>

                <!-- Technical Properties Grid -->
                <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-sliders text-cyan-400"></i>
                        مشخصات فنی و اتصالات
                    </h4>
                    <div id="insp-props" class="space-y-2 text-xs">
                    </div>
                </div>

                <!-- Warning / Critical Check (if any) -->
                <div id="insp-warning-box" class="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3.5 hidden">
                    <div class="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        نکته شرطی و تصمیم‌گیری
                    </div>
                    <p id="insp-warning-text" class="text-xs text-amber-200/90 leading-relaxed"></p>
                </div>

                <!-- Connected Nodes Navigation -->
                <div class="pt-2">
                    <h4 class="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <i class="fa-solid fa-share-nodes text-indigo-400"></i>
                        گره‌های مرتبط در این فلوچارت
                    </h4>
                    <div id="insp-connections" class="flex flex-wrap gap-1.5"></div>
                </div>
            </div>

            <!-- Footer Action inside Drawer -->
            <div class="mt-auto pt-6 border-t border-slate-800 flex gap-2">
                <button class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer" onclick="focusSelectedNode()">
                    <i class="fa-solid fa-crosshairs"></i>
                    <span>بزرگ‌نمایی روی گره</span>
                </button>
            </div>
        </div>

        <!-- Simulation Progress Indicator (Bottom Bar) -->
        <div id="sim-progress-bar" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass-panel px-5 py-2.5 rounded-2xl z-10 flex items-center gap-4 border border-slate-800 shadow-2xl">
            <div class="flex items-center gap-2">
                <span id="sim-status-dot" class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span id="sim-step-text" class="text-xs font-medium text-slate-200">وضعیت فرآیند: آماده پیمایش</span>
            </div>
            <div class="h-4 w-[1px] bg-slate-700"></div>
            <div class="flex items-center gap-1.5 text-xs text-slate-400">
                <span>گام فعلی:</span>
                <span id="sim-current-index" class="font-bold text-blue-400 font-mono text-sm">--</span>
                <span>از</span>
                <span id="sim-total-steps" class="font-bold text-slate-300 font-mono text-sm">--</span>
            </div>
        </div>

    </div>

    <!-- Application Script with Embedded Project Data -->
    <script>
        const allPages = ${pagesJson};
        let activePageIndex = 0;

        let network = null;
        let nodesDataset = null;
        let edgesDataset = null;
        let currentLayout = 'hierarchical';
        let selectedNodeId = null;
        let simIndex = -1;
        let simInterval = null;

        // Visual Palette Styling
        const groupStyles = {
            terminal: {
                background: '#064e3b',
                border: '#10b981',
                highlight: '#34d399',
                font: { color: '#ffffff', size: 13, face: 'Vazirmatn', bold: true }
            },
            process: {
                background: '#1e3a8a',
                border: '#3b82f6',
                highlight: '#60a5fa',
                font: { color: '#ffffff', size: 13, face: 'Vazirmatn' }
            },
            decision: {
                background: '#b45309',
                border: '#fbbf24',
                highlight: '#fde68a',
                font: { color: '#ffffff', size: 13, face: 'Vazirmatn', bold: true }
            },
            input_output: {
                background: '#0e7490',
                border: '#22d3ee',
                highlight: '#67e8f9',
                font: { color: '#ffffff', size: 12, face: 'Vazirmatn' }
            },
            database: {
                background: '#312e81',
                border: '#6366f1',
                highlight: '#818cf8',
                font: { color: '#ffffff', size: 13, face: 'Vazirmatn' }
            },
            document: {
                background: '#581c87',
                border: '#a855f7',
                highlight: '#c084fc',
                font: { color: '#ffffff', size: 12, face: 'Vazirmatn' }
            },
            subroutine: {
                background: '#0f172a',
                border: '#38bdf8',
                highlight: '#7dd3fc',
                font: { color: '#ffffff', size: 13, face: 'Vazirmatn' }
            },
            note: {
                background: '#713f12',
                border: '#eab308',
                highlight: '#facc15',
                font: { color: '#ffffff', size: 12, face: 'Vazirmatn' }
            }
        };

        function getCurrentPage() {
            return allPages[activePageIndex] || allPages[0];
        }

        // Initialize Page Switcher
        function setupPageSwitcher() {
            const wrap = document.getElementById('page-switcher-wrap');
            const select = document.getElementById('page-select');
            if (allPages.length > 1) {
                wrap.classList.remove('hidden');
                wrap.classList.add('flex');
                select.innerHTML = allPages.map((p, idx) => 
                    \`<option value="\${idx}" class="bg-slate-900">\${p.name}</option>\`
                ).join('');
                select.value = activePageIndex;
            } else {
                wrap.classList.add('hidden');
                wrap.classList.remove('flex');
            }
        }

        function switchPage(index) {
            activePageIndex = parseInt(index, 10);
            if (simInterval) toggleSimulation();
            simIndex = -1;
            closeInspector();
            initNetwork();
        }

        // Initialize Vis.js Network for current page
        function initNetwork() {
            const page = getCurrentPage();
            const container = document.getElementById('network-canvas');

            document.getElementById('header-page-badge').innerText = page.name || 'صفحه ۱';
            if (page.description && page.description.trim()) {
                document.getElementById('header-page-desc').innerText = page.description.trim().substring(0, 90) + '...';
            } else {
                document.getElementById('header-page-desc').innerText = 'نمایش گراف تعاملی، شبیه‌ساز گام‌به‌گام و جریان داده';
            }

            const rawNodes = page.nodes || [];
            const rawEdges = page.edges || [];

            // Map styled nodes
            const styledNodes = rawNodes.map(node => {
                const style = groupStyles[node.group] || groupStyles.process;
                const customFill = node.fill && node.fill !== '#FFFFFF' && node.fill !== '#000000';
                return {
                    id: node.id,
                    label: node.label,
                    shape: node.shape || 'box',
                    x: node.originalX,
                    y: node.originalY,
                    color: {
                        background: customFill ? node.fill : style.background,
                        border: node.stroke || style.border,
                        highlight: {
                            background: style.highlight,
                            border: '#ffffff'
                        }
                    },
                    font: {
                        color: node.textColor || style.font.color,
                        size: style.font.size,
                        face: 'Vazirmatn',
                        bold: style.font.bold || false
                    },
                    margin: 12,
                    shadow: {
                        enabled: true,
                        color: 'rgba(0, 0, 0, 0.45)',
                        size: 8,
                        x: 0,
                        y: 4
                    }
                };
            });

            // Map styled edges
            const styledEdges = rawEdges.map(edge => ({
                from: edge.from,
                to: edge.to,
                label: edge.label || '',
                arrows: { to: { enabled: true, scaleFactor: 0.85 } },
                color: { color: edge.color || '#64748b', highlight: '#38bdf8' },
                font: { color: '#94a3b8', size: 11, face: 'Vazirmatn', align: 'middle', background: '#0b0f19' },
                dashes: edge.dashes || false,
                smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 }
            }));

            nodesDataset = new vis.DataSet(styledNodes);
            edgesDataset = new vis.DataSet(styledEdges);

            const data = { nodes: nodesDataset, edges: edgesDataset };
            const options = getNetworkOptions(currentLayout);
            
            if (network) {
                network.destroy();
            }

            network = new vis.Network(container, data, options);

            // Click Event
            network.on('click', function(params) {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    showInspector(nodeId);
                } else {
                    closeInspector();
                }
            });

            // Double Click to zoom on node
            network.on('doubleClick', function(params) {
                if (params.nodes.length > 0) {
                    focusNode(params.nodes[0]);
                }
            });

            const totalSteps = (page.simulationSequence || []).length;
            document.getElementById('sim-total-steps').innerText = totalSteps;
            document.getElementById('sim-current-index').innerText = '--';
            document.getElementById('sim-step-text').innerText = 'وضعیت فرآیند: آماده پیمایش';
        }

        function getNetworkOptions(layoutType) {
            if (layoutType === 'hierarchical') {
                return {
                    layout: {
                        hierarchical: {
                            direction: 'UD',
                            sortMethod: 'directed',
                            levelSeparation: 120,
                            nodeSpacing: 180,
                            treeSpacing: 220
                        }
                    },
                    physics: {
                        hierarchicalRepulsion: {
                            nodeDistance: 170
                        }
                    },
                    interaction: {
                        hover: true,
                        tooltipDelay: 200
                    }
                };
            } else if (layoutType === 'free') {
                return {
                    layout: {
                        hierarchical: { enabled: false }
                    },
                    physics: {
                        enabled: false
                    },
                    interaction: {
                        hover: true,
                        dragNodes: true,
                        dragView: true,
                        zoomView: true
                    }
                };
            } else {
                return {
                    layout: {
                        hierarchical: { enabled: false }
                    },
                    physics: {
                        solver: 'forceAtlas2Based',
                        forceAtlas2Based: {
                            gravitationalConstant: -75,
                            centralGravity: 0.015,
                            springLength: 140,
                            springConstant: 0.08
                        },
                        maxVelocity: 50,
                        minVelocity: 0.1,
                        stabilization: { iterations: 150 }
                    },
                    interaction: {
                        hover: true,
                        dragNodes: true,
                        dragView: true,
                        zoomView: true
                    }
                };
            }
        }

        function setGraphLayout(layout) {
            currentLayout = layout;
            const btnHierarchical = document.getElementById('btn-view-hierarchical');
            const btnNetwork = document.getElementById('btn-view-network');
            const btnFree = document.getElementById('btn-view-free');

            const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-600 text-white shadow-sm flex items-center gap-1.5';
            const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-all flex items-center gap-1.5';

            btnHierarchical.className = layout === 'hierarchical' ? activeClass : inactiveClass;
            btnNetwork.className = layout === 'network' ? activeClass : inactiveClass;
            btnFree.className = layout === 'free' ? activeClass : inactiveClass;

            network.setOptions(getNetworkOptions(layout));
            setTimeout(() => { network.fit(); }, 350);
        }

        function fitGraphView() {
            network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
        }

        // Show Node Details in Inspector Drawer
        function showInspector(nodeId) {
            selectedNodeId = nodeId;
            const page = getCurrentPage();
            const rawNodes = page.nodes || [];
            const nodeData = rawNodes.find(n => n.id === nodeId);
            if (!nodeData) return;

            const drawer = document.getElementById('inspector-panel');
            drawer.classList.remove('-translate-x-full');

            document.getElementById('insp-id').innerText = \`#\${nodeData.id.toUpperCase()}\`;
            document.getElementById('insp-title').innerText = nodeData.label.split('\\n')[0];
            document.getElementById('insp-subtitle').innerText = nodeData.sub || 'المان فرآیندی';
            document.getElementById('insp-description').innerText = nodeData.desc;

            // Properties
            const propsContainer = document.getElementById('insp-props');
            propsContainer.innerHTML = '';
            if (nodeData.props) {
                for (const [key, val] of Object.entries(nodeData.props)) {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800';
                    row.innerHTML = \`<span class="text-slate-400 font-medium">\${key}:</span><span class="text-slate-200 font-semibold font-mono">\${val}</span>\`;
                    propsContainer.appendChild(row);
                }
            }

            // Warning
            const warningBox = document.getElementById('insp-warning-box');
            const warningText = document.getElementById('insp-warning-text');
            if (nodeData.warning) {
                warningBox.classList.remove('hidden');
                warningText.innerText = nodeData.warning;
            } else {
                warningBox.classList.add('hidden');
            }

            // Badge
            document.getElementById('insp-badge').innerText = nodeData.badgeText || 'گره فرآیندی';

            // Connected Nodes
            const connectedContainer = document.getElementById('insp-connections');
            connectedContainer.innerHTML = '';
            const connectedIds = network.getConnectedNodes(nodeId);
            connectedIds.forEach(id => {
                const target = rawNodes.find(n => n.id === id);
                if (target) {
                    const chip = document.createElement('button');
                    chip.className = 'px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition flex items-center gap-1 cursor-pointer';
                    chip.innerHTML = \`<i class="fa-solid fa-arrow-turn-down text-[9px] text-blue-400"></i> \${target.label.split('\\n')[0]}\`;
                    chip.onclick = () => {
                        network.selectNodes([id]);
                        showInspector(id);
                        focusNode(id);
                    };
                    connectedContainer.appendChild(chip);
                }
            });
        }

        function closeInspector() {
            document.getElementById('inspector-panel').classList.add('-translate-x-full');
            selectedNodeId = null;
        }

        function focusNode(nodeId) {
            network.focus(nodeId, {
                scale: 1.25,
                animation: { duration: 600, easingFunction: 'easeInOutQuad' }
            });
        }

        function focusSelectedNode() {
            if (selectedNodeId) focusNode(selectedNodeId);
        }

        // Search in Graph
        function searchGraph(query) {
            if (!query || query.trim() === '') {
                resetGraphHighlight();
                return;
            }
            const q = query.toLowerCase().trim();
            const page = getCurrentPage();
            const rawNodes = page.nodes || [];
            const matchedNode = rawNodes.find(n => 
                n.label.toLowerCase().includes(q) || 
                n.id.toLowerCase().includes(q) || 
                (n.desc && n.desc.toLowerCase().includes(q))
            );

            if (matchedNode) {
                network.selectNodes([matchedNode.id]);
                focusNode(matchedNode.id);
                showInspector(matchedNode.id);
            }
        }

        function clearSearch() {
            document.getElementById('search-input').value = '';
            resetGraphHighlight();
            closeInspector();
            network.fit();
        }

        function resetGraphHighlight() {
            if (network) network.unselectAll();
        }

        // Step-by-Step Simulation Logic
        function stepSimulation(direction) {
            const page = getCurrentPage();
            const sequence = page.simulationSequence || [];
            if (sequence.length === 0) return;

            simIndex += direction;
            if (simIndex >= sequence.length) simIndex = 0;
            if (simIndex < 0) simIndex = sequence.length - 1;
            applySimulationStep();
        }

        function applySimulationStep() {
            const page = getCurrentPage();
            const sequence = page.simulationSequence || [];
            const rawNodes = page.nodes || [];
            if (sequence.length === 0 || simIndex < 0 || simIndex >= sequence.length) return;

            const nodeId = sequence[simIndex];
            const node = rawNodes.find(n => n.id === nodeId);
            if (!node) return;

            network.selectNodes([nodeId]);
            focusNode(nodeId);
            showInspector(nodeId);

            document.getElementById('sim-current-index').innerText = simIndex + 1;
            document.getElementById('sim-step-text').innerText = \`گام \${simIndex + 1}: \${node.label.split('\\n')[0]}\`;
        }

        function toggleSimulation() {
            const btn = document.getElementById('btn-play-sim');
            const page = getCurrentPage();
            const sequence = page.simulationSequence || [];
            if (sequence.length === 0) return;

            if (simInterval) {
                clearInterval(simInterval);
                simInterval = null;
                btn.innerHTML = '<i class="fa-solid fa-play"></i> <span>شبیه‌ساز گام‌به‌گام</span>';
                btn.className = 'px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer';
            } else {
                if (simIndex === -1) simIndex = 0;
                applySimulationStep();
                simInterval = setInterval(() => {
                    stepSimulation(1);
                }, 3200);
                btn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>توقف پخش</span>';
                btn.className = 'px-3 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer';
            }
        }

        // Initialize on DOM load
        window.addEventListener('DOMContentLoaded', () => {
            setupPageSwitcher();
            initNetwork();
        });
    </script>
</body>
</html>`;
}

/**
 * Export full local ZIP package containing index.html and assets/vis-network.min.js
 */
export async function exportToVisNetworkZip(project: FlowchartProject, title: string): Promise<void> {
  const zip = new JSZip();

  // 1. Generate HTML
  const htmlContent = generateVisNetworkHtml(project, title);
  zip.file('index.html', htmlContent);

  // 2. Generate assets folder
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    // A) vis-network.min.js
    let visCode = visNetworkRaw;
    if (!visCode || visCode.length < 500) {
      try {
        const res = await fetch('/assets/vis-network.min.js');
        if (res.ok) {
          visCode = await res.text();
        }
      } catch (e) {
        console.warn('Could not fetch local vis-network:', e);
      }
    }
    if (visCode && visCode.length > 500) {
      assetsFolder.file('vis-network.min.js', visCode);
    }

    // B) style.css
    assetsFolder.file('style.css', generateOfflineCss());

    // C) README.txt for the user
    assetsFolder.file(
      'README.txt',
      `پکیج خروجی فلوچارت هوشمند Vis-Network (آفلاین و لوکال)
-----------------------------------------------------------
برای مشاهده، کافیست فایل index.html را در هر مرورگری (Chrome, Edge, Firefox, Safari) باز کنید.
تمامی اسکریپت‌ها و استایل‌ها در پوشه assets قرار دارند و به اینترنت نیازی نیست.`
    );
  }

  // 3. Compress and download as ZIP
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const safeTitle = (title || project.title || 'flowchart').replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `${safeTitle}-VisNetwork-Offline.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export single standalone HTML file
 */
export function exportToVisNetworkSingleHtml(project: FlowchartProject, title: string): void {
  const htmlContent = generateVisNetworkHtml(project, title);
  const safeTitle = (title || project.title || 'flowchart').replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `${safeTitle}-Interactive-Graph.html`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
