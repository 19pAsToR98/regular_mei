import React, { useState, useEffect, useMemo } from 'react';
import { CnaeProduct, User } from '../types';
import { supabase } from '../src/integrations/supabase/client';
import { showError, showLoading, dismissToast } from '../utils/toastUtils'; // Importando toasts
import ProductRedirectModal from './ProductRedirectModal';

interface ProductsByCnaePageProps {
  user: User;
  productRedirectWebhookUrl: string; // NOVO PROP
}

const ProductsByCnaePage: React.FC<ProductsByCnaePageProps> = ({ user, productRedirectWebhookUrl }) => {
  const [products, setProducts] = useState<CnaeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o modal de redirecionamento
  const [redirectModal, setRedirectModal] = useState<{
      isOpen: boolean;
      name: string;
      link: string;
      imageUrl: string;
  }>({ isOpen: false, name: '', link: '', imageUrl: '' });

  // Extrai o CNAE principal do usuário
  const userCnae = useMemo(() => {
    // CNAE está aninhado em cnpjData.estabelecimento.atividade_principal.id
    const fullCnae = user.cnpjData?.estabelecimento?.atividade_principal?.id;
    // Retorna o CNAE completo (ex: 4751201) ou null
    return fullCnae || null;
  }, [user.cnpjData]);
  
  const cnaeDescription = useMemo(() => {
    return user.cnpjData?.estabelecimento?.atividade_principal?.descricao || 'seu negócio';
  }, [user.cnpjData]);
  
  // Removendo o useMemo para productRedirectWebhookUrl, pois agora vem via props.

  useEffect(() => {
    if (!userCnae) {
      setError("Seu CNAE não está cadastrado. Por favor, complete seu perfil.");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Consulta a tabela cnae_products filtrando pelo CNAE do usuário
        const { data, error } = await supabase
          .from('cnae_products')
          .select('*')
          .eq('cnae_code', userCnae)
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        const mappedProducts: CnaeProduct[] = data.map(p => ({
          id: p.id,
          cnaeCode: p.cnae_code,
          productName: p.product_name,
          description: p.description,
          link: p.link,
          imageUrl: p.image_url,
          // Conversão robusta: garante que o valor seja um número, mesmo que venha como string
          currentPrice: parseFloat(p.current_price as string) || 0, 
          freeShipping: p.free_shipping,
          unitsSold: p.units_sold,
          isFull: p.is_full,
          partnerName: p.partner_name,
          updatedAt: p.updated_at,
        }));

        setProducts(mappedProducts);
      } catch (e: any) {
        setError("Falha ao carregar produtos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userCnae]);
  
  const handleProductClick = async (product: CnaeProduct) => {
      console.log("[ProductRedirect] Iniciando clique no produto:", product.productName);
      
      if (!productRedirectWebhookUrl || productRedirectWebhookUrl.includes('placeholder')) {
          const msg = "Erro: URL do Webhook de Redirecionamento não configurada no Admin.";
          console.error(`[ProductRedirect] ${msg}`);
          showError(msg);
          return;
      }
      
      // 1. Abre o modal de carregamento/redirecionamento
      setRedirectModal({
          isOpen: true,
          name: product.productName,
          link: '', // Link temporário vazio
          imageUrl: product.imageUrl,
      });
      
      let finalLink = product.link; // Fallback link
      
      // 2. Define o timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout de 10 segundos atingido.")), 10000)
      );

      // 3. Chama o webhook para obter o link final
      try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          
          if (!token) {
              throw new Error("Token de autenticação não encontrado.");
          }
          
          const payload = {
              userId: user.id,
              userCnpj: user.cnpj,
              productLink: product.link,
              productId: product.id,
              productName: product.productName,
          };
          
          console.log("[ProductRedirect] Chamando Webhook:", productRedirectWebhookUrl);
          console.log("[ProductRedirect] Payload enviado:", payload);

          const fetchPromise = fetch(productRedirectWebhookUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });
          
          // Espera pela resposta do fetch ou pelo timeout
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          
          if (response instanceof Error) {
              throw response; // Propaga o erro de timeout
          }

          const data = await response.json();
          console.log("[ProductRedirect] Resposta Bruta do Webhook:", data);
          
          if (!response.ok) {
              console.error("[ProductRedirect] Erro HTTP:", response.status, data);
              throw new Error(data.error || `Falha na chamada HTTP: ${response.status}`);
          }
          
          // --- EXTRAÇÃO DO LINK FINAL (AJUSTADO PARA O NOVO FORMATO) ---
          let extractedLink = null;
          if (Array.isArray(data) && data.length > 0 && data[0].urls && data[0].urls.length > 0) {
              extractedLink = data[0].urls[0].short_url;
          }
          
          if (!extractedLink) {
              console.error("[ProductRedirect] Resposta do Webhook inválida: finalLink ausente no formato esperado.", data);
              throw new Error('Webhook retornou um link inválido (finalLink ausente).');
          }
          
          finalLink = extractedLink; // Atualiza o link final
          console.log("[ProductRedirect] Link final extraído:", finalLink);
          
      } catch (e: any) {
          console.error("[ProductRedirect] Erro/Timeout capturado:", e.message);
          
          // Se houver erro (incluindo timeout), o finalLink permanece como o link original (fallback)
          showError(`Falha ao aplicar desconto/rastreamento. Redirecionando para o link original.`);
          finalLink = product.link; // Garante que o fallback seja usado
      }
      
      // 4. Atualiza o modal com o link final (seja o retornado ou o fallback)
      setRedirectModal(prev => ({
          ...prev,
          link: finalLink, // O useEffect do modal irá disparar o window.open
      }));
  };

  const renderProductCard = (product: CnaeProduct) => (
    <button 
      key={product.id}
      onClick={() => handleProductClick(product)} // Usa o handler para abrir o modal
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full text-left"
    >
      {/* Image Container */}
      <div className="h-40 overflow-hidden relative bg-white">
        <img 
          src={product.imageUrl} 
          alt={product.productName}
          // Usando object-contain para garantir que a imagem caiba dentro do contêiner
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500 p-2"
        />
        
        {/* Partner Name Overlay (REMOVIDO) */}
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        
        {/* Badges (Movidos para fora da imagem) */}
        <div className="flex flex-wrap gap-1 mb-3">
            {product.isFull && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-1 rounded-md shadow-sm">
                    FULL
                </span>
            )}
            {product.freeShipping && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 bg-green-100 px-2 py-1 rounded-md shadow-sm">
                    FRETE GRÁTIS
                </span>
            )}
            {/* Display Partner Name as a badge if available */}
            {product.partnerName && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-1 rounded-md shadow-sm">
                    {product.partnerName}
                </span>
            )}
        </div>

        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.productName}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 flex-grow">
            {product.description}
        </p>
        
        <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xl font-black text-green-600 dark:text-green-400">
                R$ {product.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {product.unitsSold && (
                <p className="text-xs text-slate-500">
                    {product.unitsSold.toLocaleString('pt-BR')} vendidos
                </p>
            )}
        </div>
        
        <div className="mt-3">
            <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Comprar Agora <span className="material-icons text-sm">arrow_forward</span>
            </span>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
        Produtos Recomendados
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
        Encontramos produtos e serviços essenciais para o seu tipo de negócio ({cnaeDescription}) em grandes marketplaces.
      </p>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <p className="text-slate-600 dark:text-slate-300">Buscando recomendações...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300">
          <p className="font-bold">Erro:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="material-icons text-4xl mb-3 text-slate-300 dark:text-slate-600">store_mall_directory</span>
          <p>Nenhuma recomendação encontrada para o seu CNAE ({userCnae}).</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(renderProductCard)}
        </div>
      )}
      
      {/* Modal de Redirecionamento */}
      <ProductRedirectModal
          isOpen={redirectModal.isOpen}
          productName={redirectModal.name}
          redirectLink={redirectModal.link}
          imageUrl={redirectModal.imageUrl}
          onClose={() => setRedirectModal({ isOpen: false, name: '', link: '', imageUrl: '' })}
      />
    </div>
  );
};

export default ProductsByCnaePage;