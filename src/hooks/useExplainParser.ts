import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { parseExplainJson, ParseError } from '../utils/parser';
import { transformToFlow } from '../utils/transformer';
import type { ExplainNode } from '../types/explain';

export type ErrorCode = 'PARSE_ERROR' | 'INVALID_FORMAT' | 'EMPTY_INPUT';

export interface ParserError {
  code: ErrorCode;
  message: string;
}

export interface UseExplainParserResult {
  nodes: Node[];
  edges: Edge[];
  error: ParserError | null;
  parse: (input: string) => void;
  rawTree: ExplainNode | null;
}

export function useExplainParser(debounceMs: number = 500): UseExplainParserResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<ParserError | null>(null);
  const [rawTree, setRawTree] = useState<ExplainNode | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parse = useCallback((input: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const tree = parseExplainJson(input);
        const { nodes: flowNodes, edges: flowEdges } = transformToFlow(tree);

        setRawTree(tree);
        setNodes(flowNodes);
        setEdges(flowEdges);
        setError(null);
      } catch (e) {
        if (e instanceof ParseError) {
          setError({
            code: e.code,
            message: e.message,
          });
        } else {
          setError({
            code: 'PARSE_ERROR',
            message: (e as Error).message,
          });
        }
        setNodes([]);
        setEdges([]);
        setRawTree(null);
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { nodes, edges, error, parse, rawTree };
}
