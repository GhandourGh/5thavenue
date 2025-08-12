import React, { useState, useEffect, useCallback } from 'react';
import { setPageSEO, setJsonLd } from '../utils/seo';
import { useParams, Link } from 'react-router-dom';
import { Star, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { formatCOP, toCOPAmount } from '../utils/helpers';
import PriceWithDiscount from '../components/ui/PriceWithDiscount';
import whiteCartIcon from '../assets/icons/white_cart.svg';
import { useCart } from '../contexts/CartContext';
import ProductNavigation from '../components/ui/ProductNavigation';

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productRating, setProductRating] = useState(4.5);
  const [productReviewCount, setProductReviewCount] = useState(24);
  const [similarProductRatings, setSimilarProductRatings] = useState({});

  useEffect(() => {
    loadProduct();
    loadSimilarProducts();
  }, [id]);

  // Generate random rating between 3.5 and 5.0
  const generateRandomRating = () => {
    return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
  };

  // Generate random review count between 10 and 200
  const generateRandomReviewCount = () => {
    return Math.floor(Math.random() * 191) + 10;
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
      // SEO per product
      try {
        const title = `${data.name} | 5thAvenue`;
        const desc =
          data.description && data.description.length > 20
            ? `${data.description.slice(0, 150)}…`
            : 'Perfume original en 5thAvenue.';
        setPageSEO({
          title,
          description: desc,
          canonicalPath: `/products/${data.id}`,
        });
        const availability =
          (Number(data.stock || data.quantity) || 0) > 0
            ? 'InStock'
            : 'OutOfStock';
        const jsonld = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          image: data.image_url ? [data.image_url] : [],
          offers: {
            '@type': 'Offer',
            priceCurrency: 'COP',
            price: Number(data.price) || 0,
            availability: `https://schema.org/${availability}`,
            url: `${window.location.origin}/products/${data.id}`,
          },
        };
        setJsonLd(`product-${data.id}`, jsonld);
      } catch {}
      // Generate random rating and review count for the product
      setProductRating(generateRandomRating());
      setProductReviewCount(generateRandomReviewCount());
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .neq('id', id)
        .limit(4)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSimilarProducts(data || []);

      // Generate random ratings for similar products
      const ratings = {};
      data?.forEach(product => {
        ratings[product.id] = generateRandomRating();
      });
      setSimilarProductRatings(ratings);
    } catch (error) {
      console.error('Error loading similar products:', error);
    }
  };

  const handleQuantityChange = increment => {
    const newQuantity = quantity + increment;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 10)) {
      setQuantity(newQuantity);
    }
  };

  const { addToCart } = useCart();

  const handleAddToCart = useCallback(async () => {
    if (product) {
      await addToCart(product, quantity);
      setShowAddedToCart(true);
      setTimeout(() => setShowAddedToCart(false), 2000);
    }
  }, [addToCart, product, quantity]);

  const formatPrice = price => formatCOP(price);

  const parseNotes = value => {
    if (!value || typeof value !== 'string') return [];
    return value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Removed getNoteEmoji and emoji usage

  const renderNoteChip = note => (
    <span
      key={`note-${note}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
    >
      {/* Emoji removed */}
      <span className="capitalize">{note}</span>
    </span>
  );

  // Gallery helpers
  const gallery = React.useMemo(() => {
    const arr =
      Array.isArray(product?.image_urls) && product.image_urls.length > 0
        ? product.image_urls.filter(Boolean)
        : product?.image_url
          ? [product.image_url]
          : [];
    return arr;
  }, [product]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
  }, [product?.id]);

  useEffect(() => {
    setImgLoaded(false);
  }, [currentIndex]);

  const goPrev = () => {
    if (gallery.length < 2) return;
    setCurrentIndex(i => (i - 1 + gallery.length) % gallery.length);
  };
  const goNext = () => {
    if (gallery.length < 2) return;
    setCurrentIndex(i => (i + 1) % gallery.length);
  };

  const renderStars = rating => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
              ? 'text-yellow-400 fill-current opacity-50'
              : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a10009] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Producto no encontrado</p>
        </div>
      </div>
    );
  }

  const stockQty = Number(product?.quantity) || 0;
  const isOutOfStock = stockQty <= 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-[#a10009]">
              Inicio
            </a>
            <span>/</span>
            <a href="/products" className="hover:text-[#a10009]">
              Productos
            </a>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Navigation - positioned between breadcrumb and product content */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductNavigation
            currentProductId={product?.id}
            currentProductName={product?.name}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images (Gallery) */}
          <div className="space-y-3">
            {/* Main Image with smooth nav */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              {gallery.length > 0 ? (
                <>
                  <img
                    src={gallery[currentIndex]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                  />
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white shadow"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white shadow"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-sm">Sin Imagen</span>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 ${idx === currentIndex ? 'border-[#a10009]' : 'border-gray-200'}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ver imagen ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand, Name & Category */}
            <div>
              <p className="text-[#a10009] font-medium text-sm uppercase tracking-wide">
                5th Avenue
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-1">
                {product.name}
              </h1>
              {product.categories?.name && (
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {product.categories.name}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {renderStars(productRating)}
              </div>
              <span className="text-sm text-gray-600">
                {productRating} ({productReviewCount} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center">
              <PriceWithDiscount
                price={product.price}
                discount={product.discount}
                size="lg"
                align="left"
              />
            </div>
            {/* Only show availability when out of stock */}
            {isOutOfStock && (
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full bg-gray-400"
                  aria-hidden="true"
                ></span>
                <span className="text-sm text-gray-600">No disponible</span>
              </div>
            )}

            {/* Description */}
            {product.description &&
              String(product.description).trim().length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Descripción
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

            {/* Scent Pyramid (optional) */}
            {(product.top_notes ||
              product.middle_notes ||
              product.base_notes) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Pirámide Olfativa
                </h3>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Row: Top → Middle → Base */}
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    {product.top_notes && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          Notas de Salida
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {parseNotes(product.top_notes).map(n =>
                            renderNoteChip(n)
                          )}
                        </div>
                      </div>
                    )}
                    {product.middle_notes && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          Notas de Corazón
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {parseNotes(product.middle_notes).map(n =>
                            renderNoteChip(n)
                          )}
                        </div>
                      </div>
                    )}
                    {product.base_notes && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          Notas de Fondo
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {parseNotes(product.base_notes).map(n =>
                            renderNoteChip(n)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Cantidad
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center font-medium text-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={
                    isOutOfStock || quantity >= (product?.quantity || 0)
                  }
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-[#a10009] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#8a0008] transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <img src={whiteCartIcon} alt="Carrito" className="w-5 h-5" />
                <span>Agregar al Carrito</span>
              </button>
            </div>

            {/* Added to Cart Feedback */}
            {showAddedToCart && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ ¡Agregado al carrito exitosamente!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            Productos Similares
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                state={{
                  navigationContext: {
                    type: 'default',
                    sort: 'newest',
                  },
                }}
                className="block group h-full"
              >
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col h-full">
                  <div className="relative bg-white flex-shrink-0 pt-4 px-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-44 md:h-48 flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 text-sm">
                          Sin Imagen
                        </span>
                      </div>
                    )}
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-[#a10009] text-white rounded-full px-3 py-2 text-[10px] font-bold tracking-wide">
                        {product.discount}% OFF
                      </div>
                    )}
                    <div className="mt-4 border-t border-gray-200" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-3 text-center">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    <div className="text-center mb-3 mt-auto">
                      <PriceWithDiscount
                        price={product.price}
                        discount={product.discount}
                        size="md"
                        showBadge={false}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
