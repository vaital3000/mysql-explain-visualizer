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
