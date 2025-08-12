import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { supabase } from '../services/supabase';
import { formatCOP } from '../utils/helpers';
import { useCart } from '../context/CartContext';

const Promos = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, isInCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [availableCategories, setAvailableCategories] = useState([]); // ordered as provided

  // Actual Arabic categories from Supabase (ordered)
  const ARABIC_CATEGORY_NAMES = useMemo(
    () => [
      'LATTAFA',
      'AFNAN',
      'ARMAF',
      'LE FALCONE',
      'MAISON ALHAMBRA',
      'ZAKAT',
      'AL WATANIAH',
      'ZOGHBI',
      'SAHARI',
      'AL GAZAL',
    ],
    []
  );

  // Use global site font (Inter); remove page-specific font injection

  const loadArabicPerfumes = async () => {
    try {
      setLoading(true);
      // 1) Fetch all categories and filter to the provided list (case-insensitive match)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (categoriesError) throw categoriesError;

      const providedLower = ARABIC_CATEGORY_NAMES.map(n => n.toLowerCase());
      const matchedCategories = (categoriesData || []).filter(c =>
        providedLower.includes((c.name || '').toLowerCase())
      );

      // Respect provided order
      const orderedMatched = [...ARABIC_CATEGORY_NAMES]
        .map(name =>
          matchedCategories.find(
            c => (c.name || '').toLowerCase() === name.toLowerCase()
          )
        )
        .filter(Boolean);

      setAvailableCategories(orderedMatched.map(c => c.name));

      // 2) If we have matched categories, fetch products in those categories
      if (orderedMatched.length > 0) {
        const categoryIds = orderedMatched.map(c => c.id);
        const { data, error } = await supabase
          .from('products')
          .select(`*, categories (name)`)
          .in('category_id', categoryIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
        return;
      }

      // 3) Fallback: attempt previous logic (Arabic parent or string brand contains)
      const { data: arabicCategory, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', 'arabic')
        .maybeSingle();

      if (!categoryError && arabicCategory) {
        const { data, error } = await supabase
          .from('products')
          .select(`*, categories (name)`)
          .eq('category_id', arabicCategory.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
        return;
      }

      const { data: all, error: allErr } = await supabase
        .from('products')
        .select(`*, categories (name)`)
        .order('created_at', { ascending: false });
      if (allErr) throw allErr;

      const lowercaseFallback = ARABIC_CATEGORY_NAMES.map(b => b.toLowerCase());
      const filtered = (all || []).filter(p =>
        lowercaseFallback.includes((p.categories?.name || '').toLowerCase())
      );
      setProducts(filtered);
    } catch (error) {
      console.error('Error loading Arabic perfumes:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArabicPerfumes();
  }, []);

  const handleAddToCart = useCallback(
    async product => {
      await addToCart(product, 1);
    },
    [addToCart]
  );

  const formatPrice = useCallback(price => formatCOP(price), []);

  const categoryCounts = useMemo(() => {
    const counts = (
      availableCategories.length ? availableCategories : ARABIC_CATEGORY_NAMES
    ).reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    for (const p of products) {
      const catName = p.categories?.name || '';
      if (counts.hasOwnProperty(catName)) counts[catName] += 1;
    }
    return counts;
  }, [products, availableCategories, ARABIC_CATEGORY_NAMES]);

  const displayedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!selectedCategory || selectedCategory === 'Todos') return products;
    return products.filter(
      p =>
        (p.categories?.name || '').toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-black via-[#111] to-[#1b1b1b]">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a10009] mx-auto"></div>
            <p className="mt-4 text-gray-300">Cargando colección árabe...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 relative bg-gradient-to-b from-black via-[#0f0f0f] to-[#111] text-white">
      {/* Subtle geometric pattern overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #a10009 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}
      <section className="relative">
        <div className="relative max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
              Colección de Perfumes Árabes
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
            Elegancia oriental con notas intensas y exóticas. Descubre marcas
            como Lattafa, Afnan, Armaf y más.
          </p>
        </div>
      </section>

      {/* Brand selector scaffold */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              'Todos',
              ...(availableCategories.length
                ? availableCategories
                : ARABIC_CATEGORY_NAMES),
            ].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm border transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#a10009] text-white border-[#a10009]'
                    : 'bg-black/30 text-gray-200 border-[#a10009]/30 hover:border-[#a10009]'
                }`}
                aria-pressed={selectedCategory === cat}
              >
                {cat}
                {cat !== 'Todos' && (
                  <span className="ml-2 text-xs text-white/70">
                    {categoryCounts[cat] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {displayedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-300 mb-6">
                No hay perfumes árabes disponibles por ahora.
              </p>
              <button
                onClick={() => navigate('/products?category=Arabic')}
                className="bg-[#a10009] text-white px-6 py-3 rounded-lg hover:bg-[#8a0008] transition-colors font-semibold"
              >
                Ver Todos los Productos
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-300">
                {displayedProducts.length} perfume
                {displayedProducts.length !== 1 ? 's' : ''} árabe
                {displayedProducts.length !== 1 ? 's' : ''}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {displayedProducts.map(product => (
                  <div
                    key={product.id}
                    className="group bg-[#0b0b0b]/80 backdrop-blur rounded-2xl border border-[#a10009]/40 shadow-sm overflow-hidden hover:shadow-lg hover:border-[#a10009] transition-shadow duration-300 ease-in-out flex flex-col cursor-pointer h-full"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/products/${product.id}`);
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                    }}
                  >
                    {/* Image */}
                    <div className="relative pt-4 px-4 bg-gradient-to-b from-black to-transparent">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-44 md:h-48 bg-black/40 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">
                            Sin Imagen
                          </span>
                        </div>
                      )}

                      {product.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#a10009] text-white rounded-full px-3 py-1 text-[10px] font-bold tracking-wide">
                          {product.discount}% OFF
                        </div>
                      )}

                      <div className="mt-4 border-t border-[#a10009]/30" />
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="mb-2 text-center">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-xs text-[#a10009] mt-1">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      <div className="text-center mb-3 mt-auto">
                        {/* Local white price block to match original spacing but with white text */}
                        {Number(product.discount) > 0 ? (
                          <div className="space-y-1">
                            <div className="text-gray-400 line-through text-sm">
                              {formatPrice(
                                (Number(product.price) || 0) /
                                  (1 - (Number(product.discount) || 0) / 100)
                              )}
                            </div>
                            <div className="font-extrabold text-white text-lg">
                              {formatPrice(product.price)}
                            </div>
                            <div className="inline-flex items-center rounded-full bg-[#a10009] text-white text-[11px] px-2.5 py-1 font-bold tracking-wide">
                              {product.discount}% OFF
                            </div>
                          </div>
                        ) : (
                          <div className="font-extrabold text-white text-lg">
                            {formatPrice(product.price)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={
                            isInCart(product.id) || product.quantity <= 0
                          }
                          className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center ${
                            isInCart(product.id)
                              ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                              : 'bg-[#a10009] text-white hover:bg-[#8a0008]'
                          }`}
                        >
                          {isInCart(product.id)
                            ? 'En Carrito'
                            : product.quantity <= 0
                              ? 'Agotado'
                              : 'Comprar'}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/products/${product.id}`);
                          }}
                          className="w-10 h-10 rounded-full border border-[#a10009]/40 flex items-center justify-center hover:border-[#a10009]"
                          aria-label="Ver"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-[#a10009]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Promos;
