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
          style: { strokeWidth: 2 },
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
