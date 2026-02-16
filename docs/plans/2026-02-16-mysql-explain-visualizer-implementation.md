# MySQL EXPLAIN Visualizer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React application that visualizes MySQL EXPLAIN FORMAT=JSON output as an interactive flowchart.

**Architecture:** Frontend-only SPA with side panel for JSON input and main area for React Flow visualization. Parser validates JSON and extracts tree structure, transformer converts to React Flow nodes/edges with auto-layout.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Flow

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/index.css`

**Step 1: Initialize Vite project with React and TypeScript**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

Expected: Project files created, overwrite if prompted.

**Step 2: Install dependencies**

Run:
```bash
npm install @xyflow/react dagre @types/dagre
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: All packages installed successfully.

**Step 3: Configure Tailwind CSS**

Modify: `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Modify: `src/index.css` (replace content)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

**Step 4: Configure Vite for gh-pages**

Modify: `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mysql-explain-visualizer/',
  plugins: [react()],
})
```

**Step 5: Verify setup**

Run:
```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173, shows Vite + React template.

**Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize Vite + React + TypeScript + Tailwind project

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: TypeScript Types for EXPLAIN JSON

**Files:**
- Create: `src/types/explain.ts`

**Step 1: Create type definitions**

Create: `src/types/explain.ts`

```ts
// MySQL EXPLAIN FORMAT=JSON type definitions

export interface CostInfo {
  query_cost?: string;
  read_cost?: string;
  eval_cost?: string;
  prefix_cost?: string;
  data_read_per_join?: string;
}

export interface AttachedCondition {
  attached?: string;
}

export interface TableInfo {
  table_name?: string;
  access_type?: string;
  possible_keys?: string[];
  key?: string;
  used_key_parts?: string[];
  key_length?: string;
  ref?: string[];
  rows_examined_per_scan?: number;
  rows_produced_per_join?: number;
  filtered?: string;
  cost_info?: CostInfo;
  used_columns?: string[];
  attached_condition?: string;
}

export interface OrderByOperation {
  using_filesort?: boolean;
  using_temporary_table?: boolean;
  table?: TableInfo;
  cost_info?: CostInfo;
  nested_loop?: NestedLoop[];
}

export interface GroupByOperation {
  using_temporary_table?: boolean;
  using_filesort?: boolean;
  table?: TableInfo;
  cost_info?: CostInfo;
  nested_loop?: NestedLoop[];
}

export interface NestedLoop {
  table?: TableInfo;
  nested_loop?: NestedLoop[];
  ordering_operation?: OrderByOperation;
  grouping_operation?: GroupByOperation;
}

export interface QueryBlock {
  select_id?: number;
  cost_info?: CostInfo;
  table?: TableInfo;
  nested_loop?: NestedLoop[];
  ordering_operation?: OrderByOperation;
  grouping_operation?: GroupByOperation;
  message?: string;
}

export interface ExplainOutput {
  query_block: QueryBlock;
}

// Parsed node for visualization
export interface ExplainNode {
  id: string;
  type: 'table' | 'operation';
  operationType: string;
  tableName?: string;
  accessType?: string;
  key?: string;
  rowsExamined?: number;
  costInfo?: CostInfo;
  attachedCondition?: string;
  usedColumns?: string[];
  isCritical: boolean;
  children: ExplainNode[];
  raw: TableInfo | OrderByOperation | GroupByOperation;
}
```

**Step 2: Commit**

```bash
git add src/types/explain.ts
git commit -m "feat: add TypeScript types for MySQL EXPLAIN JSON

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Parser Utility

**Files:**
- Create: `src/utils/parser.ts`
- Create: `src/utils/parser.test.ts`

**Step 1: Write failing tests**

Create: `src/utils/parser.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { parseExplainJson, ParseError } from './parser';

describe('parseExplainJson', () => {
  it('should parse valid EXPLAIN JSON', () => {
    const input = JSON.stringify({
      query_block: {
        select_id: 1,
        table: {
          table_name: 'users',
          access_type: 'ALL',
          rows_examined_per_scan: 1000,
        },
      },
    });

    const result = parseExplainJson(input);

    expect(result.type).toBe('table');
    expect(result.tableName).toBe('users');
    expect(result.accessType).toBe('ALL');
  });

  it('should reject invalid JSON', () => {
    const input = '{ invalid json }';

    expect(() => parseExplainJson(input)).toThrow(ParseError);
  });

  it('should reject JSON without query_block', () => {
    const input = JSON.stringify({ foo: 'bar' });

    expect(() => parseExplainJson(input)).toThrow(ParseError);
  });

  it('should detect FULL TABLE SCAN as critical', () => {
    const input = JSON.stringify({
      query_block: {
        table: {
          table_name: 'users',
          access_type: 'ALL',
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(true);
  });

  it('should detect filesort as critical', () => {
    const input = JSON.stringify({
      query_block: {
        ordering_operation: {
          using_filesort: true,
          table: { table_name: 'users' },
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(true);
  });

  it('should not mark index scan as critical', () => {
    const input = JSON.stringify({
      query_block: {
        table: {
          table_name: 'users',
          access_type: 'ref',
          key: 'PRIMARY',
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
npm install -D vitest
npm test
```

Expected: Tests fail with "Cannot find module './parser'"

**Step 3: Implement parser**

Create: `src/utils/parser.ts`

```ts
import type { ExplainOutput, ExplainNode, QueryBlock, NestedLoop, OrderByOperation, GroupByOperation, TableInfo } from '../types/explain';

export class ParseError extends Error {
  constructor(message: string, public code: 'PARSE_ERROR' | 'INVALID_FORMAT' | 'EMPTY_INPUT') {
    super(message);
    this.name = 'ParseError';
  }
}

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node_${nodeIdCounter++}`;
}

function isCriticalAccess(accessType?: string): boolean {
  return accessType === 'ALL' || accessType === 'fulltext';
}

function isCriticalOperation(op?: OrderByOperation | GroupByOperation): boolean {
  if (!op) return false;
  return Boolean(op.using_filesort || op.using_temporary_table);
}

function parseTableInfo(table: TableInfo, parentId: string): ExplainNode {
  const id = generateNodeId();
  return {
    id,
    type: 'table',
    operationType: table.access_type || 'unknown',
    tableName: table.table_name,
    accessType: table.access_type,
    key: table.key,
    rowsExamined: table.rows_examined_per_scan,
    costInfo: table.cost_info,
    attachedCondition: table.attached_condition,
    usedColumns: table.used_columns,
    isCritical: isCriticalAccess(table.access_type),
    children: [],
    raw: table,
  };
}

function parseOrderBy(op: OrderByOperation): ExplainNode {
  const id = generateNodeId();
  const children: ExplainNode[] = [];

  if (op.table) {
    children.push(parseTableInfo(op.table, id));
  }

  if (op.nested_loop) {
    children.push(...op.nested_loop.map(nl => parseNestedLoop(nl)));
  }

  return {
    id,
    type: 'operation',
    operationType: 'ORDER BY',
    isCritical: isCriticalOperation(op),
    costInfo: op.cost_info,
    children,
    raw: op,
  };
}

function parseGroupBy(op: GroupByOperation): ExplainNode {
  const id = generateNodeId();
  const children: ExplainNode[] = [];

  if (op.table) {
    children.push(parseTableInfo(op.table, id));
  }

  if (op.nested_loop) {
    children.push(...op.nested_loop.map(nl => parseNestedLoop(nl)));
  }

  return {
    id,
    type: 'operation',
    operationType: 'GROUP BY',
    isCritical: isCriticalOperation(op),
    costInfo: op.cost_info,
    children,
    raw: op,
  };
}

function parseNestedLoop(nl: NestedLoop): ExplainNode {
  const id = generateNodeId();
  const children: ExplainNode[] = [];

  if (nl.table) {
    children.push(parseTableInfo(nl.table, id));
  }

  if (nl.ordering_operation) {
    children.push(parseOrderBy(nl.ordering_operation));
  }

  if (nl.grouping_operation) {
    children.push(parseGroupBy(nl.grouping_operation));
  }

  if (nl.nested_loop) {
    children.push(...nl.nested_loop.map(n => parseNestedLoop(n)));
  }

  return {
    id,
    type: 'operation',
    operationType: 'nested_loop',
    isCritical: children.some(c => c.isCritical),
    children,
    raw: {} as TableInfo,
  };
}

function parseQueryBlock(qb: QueryBlock): ExplainNode {
  nodeIdCounter = 0;
  const id = generateNodeId();
  const children: ExplainNode[] = [];

  if (qb.table) {
    children.push(parseTableInfo(qb.table, id));
  }

  if (qb.ordering_operation) {
    children.push(parseOrderBy(qb.ordering_operation));
  }

  if (qb.grouping_operation) {
    children.push(parseGroupBy(qb.grouping_operation));
  }

  if (qb.nested_loop) {
    children.push(...qb.nested_loop.map(nl => parseNestedLoop(nl)));
  }

  return {
    id,
    type: 'operation',
    operationType: 'query_block',
    isCritical: children.some(c => c.isCritical),
    costInfo: qb.cost_info,
    children,
    raw: {} as TableInfo,
  };
}

export function parseExplainJson(input: string): ExplainNode {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new ParseError('Input is empty', 'EMPTY_INPUT');
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch (e) {
    throw new ParseError(`Invalid JSON: ${(e as Error).message}`, 'PARSE_ERROR');
  }

  if (typeof data !== 'object' || data === null) {
    throw new ParseError('JSON must be an object', 'INVALID_FORMAT');
  }

  if (!('query_block' in data)) {
    throw new ParseError('Missing "query_block" field - not a valid EXPLAIN output', 'INVALID_FORMAT');
  }

  return parseQueryBlock((data as ExplainOutput).query_block);
}
```

Add to `package.json` scripts:
```json
"scripts": {
  "test": "vitest run"
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/utils/parser.ts src/utils/parser.test.ts package.json
git commit -m "feat: add JSON parser for MySQL EXPLAIN output

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Transformer Utility

**Files:**
- Create: `src/utils/transformer.ts`

**Step 1: Implement transformer**

Create: `src/utils/transformer.ts`

```ts
import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { ExplainNode } from '../types/explain';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 120;

export interface TransformedData {
  nodes: Node[];
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
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
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

export function transformToFlow(rootNode: ExplainNode): TransformedData {
  const flatNodes: ExplainNode[] = [];
  const flatEdges: { source: string; target: string }[] = [];

  flattenTree(rootNode, null, flatNodes, flatEdges);

  const positions = getDagreLayout(flatNodes, flatEdges);

  const nodes: Node[] = flatNodes.map(node => ({
    id: node.id,
    type: 'explainNode',
    position: positions.get(node.id) || { x: 0, y: 0 },
    data: node,
  }));

  const edges: Edge[] = flatEdges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
  }));

  return { nodes, edges };
}
```

**Step 2: Commit**

```bash
git add src/utils/transformer.ts
git commit -m "feat: add transformer to convert ExplainNode to React Flow format

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: useExplainParser Hook

**Files:**
- Create: `src/hooks/useExplainParser.ts`

**Step 1: Implement hook**

Create: `src/hooks/useExplainParser.ts`

```ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { parseExplainJson, ParseError } from '../utils/parser';
import { transformToFlow } from '../utils/transformer';
import type { ExplainNode } from '../types/explain';

export type ErrorCode = 'PARSE_ERROR' | 'INVALID_FORMAT' | 'EMPTY_INPUT';

export interface ParserError {
  code: ErrorCode;
  message: string;
}

export interface UseExplainParserResult {
  nodes: Node[];
  edges: Edge[];
  error: ParserError | null;
  parse: (input: string) => void;
  rawTree: ExplainNode | null;
}

export function useExplainParser(debounceMs: number = 500): UseExplainParserResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<ParserError | null>(null);
  const [rawTree, setRawTree] = useState<ExplainNode | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parse = useCallback((input: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const tree = parseExplainJson(input);
        const { nodes: flowNodes, edges: flowEdges } = transformToFlow(tree);

        setRawTree(tree);
        setNodes(flowNodes);
        setEdges(flowEdges);
        setError(null);
      } catch (e) {
        if (e instanceof ParseError) {
          setError({
            code: e.code,
            message: e.message,
          });
        } else {
          setError({
            code: 'PARSE_ERROR',
            message: (e as Error).message,
          });
        }
        setNodes([]);
        setEdges([]);
        setRawTree(null);
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { nodes, edges, error, parse, rawTree };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useExplainParser.ts
git commit -m "feat: add useExplainParser hook with debounce

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: ErrorBlock Component

**Files:**
- Create: `src/components/ErrorBlock/ErrorBlock.tsx`
- Create: `src/components/ErrorBlock/index.ts`

**Step 1: Implement ErrorBlock**

Create: `src/components/ErrorBlock/ErrorBlock.tsx`

```tsx
import type { ParserError } from '../../hooks/useExplainParser';

interface ErrorBlockProps {
  error: ParserError;
}

export function ErrorBlock({ error }: ErrorBlockProps) {
  const errorTitles: Record<string, string> = {
    PARSE_ERROR: 'JSON Parse Error',
    INVALID_FORMAT: 'Invalid Format',
    EMPTY_INPUT: 'Empty Input',
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
      <div className="flex items-start gap-2">
        <span className="text-red-500 text-lg">⚠️</span>
        <div>
          <h4 className="font-medium text-red-800 text-sm">
            {errorTitles[error.code] || 'Error'}
          </h4>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    </div>
  );
}
```

Create: `src/components/ErrorBlock/index.ts`

```ts
export { ErrorBlock } from './ErrorBlock';
```

**Step 2: Commit**

```bash
git add src/components/ErrorBlock/
git commit -m "feat: add ErrorBlock component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: ExplainNode Component (Custom React Flow Node)

**Files:**
- Create: `src/components/ExplainNode/ExplainNode.tsx`
- Create: `src/components/ExplainNode/index.ts`

**Step 1: Implement custom node**

Create: `src/components/ExplainNode/ExplainNode.tsx`

```tsx
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExplainNode } from '../../types/explain';

function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return num.toLocaleString();
}

function ExplainNodeComponent({ data }: NodeProps<ExplainNode>) {
  const isCritical = data.isCritical;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border-2 min-w-[220px]
        ${isCritical ? 'border-red-400' : 'border-gray-200'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Header */}
      <div
        className={`
          px-3 py-2 rounded-t-md text-sm font-medium
          ${isCritical ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}
        `}
      >
        {data.operationType}
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-sm">
        {data.tableName && (
          <div className="mb-1">
            <span className="text-gray-500">Table:</span>{' '}
            <span className="font-medium text-gray-900">{data.tableName}</span>
          </div>
        )}

        {data.key && (
          <div className="mb-1">
            <span className="text-gray-500">Key:</span>{' '}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{data.key}</span>
          </div>
        )}

        {data.rowsExamined !== undefined && (
          <div>
            <span className="text-gray-500">Rows:</span>{' '}
            <span className="font-medium">{formatNumber(data.rowsExamined)}</span>
          </div>
        )}
      </div>

      {/* Tooltip info on hover */}
      {(data.costInfo || data.attachedCondition || data.usedColumns) && (
        <div className="absolute left-full ml-2 top-0 z-10 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded p-2 max-w-xs shadow-lg">
            {data.costInfo?.query_cost && (
              <div className="mb-1">
                <span className="text-gray-400">Cost:</span> {data.costInfo.query_cost}
              </div>
            )}
            {data.attachedCondition && (
              <div className="mb-1">
                <span className="text-gray-400">Condition:</span>{' '}
                <code className="text-yellow-300">{data.attachedCondition}</code>
              </div>
            )}
            {data.usedColumns && data.usedColumns.length > 0 && (
              <div>
                <span className="text-gray-400">Columns:</span>{' '}
                {data.usedColumns.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

export const ExplainNode = memo(ExplainNodeComponent);
```

Create: `src/components/ExplainNode/index.ts`

```ts
export { ExplainNode } from './ExplainNode';
```

**Step 2: Commit**

```bash
git add src/components/ExplainNode/
git commit -m "feat: add ExplainNode custom React Flow node

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: FlowChart Component

**Files:**
- Create: `src/components/FlowChart/FlowChart.tsx`
- Create: `src/components/FlowChart/index.ts`

**Step 1: Implement FlowChart**

Create: `src/components/FlowChart/FlowChart.tsx`

```tsx
import { ReactFlow, Controls, Background, MiniMap, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ExplainNode } from '../ExplainNode';

interface FlowChartProps {
  nodes: Node[];
  edges: Edge[];
}

const nodeTypes = {
  explainNode: ExplainNode,
};

export function FlowChart({ nodes, edges }: FlowChartProps) {
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data?.isCritical ? '#fca5a5' : '#e5e7eb';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
```

Create: `src/components/FlowChart/index.ts`

```ts
export { FlowChart } from './FlowChart';
```

**Step 2: Commit**

```bash
git add src/components/FlowChart/
git commit -m "feat: add FlowChart component with React Flow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: InputPanel Component

**Files:**
- Create: `src/components/InputPanel/InputPanel.tsx`
- Create: `src/components/InputPanel/index.ts`

**Step 1: Implement InputPanel**

Create: `src/components/InputPanel/InputPanel.tsx`

```tsx
import { useState, useCallback } from 'react';
import type { ParserError } from '../../hooks/useExplainParser';
import { ErrorBlock } from '../ErrorBlock';

const EXAMPLE_JSON = `{
  "query_block": {
    "select_id": 1,
    "cost_info": {
      "query_cost": "1.20"
    },
    "table": {
      "table_name": "users",
      "access_type": "ALL",
      "rows_examined_per_scan": 1000,
      "rows_produced_per_join": 100,
      "filtered": "10.00",
      "cost_info": {
        "read_cost": "1.00",
        "eval_cost": "0.10"
      },
      "used_columns": ["id", "name", "email"]
    }
  }
}`;

interface InputPanelProps {
  onParse: (input: string) => void;
  error: ParserError | null;
}

export function InputPanel({ onParse, error }: InputPanelProps) {
  const [input, setInput] = useState('');
  const [width, setWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      onParse(value);
    },
    [onParse]
  );

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_JSON);
    onParse(EXAMPLE_JSON);
  }, [onParse]);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(280, Math.min(500, newWidth)));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach resize listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  return (
    <div
      className="h-full bg-gray-50 border-l border-gray-200 flex flex-col relative"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-800">EXPLAIN JSON</h2>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-3 overflow-hidden">
        <textarea
          className="w-full h-full p-3 border border-gray-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Paste EXPLAIN FORMAT=JSON output here..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Error block */}
      {error && (
        <div className="px-3">
          <ErrorBlock error={error} />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <button
          onClick={handleLoadExample}
          className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          Load Example
        </button>
      </div>
    </div>
  );
}
```

Create: `src/components/InputPanel/index.ts`

```ts
export { InputPanel } from './InputPanel';
```

**Step 2: Commit**

```bash
git add src/components/InputPanel/
git commit -m "feat: add InputPanel with resizable sidebar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Main App Layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css` (delete)

**Step 1: Implement App**

Modify: `src/App.tsx`

```tsx
import { useExplainParser } from './hooks/useExplainParser';
import { FlowChart } from './components/FlowChart';
import { InputPanel } from './components/InputPanel';

function App() {
  const { nodes, edges, error, parse } = useExplainParser(500);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Main visualization area */}
      <div className="flex-1 bg-gray-100">
        {nodes.length > 0 ? (
          <FlowChart nodes={nodes} edges={edges} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">Paste EXPLAIN JSON to visualize</p>
            </div>
          </div>
        )}
      </div>

      {/* Input panel */}
      <InputPanel onParse={parse} error={error} />
    </div>
  );
}

export default App;
```

Delete: `src/App.css`

**Step 2: Verify app works**

Run:
```bash
npm run dev
```

Expected: App loads, shows empty state, side panel works, example loads and renders.

**Step 3: Commit**

```bash
git add src/App.tsx
git rm src/App.css
git commit -m "feat: integrate all components in App layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: gh-pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `package.json`

**Step 1: Add deploy script**

Add to `package.json` scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

Add devDependencies:
```bash
npm install -D gh-pages
```

**Step 2: Create GitHub Actions workflow**

Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml package.json package-lock.json
git commit -m "feat: add GitHub Actions deployment to gh-pages

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project setup | Vite, React, Tailwind config |
| 2 | TypeScript types | `src/types/explain.ts` |
| 3 | Parser utility | `src/utils/parser.ts` |
| 4 | Transformer utility | `src/utils/transformer.ts` |
| 5 | useExplainParser hook | `src/hooks/useExplainParser.ts` |
| 6 | ErrorBlock component | `src/components/ErrorBlock/` |
| 7 | ExplainNode component | `src/components/ExplainNode/` |
| 8 | FlowChart component | `src/components/FlowChart/` |
| 9 | InputPanel component | `src/components/InputPanel/` |
| 10 | App layout | `src/App.tsx` |
| 11 | gh-pages deployment | `.github/workflows/deploy.yml` |
