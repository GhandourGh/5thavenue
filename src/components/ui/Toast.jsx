import React from 'react';

const Toast = ({
  open,
  type = 'success',
  message = '',
  onClose,
  accent = '#a10009',
}) => {
  if (!open) return null;
  const bg =
    type === 'error' ? '#8a0008' : type === 'warning' ? '#c27d00' : accent;
  const iconPath =
    type === 'error'
      ? 'M12 9v4m0 4h.01M12 4.5A7.5 7.5 0 1 1 4.5 12 7.5 7.5 0 0 1 12 4.5z'
      : 'M9 12.75 11.25 15 15 9.75M12 4.5A7.5 7.5 0 1 1 4.5 12 7.5 7.5 0 0 1 12 4.5z';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
      <div
        className={`text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[toastIn_200ms_ease-out]`}
        style={{ backgroundColor: bg }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
};

export default Toast;
