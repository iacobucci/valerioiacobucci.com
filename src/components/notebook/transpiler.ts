import { transform } from 'sucrase';

export interface TranspileResult {
  code: string;
  error: Error | null;
}

export function splitStatements(code: string): string[] {
  const statements: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = code[i - 1];

    if (inString) {
      current += ch;
      if (ch === stringChar && prev !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (depth === 0 && (ch === ';' || ch === '\n')) {
      if (current.trim()) {
        statements.push(current.trim());
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

export function transpileTypeScript(tsCode: string): TranspileResult {
  const cleanCode = tsCode.trim();
  if (!cleanCode) {
    return { code: '', error: null };
  }

  try {
    const transpiled = transform(cleanCode, {
      transforms: ['typescript', 'jsx'],
      disableESTransforms: true,
      production: true,
    }).code;

    const stmts = splitStatements(transpiled);
    if (stmts.length === 0) {
      return { code: '', error: null };
    }

    const modifiedStmts = stmts.map((stmt, idx) => {
      let s = stmt;

      // Handle destructuring declarations: const { a, b } = ... or let [x, y] = ...
      if (/^(?:const|let|var)\s+\{/.test(s)) {
        s = '(' + s.replace(/^(?:const|let|var)\s+/, '') + ')';
      } else if (/^(?:const|let|var)\s+\[/.test(s)) {
        s = '(' + s.replace(/^(?:const|let|var)\s+/, '') + ')';
      } else {
        // Scalar variable declarations: const x = 42; -> x = 42;
        s = s.replace(/^(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, '$1 = ');
        // Function declarations: function foo( -> foo = function foo(
        s = s.replace(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '$1 = function $1(');
        // Class declarations: class Bar -> Bar = class Bar
        s = s.replace(/^class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$1 = class $1');
      }

      // Check if last statement should be returned
      if (idx === stmts.length - 1) {
        const isStatementKeyword = /^(return|break|continue|throw|if|for|while|switch|try|catch|finally)\b/.test(s);
        const isAssignment = /^[a-zA-Z0-9_$.]+\s*=/.test(s);
        const isImportOrExport = /^(import|export)\b/.test(s);
        const isVoidCall = /^(console\.|display\.)/.test(s);

        if (!isStatementKeyword && !isAssignment && !isImportOrExport && !isVoidCall) {
          // If it starts with a curly brace, wrap in parentheses so it's not treated as a block
          s = 'return (' + s + ');';
        }
      }

      return s;
    });

    const sanitizedStmts = modifiedStmts.map((s) => s.replace(/;+$/, ''));
    const finalCode = `with (scope) {\n  ${sanitizedStmts.join(';\n  ')};\n}`;
    return { code: finalCode, error: null };
  } catch (err: unknown) {
    return {
      code: '',
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
