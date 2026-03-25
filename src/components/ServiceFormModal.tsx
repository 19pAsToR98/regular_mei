"use client";

import React from 'react';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
            <span className="material-icons text-primary text-sm">smart_toy</span>
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ServiceFormModal;