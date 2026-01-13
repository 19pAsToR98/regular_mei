import React, { useEffect } from 'react';

interface ProductRedirectModalProps {
  isOpen: boolean;
  productName: string;
  redirectLink: string;
  imageUrl: string; // NOVO CAMPO
  error: string | null; // NOVO CAMPO
  onClose: () => void;
}

const ProductRedirectModal: React.FC<ProductRedirectModalProps> = ({ isOpen, productName, redirectLink, imageUrl, error, onClose }) => {
  
  useEffect(() => {
    // Se o modal estiver aberto E o link final for fornecido (após a chamada do webhook)
    if (isOpen && redirectLink && !error) {
      // Tempo de simulação de processamento (1.5 segundos)
      const timer = setTimeout(() => {
        // 1. Abre o link em uma nova aba
        window.open(redirectLink, '_blank');
        
        // 2. Fecha o modal
        onClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, redirectLink, error, onClose]);

  if (!isOpen) return null;

  // Se o link final ainda não foi recebido E não há erro, estamos processando.
  const isProcessing = !redirectLink && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        <div className="p-8 text-center flex flex-col items-center">
          
          {/* Product Image */}
          {imageUrl && (
              <div className="w-24 h-24 mb-4 bg-white rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-md">
                  <img src={imageUrl} alt={productName} className="w-full h-full object-contain" />
              </div>
          )}

          {/* Loading Spinner / Error Icon */}
          <div className="relative w-16 h-16 mb-6">
            {isProcessing && (
                <>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-icons text-2xl text-primary">shopping_cart</span>
                    </div>
                </>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100 rounded-full">
                    <span className="material-icons text-3xl text-red-600">error</span>
                </div>
            )}
            {!isProcessing && !error && (
                 <div className="absolute inset-0 flex items-center justify-center bg-green-100 rounded-full">
                    <span className="material-icons text-3xl text-green-600">check</span>
                </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {isProcessing ? 'Aplicando Descontos...' : error ? 'Falha no Redirecionamento' : 'Redirecionando...'}
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {error ? (
                <span className="text-red-500">{error}</span>
            ) : (
                <>Você será redirecionado para o produto: <strong>{productName}</strong></>
            )}
          </p>
          
          <p className="text-xs text-slate-400 mt-2">
            {isProcessing ? 'Aguarde enquanto preparamos sua oferta exclusiva.' : error ? 'Clique em fechar para continuar.' : 'Abrindo nova aba em instantes...'}
          </p>
          
          {error && (
              <button 
                onClick={onClose}
                className="mt-4 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                  Fechar
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRedirectModal;