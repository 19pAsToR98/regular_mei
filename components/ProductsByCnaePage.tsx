import React, { useState, useEffect, useMemo } from 'react';
import { CnaeProduct, User } from '../types';
import { supabase } from '../src/integrations/supabase/client';
import { showError } from '../utils/toastUtils';

interface ProductsByCnaePageProps {
  user: User;
}

const ProductsByCnaePage: React.FC<ProductsByCnaePageProps> = ({ user }) => {
  const [products, setProducts] = useState<CnaeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userCnae = useMemo(() => {
    const fullCnae = user.cnpjData?.estabelecimento?.atividade_principal?.id;
    return fullCnae || null;
  }, [user.cnpjData]);
  
  const cnaeDescription = useMemo(() => {
    return user.cnpjData?.estabelecimento?.atividade_principal?.descricao || 'seu negócio';
  }, [user.cnpjData]);

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
        const { data, error } = await supabase
          .from('cnae_products')
          .select('*')
          .eq('cnae_code', userCnae)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const mappedProducts: CnaeProduct[] = data.map(p => ({
          id: p.id,
          cnaeCode: p.cnae_code,
          productName: p.product_name,
          description: p.description,
          link: p.link,
          imageUrl: p.image_url,
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

  const renderProductCard = (product: CnaeProduct) => (
    <a 
      key={product.id}
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-105"
    >
      {/* Image */}
      <div className="h-48 overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.productName}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          {product.isFull && (
            <span className="text-xs font-bold uppercase text-white bg-blue-600 px-2 py-1 rounded-md">
              FULL
            </span>
          )}
          {product.freeShipping && (
            <span className="text-xs font-bold uppercase text-white bg-green-500 px-2 py-1 rounded-md">
              FRETE GRÁTIS
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 truncate">{product.productName}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-4">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">
            R$ {product.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {product.unitsSold && (
            <p className="text-xs text-slate-400">
              {product.unitsSold.toLocaleString('pt-BR')} vendidos
            </p>
          )}
        </div>
      </div>
    </a>
  );

  return (
    <div className="space-y-8 p-6">
      <header>
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-2">Produtos Recomendados</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Encontramos produtos e serviços essenciais para o seu tipo de negócio ({cnaeDescription}) em grandes marketplaces.
        </p>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <p className="text-slate-600 dark:text-slate-300">Buscando recomendações...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300">
          <p className="font-bold">Erro:</p>
          <p>{error}</p>
        </div>
      )}

      {/* No Products Found */}
      {!loading && !error && products.length === 0 && (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="material-icons text-4xl mb-3 text-slate-300 dark:text-slate-600">store_mall_directory</span>
          <p>Nenhuma recomendação encontrada para o seu CNAE ({userCnae}).</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(renderProductCard)}
        </div>
      )}
    </div>
  );
};

export default ProductsByCnaePage;
