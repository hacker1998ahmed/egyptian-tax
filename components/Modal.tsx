import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl dark:shadow-cyan-500/20 w-full max-w-2xl border-2 border-gray-300 dark:border-cyan-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-cyan-500/30">
          <h2 id="modal-title" className="text-2xl font-bold text-cyan-700 dark:text-cyan-400" style={{textShadow: 'var(--modal-header-shadow)'}}>
             <style>{`.dark h2 { --modal-header-shadow: 0 0 3px #22d3ee; }`}</style>
             {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-3xl transition-colors"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;