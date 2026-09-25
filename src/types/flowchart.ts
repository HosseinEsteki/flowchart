export type FlowchartNodeType =
  | 'terminal'
  | 'process'
  | 'decision'
  | 'input-output'
  | 'document'
  | 'subroutine'
  | 'database'
  | 'connector'
  | 'note';

export type FlowchartPort = 'top' | 'right' | 'bottom' | 'left';

export type LineType = 'orthogonal' | 'curved' | 'straight';

export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  notes?: string;
  locked?: boolean;
}

export interface FlowchartEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: FlowchartPort;
  targetNodeId: string;
  targetPort: FlowchartPort;
  lineType: LineType;
  label?: string;
  color: string;
  strokeWidth: number;
  style: 'solid' | 'dashed';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface FlowchartVersion {
  id: string;
  timestamp: number;
  name: string;
  author: string;
  nodeCount: number;
  edgeCount: number;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface FlowchartPage {
  id: string;
  name: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface FlowchartProject {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  theme: string;
  activePageId?: string;
  pages?: FlowchartPage[];
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  versions: FlowchartVersion[];
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  activeNodeId?: string | null;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}
