import { jsPDF } from 'jspdf';
import { FlowchartProject } from '../types/flowchart';
import { getNodeBoundingBox } from './canvasMath';
import { exportToVisNetworkZip, exportToVisNetworkSingleHtml } from './exportVisNetwork';

export { exportToVisNetworkZip, exportToVisNetworkSingleHtml };

export async function exportToSvg(svgElement: SVGSVGElement, filename: string): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Clean interactive chrome elements like selection boxes, connection handles, cursors
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  // Ensure namespaces
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'flowchart'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToPng(
  svgElement: SVGSVGElement,
  filename: string,
  scale = 2,
  bg = '#FFFFFF'
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  // Get viewBox or dimensions
  const viewBoxAttr = clone.getAttribute('viewBox');
  let width = 1200;
  let height = 800;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill background
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);

  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `${filename || 'flowchart'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportToPdf(
  svgElement: SVGSVGElement,
  project: FlowchartProject,
  title: string
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  const viewBoxAttr = clone.getAttribute('viewBox');
  let width = 1200;
  let height = 800;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Landscape or portrait based on aspect ratio
  const isLandscape = width > height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header Title banner
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(20, 30, 50);
  pdf.text(title || project.title || 'Flowchart Diagram', 14, 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  pdf.text(`Generated by FlowCraft Studio  |  Nodes: ${project.nodes.length}  |  ${dateStr}`, 14, 22);

  // Fit image inside available page area
  const margin = 14;
  const topOffset = 28;
  const availWidth = pageWidth - margin * 2;
  const availHeight = pageHeight - topOffset - margin;

  const imgAspect = width / height;
  let renderWidth = availWidth;
  let renderHeight = availWidth / imgAspect;

  if (renderHeight > availHeight) {
    renderHeight = availHeight;
    renderWidth = availHeight * imgAspect;
  }

  const posX = margin + (availWidth - renderWidth) / 2;
  const posY = topOffset + (availHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);

  pdf.save(`${title || 'flowchart'}.pdf`);
}

/**
 * Export flowchart as offline Vis-Network package (ZIP archive containing index.html and assets/vis-network.min.js)
 */
export async function exportToHtml(project: FlowchartProject, title: string): Promise<void> {
  return exportToVisNetworkZip(project, title);
}

export function exportToJson(project: FlowchartProject): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || 'flowchart-project'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
