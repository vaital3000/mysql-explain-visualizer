import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExplainNode as ExplainNodeData, TableInfo } from '../../types/explain';

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

function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return num.toLocaleString();
}

interface ExplainNodeDataExtended extends ExplainNodeData {
  costPercent?: number;
  relativeCostPercent?: number;
}

function ExplainNodeInner({ data }: NodeProps) {
  const nodeData = data as ExplainNodeDataExtended;
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

export const ExplainNode = memo(ExplainNodeInner);
