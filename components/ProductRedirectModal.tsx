import React, { useEffect } from 'react';

interface ProductRedirectModalProps {
  isOpen: boolean;
  productName: string;
  redirectLink: string;
  onClose: () => void;
}

const ProductRedirectModal: React.FC<ProductRedirectModalProps> = ({ isOpen, productName, redirectLink, onClose }) => {
  
  useEffect(() => {
    if (isOpen && redirectLink) {
      // Tempo de simulação de processamento (1.5 segundos)
      const timer = setTimeout(() => {
        // 1. Abre o link em uma nova aba
        window.open(redirectLink, '_blank');
        
        // 2. Fecha o modal
        onClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, redirectLink, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        <div className="p-8 text-center flex flex-col items-center">
          
          {/* Loading Spinner */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-icons text-2xl text-primary">shopping_cart</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Aplicando Descontos...
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Você será redirecionado para o produto: <strong>{productName}</strong>
          </p>
          
          <p className="text-xs text-slate-400 mt-2">
            Aguarde enquanto preparamos sua oferta exclusiva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductRedirectModal;