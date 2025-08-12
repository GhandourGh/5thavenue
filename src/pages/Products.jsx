import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { setPageSEO } from '../utils/seo';
import {
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  ChevronsDown,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, db } from '../services/supabase';
import { formatCOP } from '../utils/helpers';
import PriceWithDiscount from '../components/ui/PriceWithDiscount';

import { useCart } from '../context/CartContext';
import { useLoading } from '../context/LoadingContext';

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [sortBy, setSortBy] = useState('newest');

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showAllCategoriesDesktop, setShowAllCategoriesDesktop] =
    useState(false);
  const [showAllCategoriesMobile, setShowAllCategoriesMobile] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const [filterAnimating, setFilterAnimating] = useState(false);

  // Enhanced filter states
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [discountFilter, setDiscountFilter] = useState('all');

  // Cart functionality
  const { addToCart, isInCart } = useCart();
  const { stopLoading } = useLoading();

  // Filter options
  const sizeOptions = [
    '30ml',
    '50ml',
    '80ml',
    '100ml',
    '125ml',
    '150ml',
    '200ml',
  ];

  useEffect(() => {
    setPageSEO({
      title: 'Tienda de Perfumes | 5thAvenue',
      description:
        'Explora perfumes por marca, notas y precio. Ofertas en 5thAvenue.',
      canonicalPath: '/products',
    });
    const loadData = async () => {
      try {
        await loadCategories();
        await loadProducts();
      } finally {
        stopLoading();
      }
    };
    loadData();
  }, [stopLoading]);

  // Handle URL parameters for category filtering and search
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');

    if (categoryFromUrl) {
      setSelectedCategories([categoryFromUrl]);
    }

    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  // Reload products when filters or pagination change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories,
    searchTerm,
    priceRange[0],
    priceRange[1],
    sortBy,
    discountFilter,
    page,
  ]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Resolve category names to IDs from loaded categories
      let categoryIds = [];
      if (selectedCategories.length > 0) {
        const nameSet = new Set(selectedCategories.map(c => c.toLowerCase()));
        categoryIds = categories
          .filter(c => c.name && nameSet.has(c.name.toLowerCase()))
          .map(c => c.id);
      }

      const { data, error, count } = await db.getRegularProducts({
        categoryIds: categoryIds.length ? categoryIds : null,
        searchTerm,
        priceMin: priceRange[0] || 0,
        priceMax: priceRange[1] || null,
        sortBy,
        discountFilter,
        page,
        pageSize,
        excludePromos: true,
      });
      if (error) throw error;
      setProducts(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .not('name', 'ilike')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddToCart = useCallback(
    async product => {
      await addToCart(product, 1);
    },
    [addToCart]
  );

  const toggleFilter = useCallback((filterType, value) => {
    switch (filterType) {
      case 'size':
        setSelectedSizes(prev =>
          prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev, value]
        );
        break;
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setPriceRange([0, 2000000]);
    setSortBy('newest');
    setSearchTerm('');
    setSelectedSizes([]);
    setDiscountFilter('all');
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Basic filters
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.categories?.name);
      const priceMatch =
        product.price >= priceRange[0] && product.price <= priceRange[1];
      const searchMatch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand &&
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()));

      // Enhanced filters
      const sizeMatch =
        selectedSizes.length === 0 ||
        selectedSizes.some(size =>
          product.name.toLowerCase().includes(size.toLowerCase())
        );

      // Discount filter
      const discountMatch =
        discountFilter === 'all' ||
        (discountFilter === 'discounted' && product.discount > 0) ||
        (discountFilter === 'no-discount' &&
          (!product.discount || product.discount === 0));

      return (
        categoryMatch && priceMatch && searchMatch && sizeMatch && discountMatch
      );
    });
  }, [
    products,
    selectedCategories,
    priceRange,
    searchTerm,
    selectedSizes,
    discountFilter,
  ]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.rating || 0) - (a.rating || 0);
        case 'discount':
          return (b.discount || 0) - (a.discount || 0);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [filteredProducts, sortBy]);

  const FilterSection = useCallback(
    ({ title, children, isFirst = false }) => (
      <div
        className={`${isFirst ? '' : 'pt-5 mt-5 border-t border-gray-100'} mb-2`}
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
        {children}
      </div>
    ),
    []
  );

  const FilterCheckbox = useCallback(
    ({ label, checked, onChange, count }) => (
      <label className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="text-[#a10009] focus:ring-[#a10009] rounded"
          />
          <span className="ml-3 text-sm text-gray-700 group-hover:text-[#a10009] group-hover:underline underline-offset-2 decoration-[#a10009]">
            {label}
          </span>
        </div>
        {count && <span className="text-xs text-gray-400">({count})</span>}
      </label>
    ),
    []
  );

  const filteredCategoryList = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  // Highlight search term inside a string (for product titles)
  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightMatch = useCallback(
    text => {
      if (!searchTerm || !text) return text;
      const pattern = new RegExp(`(${escapeRegExp(searchTerm)})`, 'ig');
      const parts = String(text).split(pattern);
      return parts.map((part, idx) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span
            key={`${part}-${idx}`}
            className="text-[#a10009] font-bold inline-block transition-transform duration-150 ease-out scale-110"
            style={{
              textShadow:
                '0 0 0.25rem rgba(161, 0, 8, 0.2), 0 0 0.5rem rgba(161, 0, 8, 0.21), 0 0 1rem rgba(161, 0, 8, 0.2)',
            }}
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${idx}`}>{part}</span>
        )
      );
    },
    [searchTerm]
  );

  // End animation shortly after products recalc
  useEffect(() => {
    if (filterAnimating) {
      const t = setTimeout(() => setFilterAnimating(false), 250);
      return () => clearTimeout(t);
    }
  }, [filterAnimating, filteredProducts]);

  const CategoryList = ({ variant }) => {
    const isDesktop = variant === 'desktop';
    const showAll = isDesktop
      ? showAllCategoriesDesktop
      : showAllCategoriesMobile;
    const setShowAll = isDesktop
      ? setShowAllCategoriesDesktop
      : setShowAllCategoriesMobile;
    const visible = showAll
      ? filteredCategoryList
      : filteredCategoryList.slice(0, 6);

    const listRef = useRef(null);

    const changeCategory = (name, checked) => {
      const pageY = window.scrollY;
      const listY = listRef.current ? listRef.current.scrollTop : 0;
      setFilterAnimating(true);
      setSelectedCategories(prev => {
        if (name === 'all') return [];
        const exists = prev.includes(name);
        if (checked && !exists) return [...prev, name];
        if (!checked && exists) return prev.filter(c => c !== name);
        return prev;
      });
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listY;
        window.scrollTo({ top: pageY, behavior: 'auto' });
      });
    };

    return (
      <div>
        {/* Search input (mobile drawer shows at top, desktop inside section) */}
        <div className={`mb-3 ${isDesktop ? '' : 'mt-2'}`}>
          <input
            type="text"
            value={categorySearch}
            onChange={e => setCategorySearch(e.target.value)}
            placeholder="Buscar categoría…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
          />
        </div>

        <div
          ref={listRef}
          className="max-h-[350px] overflow-y-auto pr-1 custom-scrollbar"
        >
          <FilterCheckbox
            label="Todos"
            checked={selectedCategories.length === 0}
            onChange={e => changeCategory('all', e.target.checked)}
          />
          {visible.map(category => (
            <FilterCheckbox
              key={category.id}
              label={category.name}
              checked={selectedCategories.includes(category.name)}
              onChange={e => changeCategory(category.name, e.target.checked)}
            />
          ))}
        </div>

        {!showAll && filteredCategoryList.length > 6 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
            <ChevronsDown className="w-3 h-3 animate-bounce" />
            Desliza para ver más
          </div>
        )}

        {filteredCategoryList.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 text-sm font-medium text-[#a10009] hover:text-[#8a0008]"
          >
            {showAll ? '− Ver menos' : '+ Ver más'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Nuestros Productos
              </h1>
              <p className="text-gray-600">
                Descubre fragancias de lujo para cada ocasión
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2 text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar perfumes, marcas, notas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filter Panel */}
          <div
            className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-[#a10009] mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Filtros
                  </h2>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[#a10009] hover:text-[#8a0008] font-medium"
                >
                  Limpiar
                </button>
              </div>

              {/* Categories */}
              <FilterSection title="Categorías" isFirst>
                <CategoryList variant="desktop" />
              </FilterSection>

              {/* Price Range */}
              <FilterSection title="Rango de Precio">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Mínimo
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={priceRange[0]}
                        onChange={e =>
                          setPriceRange([
                            parseInt(e.target.value) || 0,
                            priceRange[1],
                          ])
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Máximo
                      </label>
                      <input
                        type="number"
                        placeholder="2000000"
                        value={priceRange[1]}
                        onChange={e =>
                          setPriceRange([
                            priceRange[0],
                            parseInt(e.target.value) || 2000000,
                          ])
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Sizes */}
              <FilterSection title="Tamaños">
                <div className="space-y-1">
                  {sizeOptions.map(size => (
                    <FilterCheckbox
                      key={size}
                      label={size}
                      checked={selectedSizes.includes(size)}
                      onChange={() => toggleFilter('size', size)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Discount */}
              <FilterSection title="Descuentos">
                <div className="space-y-1">
                  <label className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      value="all"
                      checked={discountFilter === 'all'}
                      onChange={e => setDiscountFilter(e.target.value)}
                      className="text-[#a10009] focus:ring-[#a10009]"
                    />
                    <span className="ml-3 text-sm text-gray-700">Todos</span>
                  </label>
                  <label className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      value="discounted"
                      checked={discountFilter === 'discounted'}
                      onChange={e => setDiscountFilter(e.target.value)}
                      className="text-[#a10009] focus:ring-[#a10009]"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Con Descuento
                    </span>
                  </label>
                  <label className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      value="no-discount"
                      checked={discountFilter === 'no-discount'}
                      onChange={e => setDiscountFilter(e.target.value)}
                      className="text-[#a10009] focus:ring-[#a10009]"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Sin Descuento
                    </span>
                  </label>
                </div>
              </FilterSection>

              {/* Sort */}
              <FilterSection title="Ordenar Por">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-transparent text-sm"
                >
                  <option value="newest">Más Recientes Primero</option>
                  <option value="price-low">Precio: Menor a Mayor</option>
                  <option value="price-high">Precio: Mayor a Menor</option>
                  <option value="name">Nombre: A a Z</option>
                  <option value="popularity">Más Populares</option>
                  <option value="discount">Mayor Descuento</option>
                </select>
              </FilterSection>

              {/* Results Count */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {sortedProducts.length} de {products.length} productos
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Products Grid */}
          <div className="flex-1">
            {/* Mobile filter drawer trigger */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(true)}
                className="w-full bg-[#a10009] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Filter className="w-5 h-5" /> Filtrar
              </button>
            </div>

            {/* Mobile quick controls: Descuentos + Ordenar */}
            <div className="lg:hidden mb-4 grid grid-cols-2 gap-3">
              <select
                value={discountFilter}
                onChange={e => setDiscountFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
              >
                <option value="all">Descuentos</option>
                <option value="discounted">Con Descuento</option>
                <option value="no-discount">Sin Descuento</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
              >
                <option value="newest">Más Recientes</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="name">Nombre: A a Z</option>
                <option value="popularity">Más Populares</option>
                <option value="discount">Mayor Descuento</option>
              </select>
            </div>
            {/* Active Filters Display */}
            {(selectedCategories.length > 0 ||
              selectedSizes.length > 0 ||
              discountFilter !== 'all') && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Filtros Activos
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#a10009] hover:text-[#8a0008]"
                  >
                    Limpiar Todo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#a10009] text-white"
                    >
                      {cat}
                      <X
                        className="ml-1 w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setSelectedCategories(prev =>
                            prev.filter(c => c !== cat)
                          )
                        }
                      />
                    </span>
                  ))}
                  {selectedSizes.map(size => (
                    <span
                      key={size}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700"
                    >
                      {size}
                      <X
                        className="ml-1 w-3 h-3 cursor-pointer"
                        onClick={() => toggleFilter('size', size)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
                  >
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2 w-3/4"></div>
                    <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Search className="w-16 h-16 text-gray-300 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 mb-4">
                  Intenta ajustar tus filtros o términos de búsqueda
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-[#a10009] text-white px-6 py-2 rounded-lg hover:bg-[#8a0008] transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${filterAnimating ? 'opacity-60' : 'opacity-100'}`}
              >
                {sortedProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col cursor-pointer group h-full"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();

                      // Build navigation context
                      const navigationContext = {
                        type: 'filtered',
                        category: selectedCategories[0] || null,
                        search: searchTerm || null,
                        sort: sortBy,
                        page,
                        filters: {
                          discount: discountFilter,
                          priceMin: priceRange[0],
                          priceMax: priceRange[1],
                          sizes: selectedSizes,
                        },
                      };

                      navigate(`/products/${product.id}`, {
                        state: { navigationContext },
                      });
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                    }}
                  >
                    {/* Product Image */}
                    <div className="relative bg-white flex-shrink-0 pt-4 px-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-44 md:h-48 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-sm">
                            Sin Imagen
                          </span>
                        </div>
                      )}
                      {/* Discount Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#a10009] text-white rounded-full px-3 py-2 text-[10px] font-bold tracking-wide">
                          {product.discount}% OFF
                        </div>
                      )}

                      {/* Stock Status */}
                      {product.stock === 0 && (
                        <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          Agotado
                        </div>
                      )}

                      {/* Divider */}
                      <div className="mt-4 border-t border-gray-200" />
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="mb-3 text-center">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide line-clamp-2">
                          {highlightMatch(product.name)}
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

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
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
                          onClick={e => {
                            e.stopPropagation();

                            // Build navigation context
                            const navigationContext = {
                              type: 'filtered',
                              category: selectedCategories[0] || null,
                              search: searchTerm || null,
                              sort: sortBy,
                              page,
                              filters: {
                                discount: discountFilter,
                                priceMin: priceRange[0],
                                priceMax: priceRange[1],
                                sizes: selectedSizes,
                              },
                            };

                            navigate(`/products/${product.id}`, {
                              state: { navigationContext },
                            });
                          }}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {sortedProducts.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                <button
                  onClick={() =>
                    setPage(p => (p < Math.ceil(total / pageSize) ? p + 1 : p))
                  }
                  disabled={page >= Math.ceil(total / pageSize)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${page >= Math.ceil(total / pageSize) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Mobile Filters Drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilters(false)}
            ></div>
            <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm bg-white shadow-2xl flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-[#a10009] mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Filtros
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Accordion: Categorías */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() =>
                      setMobileCategoriesOpen(!mobileCategoriesOpen)
                    }
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      Categorías
                    </span>
                    {mobileCategoriesOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {mobileCategoriesOpen && (
                    <div className="px-4 pb-3">
                      <CategoryList variant="mobile" />
                    </div>
                  )}
                </div>

                {/* Price Range (Mobile) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Rango de Precio
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Mínimo
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={priceRange[0]}
                        onChange={e =>
                          setPriceRange([
                            parseInt(e.target.value) || 0,
                            priceRange[1],
                          ])
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Máximo
                      </label>
                      <input
                        type="number"
                        placeholder="2000000"
                        value={priceRange[1]}
                        onChange={e =>
                          setPriceRange([
                            priceRange[0],
                            parseInt(e.target.value) || 2000000,
                          ])
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Sizes (Mobile) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Tamaños
                  </h3>
                  <div>
                    {sizeOptions.map(size => (
                      <FilterCheckbox
                        key={size}
                        label={size}
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleFilter('size', size)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      clearAllFilters();
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-[#a10009] text-white py-3 rounded-lg font-semibold"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
