import { useState, useCallback } from 'react';
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
  const [width, setWidth] = useState(350);
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
      setWidth(Math.max(280, Math.min(500, newWidth)));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach resize listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  return (
    <div
      className="h-full bg-gray-50 border-l border-gray-200 flex flex-col relative"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-800">EXPLAIN JSON</h2>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-3 overflow-hidden">
        <textarea
          className="w-full h-full p-3 border border-gray-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Paste EXPLAIN FORMAT=JSON output here..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Error block */}
      {error && (
        <div className="px-3">
          <ErrorBlock error={error} />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <button
          onClick={handleLoadExample}
          className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          Load Example
        </button>
      </div>
    </div>
  );
}
