import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { setPageSEO } from '../utils/seo';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';
import { supabase, db } from '../services/supabase';
import whiteCartIcon from '../assets/icons/white_cart.svg';

import banner1 from '../assets/images/banner1.webp';
import banner1m from '../assets/images/banner1m.webp';
import banner4 from '../assets/images/banner4.webp';
import banner4m from '../assets/images/banner4m.webp';
import banner5 from '../assets/images/banner5.webp';
import banner5m from '../assets/images/banner5m.webp';

import bossImg from '../assets/images/boss.webp';
import lacostImg from '../assets/images/lacoste.webp';
import pacoImg from '../assets/images/paco.webp';
import boss1 from '../assets/images/boss1.webp';
import { useCart } from '../contexts/CartContext';
import { useLoading } from '../contexts/LoadingContext';
import { formatCOP, toCOPAmount } from '../utils/helpers';
import PriceWithDiscount from '../components/ui/PriceWithDiscount';
import arabicImage from '../assets/images/arabic.webp';

// Reveal-on-scroll component (top-level so it doesn't remount on parent re-renders)
const Reveal = memo(
  ({ children, direction = 'up', delay = 0, className = '' }) => {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    const offscreen =
      {
        up: 'translate-y-6',
        down: '-translate-y-6',
        left: 'translate-x-6',
        right: '-translate-x-6',
      }[direction] || 'translate-y-6';

    const base = 'transition-all duration-700 ease-out will-change-transform';
    const hidden = `opacity-0 ${offscreen}`;
    const shown = 'opacity-100 translate-x-0 translate-y-0';

    return (
      <div
        ref={containerRef}
        className={`${base} ${isVisible ? shown : hidden} ${className}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    );
  }
);

// Hero carousel isolated at top-level to avoid remounts
const HeroCarousel = memo(({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className="relative h-screen overflow-hidden h-[90vh] md:h-[80vh]">
      <div className="relative h-full w-full">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
              style={{ backgroundImage: `url(${banner.mobile})` }}
            ></div>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
              style={{ backgroundImage: `url(${banner.desktop})` }}
            ></div>
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 h-full flex items-center justify-center">
              <div className="text-center w-full">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                  {banner.title}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
                  {banner.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link
                    to="/products"
                    className="bg-[#a10009] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#8a0008] transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
                  >
                    Comprar Ahora
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </Link>
                  <Link
                    to="/stores"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#a10009] transition-all duration-300 text-lg"
                  >
                    Conoce Más
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

// Product card moved top-level; pass dependencies as props to avoid redefinition
const ProductCard = memo(
  ({ product, isNew = false, onAddToCart, isInCart, formatPriceFn }) => (
    <Link
      to={`/products/${product.id}`}
      state={{
        navigationContext: {
          type: 'home',
          section: 'featured',
        },
      }}
      className="block group"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col">
        <div className="relative bg-white flex-shrink-0 pt-4 px-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-44 md:h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sin Imagen</span>
            </div>
          )}
          {isNew && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold shadow">
              Nuevo
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
            {/* We keep ProductCard generic; use PriceWithDiscount in the caller version below */}
            <div className="text-xl font-extrabold text-gray-900">
              {formatPriceFn(product.price)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product);
              }}
              disabled={isInCart(product.id)}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center ${
                isInCart(product.id)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#a10009] text-white hover:bg-[#8a0008]'
              }`}
            >
              {isInCart(product.id) ? 'En Carrito' : 'Comprar'}
            </button>
            <button
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              aria-label="Ver"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
);

const CollectionCard = memo(({ image, title, subtitle, to }) => (
  <div className="relative h-40 md:h-60 rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl md:hover:shadow-2xl transition-all duration-500">
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-110 transition-transform duration-500 ease-out transform-gpu will-change-transform"
      style={{ backgroundImage: `url(${image})` }}
    ></div>
    <div className="absolute inset-0 bg-black/50"></div>
    <div className="absolute inset-0 flex flex-col justify-center md:justify-end p-4 md:p-6 text-center">
      <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">
        {title}
      </h3>
      {subtitle && (
        <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-4">
          {subtitle}
        </p>
      )}
      <Link
        to={to}
        className="bg-white text-[#a10009] px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 inline-flex items-center w-fit mx-auto"
      >
        <span className="text-xs md:text-sm">Comprar</span>
        <ArrowRight className="ml-2 w-3 h-3 md:w-4 md:h-4" />
      </Link>
    </div>
  </div>
));

const FeaturedBrandCard = memo(({ brand, subtext, cta, link, image }) => (
  <Link to={link} className="block group">
    <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300">
      <img
        src={image}
        alt={`${brand} banner`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out transform-gpu will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      <div className="absolute inset-0 flex items-end p-5 md:p-6">
        <div className="w-full text-center">
          <h3 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-md group-hover:drop-shadow-lg">
            {brand}
          </h3>
          <p className="text-white/80 text-sm md:text-base mt-1">{subtext}</p>
          <div className="mt-4 flex justify-center">
            <span className="inline-block bg-[#a10009] text-white rounded-full px-4 py-2 font-semibold hover:bg-[#8a0008] transition-colors">
              {cta}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
));

const Home = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [arabicPerfumes, setArabicPerfumes] = useState([]);
  const { stopLoading } = useLoading();

  // Hero carousel moved into its own component to avoid re-rendering the entire page

  // Banner images array
  const bannerImages = [
    {
      desktop: banner1,
      mobile: banner1m,
      title: 'Bienvenido a 5th Avenue',
      subtitle:
        'Descubre fragancias de lujo que cuentan tu historia. Perfumes premium para el cliente exigente.',
    },
    {
      desktop: banner4,
      mobile: banner4m,
      title: 'Nuevas Colecciones',
      subtitle:
        'Explora nuestras últimas fragancias y descubre tu aroma perfecto.',
    },
    {
      desktop: banner5,
      mobile: banner5m,
      title: 'Colección Exclusiva',
      subtitle: 'Fragancias únicas que definen tu estilo personal.',
    },
  ];

  useEffect(() => {
    setPageSEO({
      title: 'Perfumes en Colombia | 5thAvenue',
      description:
        'Compra perfumes y fragancias premium en Colombia. Envíos rápidos. 5thAvenue.',
      canonicalPath: '/',
    });
    const loadData = async () => {
      try {
        await Promise.all([loadNewReleases(), loadArabicPerfumes()]);
      } finally {
        stopLoading();
      }
    };
    loadData();
  }, [stopLoading]);

  // Hero Carousel isolated from the rest of the page so auto-rotate doesn't reset animations
  const HeroCarousel = React.memo(({ banners }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % banners.length);
      }, 8000);
      return () => clearInterval(interval);
    }, [banners.length]);

    return (
      <section className="relative h-screen overflow-hidden h-[90vh] md:h-[80vh]">
        <div className="relative h-full w-full">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
                style={{ backgroundImage: `url(${banner.mobile})` }}
              ></div>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
                style={{ backgroundImage: `url(${banner.desktop})` }}
              ></div>
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="relative max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 h-full flex items-center justify-center">
                <div className="text-center w-full">
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
                    {banner.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link
                      to="/products"
                      className="bg-[#a10009] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#8a0008] transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
                    >
                      Comprar Ahora
                      <ArrowRight className="ml-3 w-6 h-6" />
                    </Link>
                    <Link
                      to="/stores"
                      className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#a10009] transition-all duration-300 text-lg"
                    >
                      Conoce Más
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  });

  const loadNewReleases = async () => {
    try {
      // Fetch potential promos and exclude by product id to be safe (handles subcategories)
      const { data: promosData } = await db.getPromosProducts();
      const promoIds = new Set((promosData || []).map(p => p.id));

      // Fetch more than needed, then filter and slice to maintain count
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) throw error;

      const filtered = (data || [])
        .filter(p => !promoIds.has(p.id))
        .slice(0, 12);
      setNewReleases(filtered);
    } catch (error) {
      console.error('Error loading new releases:', error);
      setNewReleases([]);
    }
  };

  const loadArabicPerfumes = async () => {
    try {
      // First, let's get the Arabic category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Arabic');

      if (categoryError) throw categoryError;

      if (categoryData && categoryData.length > 0) {
        const arabicCategoryId = categoryData[0].id;

        // Now get products in the Arabic category
        const { data, error } = await supabase
          .from('products')
          .select(
            `
            *,
            categories (name)
          `
          )
          .eq('category_id', arabicCategoryId)
          .limit(4);

        if (error) throw error;
        setArabicPerfumes(data || []);
      }
    } catch (error) {
      console.error('Error loading Arabic perfumes:', error);
    }
  };

  const { addToCart, isInCart } = useCart();

  const handleAddToCart = useCallback(
    async product => {
      await addToCart(product, 1);
    },
    [addToCart]
  );

  const formatPrice = price => formatCOP(price);

  // Simple reveal-on-scroll wrapper with slide directions
  const Reveal = ({
    children,
    direction = 'up',
    delay = 0,
    className = '',
  }) => {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    const offscreen =
      {
        up: 'translate-y-6',
        down: '-translate-y-6',
        left: 'translate-x-6',
        right: '-translate-x-6',
      }[direction] || 'translate-y-6';

    const base = 'transition-all duration-700 ease-out will-change-transform';
    const hidden = `opacity-0 ${offscreen}`;
    const shown = 'opacity-100 translate-x-0 translate-y-0';

    return (
      <div
        ref={containerRef}
        className={`${base} ${isVisible ? shown : hidden} ${className}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    );
  };

  const ProductCard = ({ product, isNew = false }) => (
    <Link
      to={`/products/${product.id}`}
      state={{
        navigationContext: {
          type: 'home',
          section: 'new-releases',
        },
      }}
      className="block group"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col">
        {/* Product Image */}
        <div className="relative bg-white flex-shrink-0 pt-4 px-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-44 md:h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sin Imagen</span>
            </div>
          )}
          {/* Badges */}
          {isNew && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold shadow">
              Nuevo
            </div>
          )}
          <div className="mt-4 border-t border-gray-200" />
        </div>

        {/* Product Info */}
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
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(product);
              }}
              disabled={isInCart(product.id)}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center ${
                isInCart(product.id)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#a10009] text-white hover:bg-[#8a0008]'
              }`}
            >
              {isInCart(product.id) ? 'En Carrito' : 'Comprar'}
            </button>
            <button
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              aria-label="Ver"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );

  const CollectionCard = ({ image, title, subtitle, to }) => (
    <div className="relative h-40 md:h-60 rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl md:hover:shadow-2xl transition-all duration-500">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-110 transition-transform duration-500 ease-out transform-gpu will-change-transform"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 flex flex-col justify-center md:justify-end p-4 md:p-6 text-center">
        <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-4">
            {subtitle}
          </p>
        )}
        <Link
          to={to}
          className="bg-white text-[#a10009] px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 inline-flex items-center w-fit mx-auto"
        >
          <span className="text-xs md:text-sm">Comprar</span>
          <ArrowRight className="ml-2 w-3 h-3 md:w-4 md:h-4" />
        </Link>
      </div>
    </div>
  );

  const FeaturedBrandCard = ({ brand, subtext, cta, link, image }) => (
    <Link to={link} className="block group">
      <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300">
        <img
          src={image}
          alt={`${brand} banner`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out transform-gpu will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-end p-5 md:p-6">
          <div className="w-full text-center">
            <h3 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-md group-hover:drop-shadow-lg">
              {brand}
            </h3>
            <p className="text-white/80 text-sm md:text-base mt-1">{subtext}</p>
            <div className="mt-4 flex justify-center">
              <span className="inline-block bg-[#a10009] text-white rounded-full px-4 py-2 font-semibold hover:bg-[#8a0008] transition-colors">
                {cta}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const CategoryCard = ({ to, image, title }) => (
    <Link to={to} className="block">
      <div className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 ring-1 ring-transparent hover:ring-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${image})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 group-hover:to-black/80 transition-colors"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-white text-base md:text-lg font-semibold drop-shadow-lg">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen">
      <HeroCarousel banners={bannerImages} />

      {/* New Releases Section */}
      <section className="py-8 md:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 text-center md:text-left">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight">
                  MAS VENDIDOS
                </h2>
                <p className="text-gray-600 mt-1">
                  Descubre las novedades y encuentra tus favoritos
                </p>
              </div>
              {/* Desktop/Large: subtle text link */}
              <Link
                to="/products"
                className="hidden md:inline-flex items-center text-[#a10009] hover:text-[#8a0008] font-semibold"
              >
                Ver Todo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            {/* Mobile: bold CTA button */}
            <div className="mt-3 md:hidden">
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center bg-[#a10009] text-white px-4 py-2 rounded-full font-semibold shadow-sm active:scale-[0.99] transition-transform"
              >
                Ver Todo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newReleases.map((product, index) => (
              <Reveal key={product.id} delay={index * 60}>
                <Link
                  to={`/products/${product.id}`}
                  state={{
                    navigationContext: {
                      type: 'home',
                      section: 'new-releases',
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
                          className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-44 md:h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            Sin Imagen
                          </span>
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
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={isInCart(product.id)}
                          className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center ${
                            isInCart(product.id)
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-[#a10009] text-white hover:bg-[#8a0008]'
                          }`}
                        >
                          {isInCart(product.id) ? 'En Carrito' : 'Comprar'}
                        </button>
                        <button
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {newReleases.length > 0 && (
            <div className="mt-4 md:hidden">
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center bg-[#a10009] text-white px-4 py-2 rounded-full font-semibold shadow-sm active:scale-[0.99] transition-transform"
              >
                Ver todos
              </Link>
            </div>
          )}

          {newReleases.length === 0 && (
            <Reveal className="text-center py-12">
              <p className="text-gray-500">
                No hay nuevos lanzamientos disponibles.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Arabic Collection Callout */}

      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/arabic" className="block group">
            <div className="relative rounded-2xl overflow-hidden shadow-lg md:shadow-xl transition-shadow duration-300">
              <img
                src={arabicImage}
                alt="Perfumes árabes — Colección exclusiva"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/40 group-hover:from-black/60 group-hover:via-black/45 group-hover:to-black/35 transition-colors" />
              <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                    Colección Árabe
                  </h3>
                  <p className="mt-2 text-white/90 text-sm md:text-base">
                    Notas exóticas y lujosas del Medio Oriente. Descubre
                    Lattafa, Afnan, Armaf y más.
                  </p>
                </div>
                <span className="inline-flex items-center justify-center bg-[#a10009] text-white rounded-full px-5 py-2 font-semibold hover:bg-[#8a0008] transition-colors w-full md:w-auto">
                  Explorar ahora →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Brands Section - Colecciones Destacadas */}
      <section className="py-8 md:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Colecciones Destacadas
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Marcas de lujo con presencia icónica
            </p>
          </Reveal>

          {/* Mobile: horizontal swipe */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory">
              <div className="min-w-[80%] snap-start">
                <Reveal direction="right">
                  <FeaturedBrandCard
                    brand="Hugo Boss"
                    subtext="Elegancia atemporal y poder en cada gota"
                    cta="Explorar Boss →"
                    link="/products?search=Hugo%20Boss"
                    image={bossImg}
                  />
                </Reveal>
              </div>
              <div className="min-w-[80%] snap-start">
                <Reveal>
                  <FeaturedBrandCard
                    brand="Paco Rabanne"
                    subtext="Fragancias icónicas con un toque atrevido"
                    cta="Ver Paco Rabanne →"
                    link="/products?search=Paco%20Rabanne"
                    image={pacoImg}
                  />
                </Reveal>
              </div>
              <div className="min-w-[80%] snap-start">
                <Reveal direction="left">
                  <FeaturedBrandCard
                    brand="Lacoste"
                    subtext="Frescura y sofisticación para cada día"
                    cta="Descubrir Lacoste →"
                    link="/products?search=Lacoste"
                    image={lacostImg}
                  />
                </Reveal>
              </div>
            </div>
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <Reveal direction="right">
              <FeaturedBrandCard
                brand="Hugo Boss"
                subtext="Elegancia atemporal y poder en cada gota"
                cta="Explorar Boss →"
                link="/products?search=Hugo%20Boss"
                image={bossImg}
              />
            </Reveal>
            <Reveal>
              <FeaturedBrandCard
                brand="Paco Rabanne"
                subtext="Fragancias icónicas con un toque atrevido"
                cta="Ver Paco Rabanne →"
                link="/products?search=Paco%20Rabanne"
                image={pacoImg}
              />
            </Reveal>
            <Reveal direction="left">
              <FeaturedBrandCard
                brand="Lacoste"
                subtext="Frescura y sofisticación para cada día"
                cta="Descubrir Lacoste →"
                link="/products?search=Lacoste"
                image={lacostImg}
              />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
