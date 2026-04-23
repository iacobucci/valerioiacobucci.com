export type ToastType = 'success' | 'error' | 'info';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
  showLogin?: boolean;
}

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'success' } }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
  },
  info: (message: string, showLogin?: boolean) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'info', showLogin } }));
  }
};
