import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExplainNode as ExplainNodeData } from '../../types/explain';

function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return num.toLocaleString();
}

function ExplainNodeInner({ data }: NodeProps) {
  const nodeData = data as ExplainNodeData;
  const isCritical = nodeData.isCritical;

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
        {nodeData.operationType}
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-sm">
        {nodeData.tableName && (
          <div className="mb-1">
            <span className="text-gray-500">Table:</span>{' '}
            <span className="font-medium text-gray-900">{nodeData.tableName}</span>
          </div>
        )}

        {nodeData.key && (
          <div className="mb-1">
            <span className="text-gray-500">Key:</span>{' '}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{nodeData.key}</span>
          </div>
        )}

        {nodeData.rowsExamined !== undefined && (
          <div>
            <span className="text-gray-500">Rows:</span>{' '}
            <span className="font-medium">{formatNumber(nodeData.rowsExamined)}</span>
          </div>
        )}
      </div>

      {/* Tooltip info on hover */}
      {(nodeData.costInfo || nodeData.attachedCondition || nodeData.usedColumns) && (
        <div className="absolute left-full ml-2 top-0 z-10 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded p-2 max-w-xs shadow-lg">
            {nodeData.costInfo?.query_cost && (
              <div className="mb-1">
                <span className="text-gray-400">Cost:</span> {nodeData.costInfo.query_cost}
              </div>
            )}
            {nodeData.attachedCondition && (
              <div className="mb-1">
                <span className="text-gray-400">Condition:</span>{' '}
                <code className="text-yellow-300">{nodeData.attachedCondition}</code>
              </div>
            )}
            {nodeData.usedColumns && nodeData.usedColumns.length > 0 && (
              <div>
                <span className="text-gray-400">Columns:</span>{' '}
                {nodeData.usedColumns.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

export const ExplainNode = memo(ExplainNodeInner);
