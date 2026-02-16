import type { ParserError } from '../../hooks/useExplainParser';

interface ErrorBlockProps {
  error: ParserError;
}

export function ErrorBlock({ error }: ErrorBlockProps) {
  const errorTitles: Record<string, string> = {
    PARSE_ERROR: 'JSON Parse Error',
    INVALID_FORMAT: 'Invalid Format',
    EMPTY_INPUT: 'Empty Input',
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
      <div className="flex items-start gap-2">
        <span className="text-red-500 text-lg">⚠️</span>
        <div>
          <h4 className="font-medium text-red-800 text-sm">
            {errorTitles[error.code] || 'Error'}
          </h4>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    </div>
  );
}
