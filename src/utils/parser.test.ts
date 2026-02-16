import { describe, it, expect } from 'vitest';
import { parseExplainJson, ParseError } from './parser';

describe('parseExplainJson', () => {
  it('should parse valid EXPLAIN JSON', () => {
    const input = JSON.stringify({
      query_block: {
        select_id: 1,
        table: {
          table_name: 'users',
          access_type: 'ALL',
          rows_examined_per_scan: 1000,
        },
      },
    });

    const result = parseExplainJson(input);

    expect(result.type).toBe('operation');
    expect(result.operationType).toBe('query_block');
    expect(result.children).toHaveLength(1);
    expect(result.children[0].type).toBe('table');
    expect(result.children[0].tableName).toBe('users');
    expect(result.children[0].accessType).toBe('ALL');
  });

  it('should reject invalid JSON', () => {
    const input = '{ invalid json }';

    expect(() => parseExplainJson(input)).toThrow(ParseError);
  });

  it('should reject JSON without query_block', () => {
    const input = JSON.stringify({ foo: 'bar' });

    expect(() => parseExplainJson(input)).toThrow(ParseError);
  });

  it('should detect FULL TABLE SCAN as critical', () => {
    const input = JSON.stringify({
      query_block: {
        table: {
          table_name: 'users',
          access_type: 'ALL',
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(true);
  });

  it('should detect filesort as critical', () => {
    const input = JSON.stringify({
      query_block: {
        ordering_operation: {
          using_filesort: true,
          table: { table_name: 'users' },
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(true);
  });

  it('should not mark index scan as critical', () => {
    const input = JSON.stringify({
      query_block: {
        table: {
          table_name: 'users',
          access_type: 'ref',
          key: 'PRIMARY',
        },
      },
    });

    const result = parseExplainJson(input);
    expect(result.isCritical).toBe(false);
  });
});
