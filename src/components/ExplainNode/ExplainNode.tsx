import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExplainNode as ExplainNodeData, TableInfo } from '../../types/explain';

type AccessType = 'ALL' | 'range' | 'index' | 'ref' | 'eq_ref' | 'const' | 'system' | 'fulltext' | string;

interface AccessColors {
  gradient: string;
  border: string;
  glow: string;
  text: string;
  bg: string;
  icon: string;
}

function getAccessColor(accessType: AccessType | undefined): AccessColors {
  switch (accessType) {
    case 'ALL':
    case 'fulltext':
      return {
        gradient: 'from-red-500 to-rose-600',
        border: 'border-red-500/50',
        glow: 'glow-red',
        text: 'text-red-300',
        bg: 'bg-red-500/10',
        icon: '⚠️',
      };
    case 'range':
      return {
        gradient: 'from-amber-500 to-orange-600',
        border: 'border-amber-500/50',
        glow: 'glow-amber',
        text: 'text-amber-300',
        bg: 'bg-amber-500/10',
        icon: '📏',
      };
    case 'index':
    case 'ref':
    case 'eq_ref':
      return {
        gradient: 'from-yellow-500 to-amber-500',
        border: 'border-yellow-500/50',
        glow: 'glow-amber',
        text: 'text-yellow-300',
        bg: 'bg-yellow-500/10',
        icon: '🔗',
      };
    case 'const':
    case 'system':
      return {
        gradient: 'from-emerald-500 to-green-600',
        border: 'border-emerald-500/50',
        glow: 'glow-emerald',
        text: 'text-emerald-300',
        bg: 'bg-emerald-500/10',
        icon: '⚡',
      };
    default:
      return {
        gradient: 'from-slate-500 to-slate-600',
        border: 'border-slate-500/50',
        glow: '',
        text: 'text-slate-300',
        bg: 'bg-slate-500/10',
        icon: '📊',
      };
  }
}

function getIntensityClass(costPercent: number | undefined): string {
  if (costPercent === undefined) return '';
  if (costPercent > 50) return 'animate-pulse';
  if (costPercent > 10) return '';
  return 'opacity-75';
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return num.toLocaleString();
}

function ExplainNodeInner({ data }: NodeProps) {
  const nodeData = data as ExplainNodeData;
  const colors = getAccessColor(nodeData.accessType);
  const intensityClass = getIntensityClass(nodeData.costPercent);
  const table = 'table_name' in nodeData.raw ? nodeData.raw as TableInfo : null;

  const hasDetails = table && (
    table.possible_keys?.length ||
    table.key_length ||
    table.ref?.length ||
    table.filtered ||
    nodeData.attachedCondition ||
    nodeData.usedColumns?.length
  );

  const isCritical = nodeData.costPercent !== undefined && nodeData.costPercent > 50;

  return (
    <div className={`group relative ${intensityClass}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gradient-to-r !from-cyan-400 !to-purple-400 !border-2 !border-white/30 hover:!scale-125 !transition-transform"
      />

      {/* Main Node Container */}
      <div
        className={`
          relative overflow-hidden
          min-w-[220px] rounded-2xl
          glass ${colors.border} border
          ${isCritical ? colors.glow : ''}
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-2xl
        `}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 pointer-events-none`} />

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
        </div>

        {/* Header with table name */}
        <div className={`
          relative px-4 py-3
          bg-gradient-to-r ${colors.gradient}
          rounded-t-2xl
        `}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{colors.icon}</span>
            <span className="font-semibold text-white text-sm truncate tracking-wide">
              {nodeData.tableName || nodeData.operationType}
            </span>
          </div>

          {/* Cost badge */}
          {nodeData.costPercent !== undefined && nodeData.costPercent > 30 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${isCritical ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'}
              `}>
                {formatPercent(nodeData.costPercent)}
              </div>
            </div>
          )}
        </div>

        {/* Body with stats */}
        <div className="px-4 py-3 space-y-2">
          {/* Cost */}
          {nodeData.costPercent !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-theme-text-secondary text-xs uppercase tracking-wider">Cost</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-theme-text">
                  {formatPercent(nodeData.costPercent)}
                </span>
                {nodeData.relativeCostPercent !== undefined && nodeData.relativeCostPercent !== nodeData.costPercent && (
                  <span className="text-theme-text-muted text-xs">
                    ({formatPercent(nodeData.relativeCostPercent)})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Access Type */}
          {nodeData.accessType && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Type</span>
              <span className={`
                font-mono text-xs px-2 py-1 rounded-lg
                ${colors.bg} ${colors.text}
                border ${colors.border}
              `}>
                {nodeData.accessType}
              </span>
            </div>
          )}

          {/* Key */}
          {nodeData.key && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Key</span>
              <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg truncate max-w-[100px]">
                {nodeData.key}
              </span>
            </div>
          )}

          {/* Rows */}
          {nodeData.rowsExamined !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Rows</span>
              <span className="font-mono text-sm font-medium text-purple-300">
                {formatNumber(nodeData.rowsExamined)}
              </span>
            </div>
          )}
        </div>

        {/* Bottom shimmer effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Hover tooltip with details */}
      {hasDetails && table && (
        <div className="absolute left-full ml-4 top-0 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-x-1">
          <div className="glass-strong rounded-2xl p-4 min-w-[280px]">
            {/* Tooltip header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-theme-text-secondary/10">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-theme-text">Details</span>
            </div>

            <div className="space-y-2 text-sm">
              {table.possible_keys && table.possible_keys.length > 0 && (
                <div>
                  <span className="text-theme-text-secondary">Possible keys:</span>{' '}
                  <span className="text-cyan-300 font-mono text-xs">{table.possible_keys.join(', ')}</span>
                </div>
              )}

              {table.key_length && (
                <div>
                  <span className="text-theme-text-secondary">Key length:</span>{' '}
                  <span className="text-theme-text font-mono">{table.key_length}</span>
                </div>
              )}

              {table.ref && table.ref.length > 0 && (
                <div>
                  <span className="text-theme-text-secondary">Ref:</span>{' '}
                  <span className="text-purple-300 font-mono text-xs">{table.ref.join(', ')}</span>
                </div>
              )}

              {table.filtered && (
                <div>
                  <span className="text-theme-text-secondary">Filtered:</span>{' '}
                  <span className="text-emerald-300 font-mono">{table.filtered}%</span>
                </div>
              )}

              {nodeData.attachedCondition && (
                <>
                  <div className="border-t border-theme-text-secondary/10 my-2" />
                  <div>
                    <span className="text-theme-text-secondary block mb-1">Condition:</span>
                    <div className="text-amber-300 font-mono text-xs break-all bg-amber-500/10 p-2 rounded-lg">
                      {nodeData.attachedCondition}
                    </div>
                  </div>
                </>
              )}

              {nodeData.usedColumns && nodeData.usedColumns.length > 0 && (
                <>
                  <div className="border-t border-theme-text-secondary/10 my-2" />
                  <div>
                    <span className="text-theme-text-secondary block mb-1">Used columns:</span>
                    <div className="text-emerald-300 font-mono text-xs break-all bg-emerald-500/10 p-2 rounded-lg">
                      {nodeData.usedColumns.join(', ')}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gradient-to-r !from-cyan-400 !to-purple-400 !border-2 !border-white/30 hover:!scale-125 !transition-transform"
      />
    </div>
  );
}

export const ExplainNode = memo(ExplainNodeInner);
