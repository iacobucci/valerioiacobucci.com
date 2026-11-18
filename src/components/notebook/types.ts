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

export interface AnimationData {
  type?: 'svg' | 'canvas' | 'frame';
  title?: string;
  frames?: string[];
  fps?: number;
  width?: number;
  height?: number;
  loop?: boolean;
  autoPlay?: boolean;
  initialDataUrl?: string;
}

export interface CellOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'result' | 'plot' | 'table' | 'html' | 'svg' | 'animation' | 'error';
  text?: string;
  value?: unknown;
  plot?: PlotData;
  table?: TableData;
  html?: string;
  svg?: string;
  animation?: AnimationData;
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

export interface NotebookCellFileData {
  id?: string;
  type: CellType;
  source: string;
  executionCount?: number | null;
  status?: CellStatus;
  outputs?: CellOutput[];
}

export interface NotebookFileData {
  title?: string;
  cells: NotebookCellFileData[];
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
