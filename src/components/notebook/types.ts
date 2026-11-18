export type CellType = 'code' | 'markdown';
export type CellStatus = 'idle' | 'running' | 'success' | 'error';

export interface PlotSeries {
  name?: string;
  x?: number[];
  y: number[];
  color?: string;
}

export interface PlotData {
  type: 'line' | 'bar' | 'scatter' | 'area';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  series?: PlotSeries[];
  labels?: string[];
  values?: number[];
  points?: Array<{ x: number; y: number; r?: number; label?: string }>;
  color?: string;
  width?: number;
  height?: number;
}

export interface TableData {
  columns: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export interface CellOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'result' | 'plot' | 'table' | 'html' | 'svg' | 'error';
  text?: string;
  value?: unknown;
  plot?: PlotData;
  table?: TableData;
  html?: string;
  svg?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface NotebookCellData {
  id: string;
  type: CellType;
  source: string;
  executionCount?: number | null;
  status: CellStatus;
  outputs: CellOutput[];
  isEditing?: boolean;
}

export interface NotebookFileData {
  title?: string;
  cells: Array<{
    type: CellType;
    source: string;
  }>;
}

export interface NotebookProps {
  src?: string;
  title?: string;
  initialData?: NotebookFileData;
  resolvedPath?: string;
  slug?: string;
  isAuthor?: boolean;
  editable?: boolean;
  autoRun?: boolean;
  cells?: Array<{ type: CellType; source?: string; content?: string }>;
  initialCells?: Array<{ type: CellType; source?: string; content?: string }>;
  children?: React.ReactNode;
  className?: string;
  onSave?: (data: NotebookFileData) => Promise<{ success: boolean; path?: string; error?: string }>;
}
