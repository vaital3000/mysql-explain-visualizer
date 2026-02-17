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

function parseTableInfo(table: TableInfo): ExplainNode {
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
    children.push(parseTableInfo(op.table));
  }

  if (op.nested_loop) {
    // nested_loop inside ORDER BY becomes children (sub-plan)
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
    children.push(parseTableInfo(op.table));
  }

  if (op.nested_loop) {
    // nested_loop inside GROUP BY becomes children (sub-plan)
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
    children.push(parseTableInfo(nl.table));
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

/**
 * Parse nested_loop array as a sequential chain.
 * Returns nodes (first table as root of chain, others nested) and chain edges.
 *
 * In MySQL EXPLAIN, nested_loop represents sequential joins:
 * table1 → table2 → table3 (not parallel)
 *
 * We create a nested structure: table1.children = [table2], table2.children = [table3]
 * This way flattenTree creates sequential edges.
 */
export interface ParsedChain {
  firstNode: ExplainNode | null;
  allNodes: ExplainNode[];
  chainEdges: { source: string; target: string }[];
}

function parseNestedLoopChain(nlArray: NestedLoop[]): ParsedChain {
  if (nlArray.length === 0) return { firstNode: null, allNodes: [], chainEdges: [] };

  const allNodes: ExplainNode[] = [];
  let firstNode: ExplainNode | null = null;
  let previousNode: ExplainNode | null = null;

  for (const nl of nlArray) {
    let currentNode: ExplainNode;

    // For simple nested_loop with just a table, extract the table directly
    if (nl.table && !nl.ordering_operation && !nl.grouping_operation && !nl.nested_loop) {
      currentNode = parseTableInfo(nl.table);
    } else {
      // For complex nested_loop (with operations), create the wrapper node
      currentNode = parseNestedLoop(nl);
    }

    allNodes.push(currentNode);

    if (firstNode === null) {
      firstNode = currentNode;
    }

    // Chain: add current node as child of previous node
    if (previousNode !== null) {
      previousNode.children.push(currentNode);
    }

    previousNode = currentNode;
  }

  return { firstNode, allNodes, chainEdges: [] };
}

function parseQueryBlock(qb: QueryBlock): { root: ExplainNode; chainEdges: { source: string; target: string }[] } {
  nodeIdCounter = 0;
  const id = generateNodeId();
  const children: ExplainNode[] = [];
  let chainEdges: { source: string; target: string }[] = [];

  if (qb.table) {
    children.push(parseTableInfo(qb.table));
  }

  if (qb.ordering_operation) {
    children.push(parseOrderBy(qb.ordering_operation));
  }

  if (qb.grouping_operation) {
    children.push(parseGroupBy(qb.grouping_operation));
  }

  // Parse nested_loop as a sequential chain
  // Only add the first node to children; the rest are chained via children array
  if (qb.nested_loop) {
    const { firstNode, chainEdges: edges } = parseNestedLoopChain(qb.nested_loop);
    if (firstNode) {
      children.push(firstNode);
    }
    chainEdges = edges;
  }

  const root: ExplainNode = {
    id,
    type: 'operation',
    operationType: 'query_block',
    isCritical: children.some(c => c.isCritical),
    costInfo: qb.cost_info,
    children,
    raw: {} as TableInfo,
  };

  return { root, chainEdges };
}

export interface ParsedExplain {
  root: ExplainNode;
  chainEdges: { source: string; target: string }[];
}

export function parseExplainJson(input: string): ParsedExplain {
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
