# MySQL Workbench Style Design

## Overview

Redesign the EXPLAIN visualization to match MySQL Workbench style with cost-based coloring and left-to-right layout.

## Visual Style

### Block Design

Each block is a rounded rectangle containing:

**Main information:**
```
┌─────────────────────────────────┐
│ 📊 users                        │  ← table name
├─────────────────────────────────┤
│ Cost: 45.2% (78.5%)            │  ← total % (relative %)
│ Type: ref                       │  ← access type
│ Key: idx_user_email            │  ← used key
│ Rows: 1,234                    │  ← rows_examined
└─────────────────────────────────┘
```

**Color scheme (combined):**
Base color by `access_type`:
- `ALL` → red (full table scan)
- `range` → orange (index range scan)
- `index`, `ref`, `eq_ref` → yellow
- `const`, `system` → green

Intensity by cost %:
- low (<10%) — pale
- medium (10-50%) — normal
- high (>50%) — saturated

### Hover Details

Tooltip on hover with:

```
┌──────────────────────────────────────┐
│ Possible keys: PRIMARY, idx_email    │
│ Key length: 76                       │
│ Ref: const                           │
│ Filtered: 100.00%                    │
│ ─────────────────────────────────────│
│ Condition: users.status = 'active'   │
│ ─────────────────────────────────────│
│ Used columns: id, email, status      │
└──────────────────────────────────────┘
```

Show only non-empty fields. Separate condition and columns with dividers.

## Layout

### Left-to-Right Flow

- Root node (query_block) on the left
- Child tables extend to the right
- Nested loop visualized as branching down
- Connections — horizontal/vertical lines with arrows

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ SELECT   │────▶│ users    │────▶│ orders   │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │ products │
                 └──────────┘
```

### Connection Types

- Solid line — regular connection (JOIN)
- Dashed line — subquery/derived table
- Line thickness proportional to row count

## Cost Calculation

### Total Cost Percentage

Each block shows % of total query cost:
- Parse `query_cost` from root `query_block.cost_info`
- Calculate each node's share

### Relative Cost Percentage

Shows % relative to parent node:
- Useful for understanding which branch is expensive
- Display in parentheses after total %

## Implementation

### File Changes

1. **`ExplainNode.tsx`** — new block design:
   - Horizontal content layout
   - Cost % calculation (total and relative)
   - Color coding by access_type + cost
   - Hover tooltip with details

2. **`FlowChart.tsx`** — left-to-right layout:
   - Change Handle positions (Left/Right instead of Top/Bottom)
   - Configure defaultEdgeOptions for horizontal arrows
   - Optional: auto-layout via dagre/elk

3. **`transformer.ts`** — cost calculations:
   - Add total cost calculation from query_block.cost_info
   - Add relative cost calculation for each node

### New Dependencies (optional)

- `@dagrejs/dagre` — automatic graph layout (if needed)
