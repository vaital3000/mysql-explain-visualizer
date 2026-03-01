import { useExplainParser } from './hooks/useExplainParser';
import { FlowChart } from './components/FlowChart';
import { InputPanel } from './components/InputPanel';
import { ThemeToggle } from './components/ThemeToggle';

function App() {
  const { nodes, edges, error, parse } = useExplainParser(500);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Animated Background */}
      <div className="animated-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main visualization area */}
      <div className="flex-1 relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {nodes.length > 0 ? (
          <FlowChart nodes={nodes} edges={edges} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center fade-in-up">
              {/* Animated Icon */}
              <div className="relative mb-8">
                <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-30 animate-pulse" />
                <div className="relative glass-strong rounded-3xl p-8 inline-block">
                  <svg
                    className="w-20 h-20 text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                    />
                  </svg>
                </div>
              </div>

              {/* Title with gradient */}
              <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                MySQL EXPLAIN Visualizer
              </h1>

              {/* Subtitle */}
              <p className="text-theme-text-secondary text-lg mb-2">
                Paste your EXPLAIN JSON to visualize query execution plans
              </p>
              <p className="text-theme-text-muted text-sm">
                Understand how MySQL executes your queries
              </p>

              {/* Decorative dots */}
              <div className="flex items-center justify-center gap-2 mt-8">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
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
