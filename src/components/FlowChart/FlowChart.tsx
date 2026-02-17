import { ReactFlow, Controls, Background, MiniMap, type Node, type Edge, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ExplainNode } from '../ExplainNode';

interface FlowChartProps {
  nodes: Node[];
  edges: Edge[];
}

const nodeTypes = {
  explainNode: ExplainNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    strokeWidth: 2,
    stroke: 'url(#edge-gradient)',
  },
  animated: true,
};

export function FlowChart({ nodes, edges }: FlowChartProps) {
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
      >
        {/* Custom gradient definition for edges */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="edge-gradient-animated" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4">
                <animate attributeName="stop-color" values="#06b6d4;#a855f7;#ec4899;#06b6d4" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#a855f7">
                <animate attributeName="stop-color" values="#a855f7;#ec4899;#06b6d4;#a855f7" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Custom dot pattern background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />

        {/* Controls */}
        <Controls
          showInteractive={false}
          style={{
            bottom: 20,
            right: 20,
          }}
        />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { costPercent?: number } | undefined;
            if (data?.costPercent && data.costPercent > 50) return '#ef4444';
            if (data?.costPercent && data.costPercent > 30) return '#f59e0b';
            if (data?.costPercent && data.costPercent > 10) return '#eab308';
            return '#64748b';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            bottom: 20,
            left: 20,
          }}
        />
      </ReactFlow>
    </div>
  );
}
