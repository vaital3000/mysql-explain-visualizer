import type { ParserError } from '../../hooks/useExplainParser';

interface ErrorBlockProps {
  error: ParserError;
}

export function ErrorBlock({ error }: ErrorBlockProps) {
  const errorConfig: Record<string, { icon: string; title: string; gradient: string }> = {
    PARSE_ERROR: {
      icon: '⚠️',
      title: 'JSON Parse Error',
      gradient: 'from-red-500 to-rose-600',
    },
    INVALID_FORMAT: {
      icon: '❌',
      title: 'Invalid Format',
      gradient: 'from-orange-500 to-red-600',
    },
    EMPTY_INPUT: {
      icon: '📝',
      title: 'Empty Input',
      gradient: 'from-amber-500 to-orange-600',
    },
  };

  const config = errorConfig[error.code] || {
    icon: '⚠️',
    title: 'Error',
    gradient: 'from-red-500 to-rose-600',
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/30 animate-shake">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-10 pointer-events-none`} />

      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="shimmer absolute inset-0" />
      </div>

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon container */}
          <div className={`
            w-10 h-10 rounded-xl
            bg-gradient-to-br ${config.gradient}
            flex items-center justify-center
            shadow-lg
          `}>
            <span className="text-lg">{config.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-300 text-sm mb-1">
              {config.title}
            </h4>
            <p className="text-red-200/80 text-sm leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${config.gradient} to-transparent opacity-50`} />
    </div>
  );
}
