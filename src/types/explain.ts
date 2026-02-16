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
  // Cost percentages for MySQL Workbench style
  costPercent?: number;
  relativeCostPercent?: number;
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}
