import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { ExplainNode } from '../types/explain';
import type { ParsedExplain } from './parser';
export { ParseError } from './parser';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 140;

function parseCost(costString: string | undefined): number {
  if (!costString) return 0;
  const match = costString.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function calculateCostPercentages(
  rootNode: ExplainNode,
  totalCost: number,
  parentCost: number = totalCost
): void {
  // Calculate this node's cost
  const nodeCost = parseCost(rootNode.costInfo?.query_cost as string | undefined);

  if (totalCost > 0) {
    rootNode.costPercent = (nodeCost / totalCost) * 100;
  }

  if (parentCost > 0) {
    rootNode.relativeCostPercent = (nodeCost / parentCost) * 100;
  }

  // Recursively calculate for children
  for (const child of rootNode.children) {
    calculateCostPercentages(child, totalCost, nodeCost || parentCost);
  }
}

export interface TransformedData {
  nodes: Node<ExplainNode>[];
  edges: Edge[];
}

function flattenTree(node: ExplainNode, parent: string | null, nodes: ExplainNode[], edges: { source: string; target: string }[]): void {
  nodes.push(node);

  if (parent) {
    edges.push({ source: parent, target: node.id });
  }

  for (const child of node.children) {
    flattenTree(child, node.id, nodes, edges);
  }
}

function getDagreLayout(nodes: ExplainNode[], edges: { source: string; target: string }[]): Map<string, { x: number; y: number }> {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const nodeWithPosition = dagreGraph.node(node.id);
    positions.set(node.id, {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    });
  }

  return positions;
}

export function transformToFlow(parsed: ParsedExplain): TransformedData {
  const rootNode = parsed.root;
  const chainEdges = parsed.chainEdges;

  // Calculate total cost from root
  const totalCost = parseCost(rootNode.costInfo?.query_cost as string | undefined);

  // Apply cost percentages to all nodes
  calculateCostPercentages(rootNode, totalCost);

  const flatNodes: ExplainNode[] = [];
  const flatEdges: { source: string; target: string }[] = [];

  // Flatten tree to get parent-child edges
  flattenTree(rootNode, null, flatNodes, flatEdges);

  // Combine tree edges with chain edges
  // Chain edges connect tables in nested_loop sequentially
  const allEdges = [...flatEdges, ...chainEdges];

  const positions = getDagreLayout(flatNodes, allEdges);

  const nodes: Node<ExplainNode>[] = flatNodes.map(node => ({
    id: node.id,
    type: 'explainNode',
    position: positions.get(node.id) || { x: 0, y: 0 },
    data: node,
  }));

  const edges: Edge[] = allEdges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
  }));

  return { nodes, edges };
}

// Re-export for convenience
export { parseExplainJson } from './parser';
export type { ParsedExplain } from './parser';
