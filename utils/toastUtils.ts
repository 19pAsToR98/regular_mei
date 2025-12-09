import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message, {
    style: {
      background: '#10B981',
      color: '#fff',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    style: {
      background: '#EF4444',
      color: '#fff',
    },
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};