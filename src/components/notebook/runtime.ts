import { CellOutput, PlotData, TableData } from './types';
import { transpileTypeScript } from './transpiler';
import * as THREE from 'three';

function formatLogArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
    return String(arg);
  }
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

interface PlotLineOptions {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
  name?: string;
  color?: string;
  x?: number[];
  y?: number[];
  series?: Array<{ name?: string; x?: number[]; y?: number[]; color?: string }>;
  data?: unknown;
}

interface PlotBarOptions {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  width?: number;
  height?: number;
  labels?: string[];
  values?: number[];
  data?: Array<Record<string, unknown>>;
  x?: string;
  y?: string;
}

interface PlotScatterOptions {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number; r?: number; label?: string }>;
  x?: number[];
  y?: number[];
}

interface NotebookItemWrapper {
  __notebookType?: 'plot' | 'table';
  id?: string;
  plot?: PlotData;
  table?: TableData;
}

function normalizePlotLine(options: unknown): PlotData {
  if (Array.isArray(options)) {
    if (options.length > 0 && typeof options[0] === 'object' && options[0] !== null && 'y' in options[0]) {
      const x = options.map((p: Record<string, unknown>, i: number) => (typeof p.x === 'number' ? p.x : i));
      const y = options.map((p: Record<string, unknown>) => Number(p.y || 0));
      return {
        type: 'line',
        series: [{ x, y, name: 'Series 1' }],
      };
    }
    const y = options.map(Number);
    const x = y.map((_, i) => i);
    return {
      type: 'line',
      series: [{ x, y, name: 'Series 1' }],
    };
  }

  if (typeof options === 'object' && options !== null) {
    const opt = options as PlotLineOptions;
    const { title, xLabel, yLabel, width, height } = opt;

    if (Array.isArray(opt.series)) {
      return {
        type: 'line',
        title,
        xLabel,
        yLabel,
        width,
        height,
        series: opt.series.map((s, idx: number) => {
          const y = Array.isArray(s.y) ? s.y.map(Number) : [];
          const x = Array.isArray(s.x) ? s.x.map(Number) : y.map((_, i: number) => i);
          return {
            name: s.name || `Series ${idx + 1}`,
            x,
            y,
            color: s.color,
          };
        }),
      };
    }

    if (Array.isArray(opt.y)) {
      const y = opt.y.map(Number);
      const x = Array.isArray(opt.x) ? opt.x.map(Number) : y.map((_, i: number) => i);
      return {
        type: 'line',
        title,
        xLabel,
        yLabel,
        width,
        height,
        series: [{ name: opt.name || 'Data', x, y, color: opt.color }],
      };
    }

    if (Array.isArray(opt.data)) {
      return normalizePlotLine(opt.data);
    }
  }

  return { type: 'line', series: [] };
}

function normalizePlotBar(options: unknown): PlotData {
  if (Array.isArray(options)) {
    if (options.length > 0 && typeof options[0] === 'object' && options[0] !== null) {
      const labels = options.map((item: Record<string, unknown>, i: number) =>
        String(item.label || item.name || item.x || `Item ${i + 1}`)
      );
      const values = options.map((item: Record<string, unknown>) =>
        Number(item.value || item.val || item.y || 0)
      );
      return { type: 'bar', labels, values };
    }
    const values = options.map(Number);
    const labels = values.map((_, i) => `Item ${i + 1}`);
    return { type: 'bar', labels, values };
  }

  if (typeof options === 'object' && options !== null) {
    const opt = options as PlotBarOptions;
    const { title, xLabel, yLabel, color, width, height } = opt;

    if (Array.isArray(opt.data) && (opt.x || opt.y)) {
      const xKey = opt.x || 'x';
      const yKey = opt.y || 'y';
      const labels = opt.data.map((d: Record<string, unknown>) => String(d[xKey] ?? ''));
      const values = opt.data.map((d: Record<string, unknown>) => Number(d[yKey] ?? 0));
      return { type: 'bar', title, xLabel, yLabel, color, width, height, labels, values };
    }

    if (Array.isArray(opt.values)) {
      const values = opt.values.map(Number);
      const labels = Array.isArray(opt.labels)
        ? opt.labels.map(String)
        : values.map((_, i: number) => `Item ${i + 1}`);
      return { type: 'bar', title, xLabel, yLabel, color, width, height, labels, values };
    }
  }

  return { type: 'bar', labels: [], values: [] };
}

function normalizePlotScatter(options: unknown): PlotData {
  if (Array.isArray(options)) {
    const points = options.map((p: unknown, i: number) => {
      if (typeof p === 'object' && p !== null) {
        const pt = p as Record<string, unknown>;
        return {
          x: Number(pt.x ?? i),
          y: Number(pt.y ?? 0),
          r: typeof pt.r === 'number' ? pt.r : 4,
          label: typeof pt.label === 'string' ? pt.label : typeof pt.name === 'string' ? pt.name : undefined,
        };
      }
      return { x: i, y: Number(p), r: 4 };
    });
    return { type: 'scatter', points };
  }

  if (typeof options === 'object' && options !== null) {
    const opt = options as PlotScatterOptions;
    const { title, xLabel, yLabel, color, width, height } = opt;
    if (Array.isArray(opt.points)) {
      return { type: 'scatter', title, xLabel, yLabel, color, width, height, points: opt.points };
    }
    if (Array.isArray(opt.x) && Array.isArray(opt.y)) {
      const points = opt.x.map((xVal: number, i: number) => ({
        x: Number(xVal),
        y: Number(opt.y?.[i] ?? 0),
        r: 4,
      }));
      return { type: 'scatter', title, xLabel, yLabel, color, width, height, points };
    }
  }

  return { type: 'scatter', points: [] };
}

function normalizeTable(data: unknown): TableData {
  if (Array.isArray(data)) {
    if (data.length === 0) return { columns: [], rows: [] };
    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      const records = data as Record<string, unknown>[];
      const columns = Array.from(new Set(records.flatMap(d => Object.keys(d))));
      const rows = records.map(d => columns.map(c => d[c] as string | number | boolean | null | undefined));
      return { columns, rows };
    }
    if (Array.isArray(data[0])) {
      const matrix = data as (string | number | boolean | null | undefined)[][];
      const columns = matrix[0].map((_, i) => `Col ${i + 1}`);
      return { columns, rows: matrix };
    }
    return {
      columns: ['Value'],
      rows: data.map(v => [v]),
    };
  }

  if (typeof data === 'object' && data !== null) {
    const columns = ['Key', 'Value'];
    const rows = Object.entries(data as Record<string, unknown>).map(([k, v]) => [
      k,
      typeof v === 'object' ? JSON.stringify(v) : (v as string | number | boolean | null | undefined),
    ]);
    return { columns, rows };
  }

  return { columns: ['Value'], rows: [[String(data)]] };
}

// Math helpers
function linspace(start: number, end: number, num = 50): number[] {
  if (num <= 1) return [start];
  const step = (end - start) / (num - 1);
  return Array.from({ length: num }, (_, i) => start + i * step);
}

function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else if (step < 0) {
    for (let i = start; i > end; i += step) result.push(i);
  }
  return result;
}

function sum(arr: number[]): number {
  return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function min(arr: number[] | number, ...rest: number[]): number {
  if (Array.isArray(arr)) {
    if (arr.length === 0) return 0;
    return arr.reduce((acc, v) => (v < acc ? v : acc), arr[0]);
  }
  const all = [arr, ...rest];
  return all.reduce((acc, v) => (v < acc ? v : acc), all[0]);
}

function max(arr: number[] | number, ...rest: number[]): number {
  if (Array.isArray(arr)) {
    if (arr.length === 0) return 0;
    return arr.reduce((acc, v) => (v > acc ? v : acc), arr[0]);
  }
  const all = [arr, ...rest];
  return all.reduce((acc, v) => (v > acc ? v : acc), all[0]);
}

function zeros(n: number): number[] {
  return new Array(Math.max(0, Math.floor(n))).fill(0);
}

function ones(n: number): number[] {
  return new Array(Math.max(0, Math.floor(n))).fill(1);
}

function cumsum(arr: number[]): number[] {
  let acc = 0;
  return arr.map((v) => {
    acc += Number(v) || 0;
    return acc;
  });
}

function diff(arr: number[]): number[] {
  if (arr.length <= 1) return [];
  const res: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    res.push(arr[i] - arr[i - 1]);
  }
  return res;
}

export class NotebookSession {
  private userScope: Record<string, unknown> = {};
  private scopeProxy: Record<string, unknown>;

  constructor() {
    this.scopeProxy = this.createScopeProxy();
  }

  private createScopeProxy(): Record<string, unknown> {
    const userScope = this.userScope;
    return new Proxy(userScope, {
      has(target, key) {
        if (key === Symbol.unscopables) return false;
        return true;
      },
      get(target, key) {
        if (key === Symbol.unscopables) return undefined;
        if (key in target) return target[key as string];
        if (typeof window !== 'undefined' && key in window) {
          const val = (window as unknown as Record<string, unknown>)[key as string];
          if (typeof val === 'function') return (val as (...args: unknown[]) => unknown).bind(window);
          return val;
        }
        if (typeof globalThis !== 'undefined' && key in globalThis) {
          const val = (globalThis as unknown as Record<string, unknown>)[key as string];
          if (typeof val === 'function') return (val as (...args: unknown[]) => unknown).bind(globalThis);
          return val;
        }
        return undefined;
      },
      set(target, key, value) {
        target[key as string] = value;
        return true;
      },
    });
  }

  public reset(): void {
    this.userScope = {};
    this.scopeProxy = this.createScopeProxy();
  }

  public async execute(
    code: string,
    onOutput: (output: CellOutput) => void
  ): Promise<{ result: unknown; error: Error | null }> {
    const { code: preparedCode, error: transpileError } = transpileTypeScript(code);

    if (transpileError) {
      const errOutput: CellOutput = {
        id: `err-${Date.now()}-${Math.random()}`,
        type: 'error',
        error: {
          name: 'SyntaxError',
          message: transpileError.message,
          stack: transpileError.stack,
        },
      };
      onOutput(errOutput);
      return { result: undefined, error: transpileError };
    }

    if (!preparedCode) {
      return { result: undefined, error: null };
    }

    // Prepare cell execution context with deduplicated, sequential outputs support
    const emittedOutputIds = new Set<string>();
    const emitOutput = (output: CellOutput) => {
      if (emittedOutputIds.has(output.id)) return;
      emittedOutputIds.add(output.id);
      onOutput(output);
    };

    const customConsole = {
      log: (...args: unknown[]) => {
        emitOutput({
          id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'stdout',
          text: args.map(formatLogArg).join(' '),
        });
      },
      info: (...args: unknown[]) => {
        emitOutput({
          id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'stdout',
          text: args.map(formatLogArg).join(' '),
        });
      },
      warn: (...args: unknown[]) => {
        emitOutput({
          id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'stderr',
          text: args.map(formatLogArg).join(' '),
        });
      },
      error: (...args: unknown[]) => {
        emitOutput({
          id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'stderr',
          text: args.map(formatLogArg).join(' '),
        });
      },
      table: (data: unknown) => {
        emitOutput({
          id: `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'table',
          table: normalizeTable(data),
        });
      },
    };

    const createPlotWrapper = (type: 'line' | 'bar' | 'scatter' | 'area', options: unknown) => {
      let plotData: PlotData;
      if (type === 'bar') {
        plotData = normalizePlotBar(options);
      } else if (type === 'scatter') {
        plotData = normalizePlotScatter(options);
      } else {
        plotData = normalizePlotLine(options);
        if (type === 'area') plotData.type = 'area';
      }

      const outId = `plot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const outputItem: CellOutput = {
        id: outId,
        type: 'plot',
        plot: plotData,
      };

      // Auto-emit plot immediately so multiple plots appear in order of execution
      emitOutput(outputItem);

      const wrapper = {
        __notebookType: 'plot' as const,
        id: outId,
        plot: plotData,
        outputItem,
        show: function () {
          emitOutput(outputItem);
          return wrapper;
        },
      };
      return wrapper;
    };

    const plot = {
      line: (options: unknown) => createPlotWrapper('line', options),
      bar: (options: unknown) => createPlotWrapper('bar', options),
      scatter: (options: unknown) => createPlotWrapper('scatter', options),
      area: (options: unknown) => createPlotWrapper('area', options),
    };

    const table = (data: unknown) => {
      const tableData = normalizeTable(data);
      const outId = `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const outputItem: CellOutput = {
        id: outId,
        type: 'table',
        table: tableData,
      };

      emitOutput(outputItem);

      const wrapper = {
        __notebookType: 'table' as const,
        id: outId,
        table: tableData,
        outputItem,
        show: function () {
          emitOutput(outputItem);
          return wrapper;
        },
      };
      return wrapper;
    };

    const animate = (options: {
      title?: string;
      frames?: string[];
      fps?: number;
      width?: number;
      height?: number;
      loop?: boolean;
      autoPlay?: boolean;
    }) => {
      const outId = `anim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const outputItem: CellOutput = {
        id: outId,
        type: 'animation',
        animation: {
          title: options.title,
          frames: options.frames || [],
          fps: options.fps || 30,
          width: options.width || 600,
          height: options.height || 300,
          loop: options.loop !== false,
          autoPlay: options.autoPlay ?? true,
        },
      };
      emitOutput(outputItem);
      return outputItem;
    };

    const display = (...args: unknown[]) => {
      for (const val of args) {
        if (Array.isArray(val) && val.some((it) => it && typeof it === 'object' && ('__notebookType' in it || 'plot' in it || 'table' in it))) {
          display(...val);
          continue;
        }
        if (typeof val === 'object' && val !== null && '__notebookType' in val) {
          const item = val as NotebookItemWrapper;
          if (item.__notebookType === 'plot' && item.plot) {
            emitOutput({
              id: item.id || `plot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'plot',
              plot: item.plot,
            });
            continue;
          }
          if (item.__notebookType === 'table' && item.table) {
            emitOutput({
              id: item.id || `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'table',
              table: item.table,
            });
            continue;
          }
        }
        emitOutput({
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'result',
          value: val,
        });
      }
    };

    display.html = (html: string) => {
      emitOutput({
        id: `html-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'html',
        html,
      });
    };

    display.svg = (svg: string) => {
      emitOutput({
        id: `svg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'svg',
        svg,
      });
    };

    display.animation = animate;
    display.plot = (options: unknown) => createPlotWrapper('line', options);
    display.table = table;
    display.image = (url: string, alt = '') => {
      display.html(`<img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-lg" />`);
    };

    // Inject built-ins into userScope
    Object.assign(this.userScope, {
      console: customConsole,
      display,
      plot,
      table,
      animate,
      linspace,
      range,
      sum,
      mean,
      std,
      median,
      min,
      max,
      zeros,
      ones,
      cumsum,
      diff,
      abs: Math.abs,
      sqrt: Math.sqrt,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      exp: Math.exp,
      log: Math.log,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      pi: Math.PI,
      PI: Math.PI,
      e: Math.E,
      E: Math.E,
      THREE,
      Math,
      Date,
      JSON,
      RegExp,
      Array,
      Object,
      Number,
      String,
      Boolean,
      Promise,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      fetch: typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined,
    });

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('scope', preparedCode);
      const result = await fn(this.scopeProxy);

      // If the result returned is a plot or table wrapper, check if already emitted
      if (result !== undefined) {
        if (typeof result === 'object' && result !== null && '__notebookType' in result) {
          const item = result as NotebookItemWrapper;
          if (item.id && emittedOutputIds.has(item.id)) {
            // Already emitted during execution, avoid duplicate!
            return { result, error: null };
          }
          if (item.__notebookType === 'plot' && item.plot) {
            emitOutput({
              id: item.id || `plot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'plot',
              plot: item.plot,
            });
            return { result, error: null };
          }
          if (item.__notebookType === 'table' && item.table) {
            emitOutput({
              id: item.id || `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'table',
              table: item.table,
            });
            return { result, error: null };
          }
        }

        // If result is an array of notebook objects
        if (
          Array.isArray(result) &&
          result.some((it) => it && typeof it === 'object' && ('__notebookType' in it || 'plot' in it || 'table' in it))
        ) {
          for (const item of result) {
            if (item && typeof item === 'object') {
              if (item.__notebookType === 'plot' && item.plot) {
                if (!item.id || !emittedOutputIds.has(item.id)) {
                  emitOutput({
                    id: item.id || `plot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    type: 'plot',
                    plot: item.plot,
                  });
                }
              } else if (item.__notebookType === 'table' && item.table) {
                if (!item.id || !emittedOutputIds.has(item.id)) {
                  emitOutput({
                    id: item.id || `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    type: 'table',
                    table: item.table,
                  });
                }
              }
            }
          }
          return { result, error: null };
        }

        // Standard return value
        emitOutput({
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'result',
          value: result,
        });
      }

      return { result, error: null };
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      onOutput({
        id: `err-${Date.now()}-${Math.random()}`,
        type: 'error',
        error: {
          name: errorObj.name || 'RuntimeError',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      });
      return { result: undefined, error: errorObj };
    }
  }
}
