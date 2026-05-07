export interface Project {
  title: string;
  github_repo: string;
  website_url?: string;
  tech: string[];
  selected?: boolean;
}

export interface HistoryItem {
  type: 'move' | 'rename' | 'create_folder' | 'create_post';
  params: any;
  inverseParams: any;
}

export interface FrontmatterData {
  title: string;
  description: string;
  date: string;
  updated?: string;
  draft: boolean;
  preview: boolean;
  preview_passcode?: string;
  selected: boolean;
  tags: string[];
  [key: string]: any;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'purple';
  onConfirm: () => void;
  onCancel: () => void;
}

export interface InputDialogProps {
  isOpen: boolean;
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}
