import { useState, useCallback, useEffect } from 'react';
import type { ParserError } from '../../hooks/useExplainParser';
import { ErrorBlock } from '../ErrorBlock';

const EXAMPLE_JSON = `{
  "query_block": {
    "select_id": 1,
    "cost_info": {
      "query_cost": "1.20"
    },
    "table": {
      "table_name": "users",
      "access_type": "ALL",
      "rows_examined_per_scan": 1000,
      "rows_produced_per_join": 100,
      "filtered": "10.00",
      "cost_info": {
        "read_cost": "1.00",
        "eval_cost": "0.10"
      },
      "used_columns": ["id", "name", "email"]
    }
  }
}`;

interface InputPanelProps {
  onParse: (input: string) => void;
  error: ParserError | null;
}

export function InputPanel({ onParse, error }: InputPanelProps) {
  const [input, setInput] = useState('');
  const [width, setWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      onParse(value);
    },
    [onParse]
  );

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_JSON);
    onParse(EXAMPLE_JSON);
  }, [onParse]);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(320, Math.min(550, newWidth)));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="h-full glass-strong flex flex-col relative"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className={`
          absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize
          transition-all duration-300
          ${isResizing ? 'bg-cyan-500' : 'hover:bg-cyan-500/50 bg-white/5'}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 blur-md bg-purple-500/50" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">EXPLAIN JSON</h2>
            <p className="text-xs text-slate-400">Paste query output</p>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="relative h-full">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />
          <textarea
            className="
              w-full h-full p-4 rounded-xl
              bg-black/30 border border-white/10
              font-mono text-sm text-slate-200
              resize-none
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
              placeholder-slate-500
              transition-all duration-300
            "
            placeholder="Paste EXPLAIN FORMAT=JSON output here..."
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
          />
          {/* Shimmer effect on empty textarea */}
          {!input && (
            <div className="absolute inset-4 rounded-xl overflow-hidden pointer-events-none">
              <div className="shimmer absolute inset-0" />
            </div>
          )}
        </div>
      </div>

      {/* Error block */}
      {error && (
        <div className="px-4">
          <ErrorBlock error={error} />
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLoadExample}
          className="
            btn-glass w-full py-3 px-4 rounded-xl
            text-sm font-medium
            flex items-center justify-center gap-2
            group
          "
        >
          <svg className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="relative z-10">Load Example</span>
        </button>

        {/* Info text */}
        <p className="text-center text-xs text-slate-500 mt-3">
          Use <code className="text-cyan-400/70 bg-cyan-400/10 px-1.5 py-0.5 rounded">EXPLAIN FORMAT=JSON</code> in MySQL
        </p>
      </div>
    </div>
  );
}
