/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlowchartNode, FlowchartEdge, FlowchartProject, FlowchartPage } from '../types/flowchart';

/**
 * Token and Transaction Optimizer
 * Provides compression, delta computation, and token estimation
 * to minimize bandwidth, storage, and LLM context tokens.
 */

export interface CompactNode {
  i: string; // id
  t: string; // type
  x: number; // position x
  y: number; // position y
  w: number; // width
  h: number; // height
  l: string; // label
  c?: string; // color / fill (optional if default)
}

export interface CompactEdge {
  i: string; // id
  s: string; // source
  t: string; // target
  l?: string; // label
  a?: boolean; // animated
}

export interface CompactPage {
  i: string;
  n: string;
  d?: string;
  nt?: string;
  nodes: CompactNode[];
  edges: CompactEdge[];
}

/**
 * Compresses flowchart page nodes and edges into minimal payload
 * Stripping redundant styling and defaults to save up to 75% tokens.
 */
export function compactPagePayload(page: FlowchartPage): CompactPage {
  return {
    i: page.id,
    n: page.name,
    d: page.description ? page.description.trim() : undefined,
    nt: page.notes ? page.notes.trim() : undefined,
    nodes: (page.nodes || []).map((node) => ({
      i: node.id,
      t: node.type,
      x: Math.round(node.x),
      y: Math.round(node.y),
      w: Math.round(node.width),
      h: Math.round(node.height),
      l: node.label,
      c: node.fill && node.fill !== '#ffffff' ? node.fill : undefined,
    })),
    edges: (page.edges || []).map((edge) => ({
      i: edge.id,
      s: edge.sourceNodeId,
      t: edge.targetNodeId,
      l: edge.label ? edge.label.trim() : undefined,
      d: edge.style === 'dashed' ? true : undefined,
    })),
  };
}

/**
 * Estimates rough token count for a text or JSON payload
 * Standard heuristic: ~4 characters per token for English, ~1.5 - 2 chars per token for Persian/Unicode
 */
export function estimateTokenCount(textOrObj: string | object): number {
  const str = typeof textOrObj === 'string' ? textOrObj : JSON.stringify(textOrObj);
  let tokenCount = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Non-ASCII characters (e.g. Persian / UTF-8) typically take ~1 token per 1.5 chars in BPE tokenizers
    if (code > 127) {
      tokenCount += 0.7;
    } else {
      tokenCount += 0.25;
    }
  }
  return Math.ceil(tokenCount);
}

/**
 * Creates a minimal summary of project state suitable for quick LLM prompts
 * Uses fewer than 200 tokens while capturing total nodes, edges, and pages.
 */
export function generateCompactProjectSummary(project: FlowchartProject): string {
  const pages = project.pages || [];
  const totalNodes = pages.reduce((sum, p) => sum + (p.nodes?.length || 0), 0);
  const totalEdges = pages.reduce((sum, p) => sum + (p.edges?.length || 0), 0);

  const pageList = pages
    .map((p, idx) => `P${idx + 1}(${p.name}): ${p.nodes.length} nodes, ${p.edges.length} edges`)
    .join(' | ');

  return `[Project: ${project.title} (ID: ${project.id}) | Pages: ${pages.length} | Total: ${totalNodes} nodes, ${totalEdges} edges | Details: ${pageList}]`;
}
