# MySQL Workbench Style Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign EXPLAIN visualization to match MySQL Workbench style with cost-based coloring and left-to-right layout.

**Architecture:** Update ExplainNode component with new visual design, change dagre layout direction to left-right, add cost percentage calculations to transformer.

**Tech Stack:** React, TypeScript, React Flow, dagre, Tailwind CSS

---

### Task 1: Add Cost Percentage to Types

**Files:**
- Modify: `src/types/explain.ts:69-85`

**Step 1: Add cost percentages to ExplainNode type**

Add `costPercent` and `relativeCostPercent` fields to the ExplainNode interface:

```typescript
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
  // Cost percentages for MySQL Workbench style
  costPercent?: number;
  relativeCostPercent?: number;
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}
```

**Step 2: Commit**

```bash
git add src/types/explain.ts
git commit -m "feat: add cost percentage fields to ExplainNode type

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Add Cost Calculation Utility

**Files:**
- Modify: `src/utils/transformer.ts`

**Step 1: Add cost calculation function**

Add a function to calculate cost percentages and apply them to nodes:

```typescript
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
```

**Step 2: Update transformToFlow to calculate costs**

Modify the function to extract total cost and calculate percentages:

```typescript
export function transformToFlow(rootNode: ExplainNode): TransformedData {
  // Calculate total cost from root
  const totalCost = parseCost(rootNode.costInfo?.query_cost as string | undefined);

  // Apply cost percentages to all nodes
  calculateCostPercentages(rootNode, totalCost);

  const flatNodes: ExplainNode[] = [];
  const flatEdges: { source: string; target: string }[] = [];

  flattenTree(rootNode, null, flatNodes, flatEdges);

  const positions = getDagreLayout(flatNodes, flatEdges);

  const nodes: Node<ExplainNode>[] = flatNodes.map(node => ({
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

**Step 3: Commit**

```bash
git add src/utils/transformer.ts
git commit -m "feat: add cost percentage calculation to transformer

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Change Layout Direction to Left-Right

**Files:**
- Modify: `src/utils/transformer.ts:29`

**Step 1: Update dagre layout direction**

Change `rankdir` from `'TB'` to `'LR'`:

```typescript
function getDagreLayout(nodes: ExplainNode[], edges: { source: string; target: string }[]): Map<string, { x: number; y: number }> {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 });
  // ... rest stays the same
}
```

**Step 2: Commit**

```bash
git add src/utils/transformer.ts
git commit -m "feat: change layout direction to left-right

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Redesign ExplainNode Component

**Files:**
- Modify: `src/components/ExplainNode/ExplainNode.tsx`

**Step 1: Add helper functions for colors and formatting**

Add these helper functions at the top of the file:

```typescript
type AccessType = 'ALL' | 'range' | 'index' | 'ref' | 'eq_ref' | 'const' | 'system' | 'fulltext' | string;

function getAccessColor(accessType: AccessType | undefined): { bg: string; border: string; text: string } {
  switch (accessType) {
    case 'ALL':
    case 'fulltext':
      return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' };
    case 'range':
      return { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' };
    case 'index':
    case 'ref':
    case 'eq_ref':
      return { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' };
    case 'const':
    case 'system':
      return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' };
    default:
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' };
  }
}

function getIntensityClass(costPercent: number | undefined): string {
  if (costPercent === undefined) return '';
  if (costPercent > 50) return 'ring-2 ring-offset-1 ring-opacity-50';
  if (costPercent > 10) return '';
  return 'opacity-80';
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}
```

**Step 2: Update component with new design**

Replace the entire `ExplainNodeInner` function:

```typescript
interface ExplainNodeData extends ExplainNode {
  costPercent?: number;
  relativeCostPercent?: number;
}

function ExplainNodeInner({ data }: NodeProps) {
  const nodeData = data as ExplainNodeData;
  const colors = getAccessColor(nodeData.accessType);
  const intensityClass = getIntensityClass(nodeData.costPercent);
  const table = nodeData.raw as TableInfo;

  const hasDetails = table.possible_keys?.length ||
    table.key_length ||
    table.ref?.length ||
    table.filtered ||
    nodeData.attachedCondition ||
    nodeData.usedColumns?.length;

  return (
    <div className={`group relative ${intensityClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-3 !h-3" />

      <div
        className={`
          bg-white rounded-lg shadow-md border-2 min-w-[200px]
          ${colors.border}
        `}
      >
        {/* Header with table name */}
        <div className={`${colors.bg} ${colors.text} px-3 py-2 rounded-t-md font-medium text-sm flex items-center gap-2`}>
          <span>📊</span>
          <span className="truncate">{nodeData.tableName || nodeData.operationType}</span>
        </div>

        {/* Body with stats */}
        <div className="px-3 py-2 text-xs space-y-1">
          {nodeData.costPercent !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cost:</span>
              <span className="font-medium text-gray-900">
                {formatPercent(nodeData.costPercent)}
                {nodeData.relativeCostPercent !== undefined && nodeData.relativeCostPercent !== nodeData.costPercent && (
                  <span className="text-gray-400 ml-1">({formatPercent(nodeData.relativeCostPercent)})</span>
                )}
              </span>
            </div>
          )}

          {nodeData.accessType && (
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-mono bg-gray-100 px-1 rounded">{nodeData.accessType}</span>
            </div>
          )}

          {nodeData.key && (
            <div className="flex justify-between">
              <span className="text-gray-500">Key:</span>
              <span className="font-mono bg-gray-100 px-1 rounded truncate max-w-[100px]">{nodeData.key}</span>
            </div>
          )}

          {nodeData.rowsExamined !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-500">Rows:</span>
              <span className="font-medium">{formatNumber(nodeData.rowsExamined)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover tooltip with details */}
      {hasDetails && (
        <div className="absolute left-full ml-3 top-0 z-50 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded-lg p-3 min-w-[250px] shadow-xl">
            {table.possible_keys && table.possible_keys.length > 0 && (
              <div className="mb-2">
                <span className="text-gray-400">Possible keys:</span>{' '}
                <span className="text-blue-300">{table.possible_keys.join(', ')}</span>
              </div>
            )}

            {table.key_length && (
              <div className="mb-2">
                <span className="text-gray-400">Key length:</span> {table.key_length}
              </div>
            )}

            {table.ref && table.ref.length > 0 && (
              <div className="mb-2">
                <span className="text-gray-400">Ref:</span> {table.ref.join(', ')}
              </div>
            )}

            {table.filtered && (
              <div className="mb-2">
                <span className="text-gray-400">Filtered:</span> {table.filtered}
              </div>
            )}

            {nodeData.attachedCondition && (
              <>
                <div className="border-t border-gray-600 my-2" />
                <div className="mb-2">
                  <span className="text-gray-400">Condition:</span>
                  <div className="text-yellow-300 font-mono break-all">{nodeData.attachedCondition}</div>
                </div>
              </>
            )}

            {nodeData.usedColumns && nodeData.usedColumns.length > 0 && (
              <>
                <div className="border-t border-gray-600 my-2" />
                <div>
                  <span className="text-gray-400">Used columns:</span>
                  <div className="text-green-300 break-all">{nodeData.usedColumns.join(', ')}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-3 !h-3" />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/ExplainNode/ExplainNode.tsx
git commit -m "feat: redesign ExplainNode with MySQL Workbench style

- Add color coding by access type
- Show cost percentages (total and relative)
- Add detailed hover tooltip
- Update handle positions for left-right layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Update Node Dimensions for New Layout

**Files:**
- Modify: `src/utils/transformer.ts:9-10`

**Step 1: Adjust node dimensions for horizontal layout**

```typescript
const nodeWidth = 220;
const nodeHeight = 140;
```

**Step 2: Commit**

```bash
git add src/utils/transformer.ts
git commit -m "feat: adjust node dimensions for horizontal layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Update Edge Style for Horizontal Layout

**Files:**
- Modify: `src/components/FlowChart/FlowChart.tsx`

**Step 1: Update edge options for better horizontal flow**

```typescript
defaultEdgeOptions={{
  type: 'smoothstep',
  style: { strokeWidth: 2 },
}}
```

**Step 2: Commit**

```bash
git add src/components/FlowChart/FlowChart.tsx
git commit -m "feat: update edge style for horizontal layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Run Tests and Verify

**Step 1: Run existing tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Start dev server and test manually**

```bash
npm run dev
```

Expected: Visualization shows with left-to-right layout, colored nodes, cost percentages

---

### Task 8: Final Commit

```bash
git add -A
git commit -m "feat: complete MySQL Workbench style visualization

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
