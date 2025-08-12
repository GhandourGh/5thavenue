import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase, db } from '../../services/supabase';
import { setJsonLd } from '../../utils/seo';

const ProductNavigation = ({ currentProductId, currentProductName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [navigationContext, setNavigationContext] = useState(null);
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const [loading, setLoading] = useState(false);

  // Parse navigation context from URL state or search params
  const parseNavigationContext = useCallback(() => {
    // Check if we have navigation context in location state
    if (location.state?.navigationContext) {
      return location.state.navigationContext;
    }

    // Fallback: try to reconstruct from URL params
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page')) || 1;
    const filters = searchParams.get('filters');

    if (category || search || filters) {
      return {
        type: 'filtered',
        category,
        search,
        sort,
        page,
        filters: filters ? JSON.parse(decodeURIComponent(filters)) : null,
        source: 'url',
      };
    }

    return null;
  }, [location.state, searchParams]);

  // Load navigation context on mount
  useEffect(() => {
    const context = parseNavigationContext();
    setNavigationContext(context);
  }, [parseNavigationContext]);

  // Build the product sequence based on navigation context
  const buildProductSequence = useCallback(async context => {
    if (!context) return [];

    try {
      setLoading(true);

      if (context.type === 'similar') {
        // For similar products, get products in the same category as the current product
        const { data: currentProduct } = await supabase
          .from('products')
          .select('category_id')
          .eq('id', currentProductId) // Use current product, not source product
          .single();

        if (currentProduct?.category_id) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', currentProduct.category_id)
            .neq('id', currentProductId) // Exclude current product
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) throw error;
          return data || [];
        }
        return [];
      }

      if (context.type === 'home') {
        // For home page products, get recent products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return data || [];
      }

      if (context.type === 'default') {
        // For direct access, get recent products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return data || [];
      }

      // Build the same query that was used in the listing
      const queryOptions = {
        categoryIds: context.category ? [context.category] : null,
        searchTerm: context.search || '',
        sortBy: context.sort || 'newest',
        discountFilter: context.filters?.discount || 'all',
        priceMin: context.filters?.priceMin || 0,
        priceMax: context.filters?.priceMax || null,
        page: 1,
        pageSize: 1000, // Get all products to build complete sequence
        excludePromos: true,
      };

      const { data, error } = await db.getRegularProducts(queryOptions);
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error building product sequence:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Find neighbors in the sequence
  const findNeighbors = useCallback((sequence, currentId) => {
    const currentIndex = sequence.findIndex(p => p.id === currentId);
    if (currentIndex === -1) return { prev: null, next: null };

    const prev = currentIndex > 0 ? sequence[currentIndex - 1] : null;
    const next =
      currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null;

    return { prev, next };
  }, []);

  // Load neighbors when context or product changes
  useEffect(() => {
    if (!currentProductId) return;

    const loadNeighbors = async () => {
      // If no navigation context, create a default one for recent products
      const context = navigationContext || {
        type: 'default',
        sort: 'newest',
      };

      const sequence = await buildProductSequence(context);
      const neighborData = findNeighbors(sequence, currentProductId);
      setNeighbors(neighborData);

      // Add SEO prev/next links
      if (neighborData.prev || neighborData.next) {
        const links = [];
        if (neighborData.prev) {
          links.push({
            rel: 'prev',
            href: `${window.location.origin}/products/${neighborData.prev.id}`,
          });
        }
        if (neighborData.next) {
          links.push({
            rel: 'next',
            href: `${window.location.origin}/products/${neighborData.next.id}`,
          });
        }

        // Add to head
        links.forEach(link => {
          const linkElement = document.createElement('link');
          linkElement.rel = link.rel;
          linkElement.href = link.href;
          document.head.appendChild(linkElement);
        });
      }
    };

    loadNeighbors();
  }, [
    currentProductId,
    navigationContext,
    buildProductSequence,
    findNeighbors,
  ]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (navigationContext?.type === 'filtered') {
      // Reconstruct the original listing URL
      const params = new URLSearchParams();

      if (navigationContext.category) {
        params.set('category', navigationContext.category);
      }
      if (navigationContext.search) {
        params.set('search', navigationContext.search);
      }
      if (navigationContext.sort && navigationContext.sort !== 'newest') {
        params.set('sort', navigationContext.sort);
      }
      if (navigationContext.page > 1) {
        params.set('page', navigationContext.page.toString());
      }
      if (navigationContext.filters) {
        params.set(
          'filters',
          encodeURIComponent(JSON.stringify(navigationContext.filters))
        );
      }

      const queryString = params.toString();
      const backUrl = `/products${queryString ? `?${queryString}` : ''}`;

      navigate(backUrl, {
        state: {
          preserveScroll: true,
          navigationContext: navigationContext,
        },
      });
    } else if (navigationContext?.type === 'similar') {
      // Go back to the source product with proper context
      navigate(`/products/${navigationContext.sourceProductId}`, {
        state: {
          navigationContext: {
            type: 'default',
            sort: 'newest',
          },
        },
      });
    } else if (navigationContext?.type === 'home') {
      // Go back to home page
      navigate('/');
    } else {
      // Fallback to products page (for default and no context)
      navigate('/products');
    }
  }, [navigate, navigationContext]);

  const handlePrevious = useCallback(() => {
    if (neighbors.prev) {
      navigate(`/products/${neighbors.prev.id}`, {
        state: {
          navigationContext,
          preserveScroll: true,
        },
      });
    }
  }, [navigate, neighbors.prev, navigationContext]);

  const handleNext = useCallback(() => {
    if (neighbors.next) {
      navigate(`/products/${neighbors.next.id}`, {
        state: {
          navigationContext,
          preserveScroll: true,
        },
      });
    }
  }, [navigate, neighbors.next, navigationContext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
        return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (neighbors.prev) handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (neighbors.next) handleNext();
          break;
        case 'Escape':
          e.preventDefault();
          handleBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [neighbors.prev, neighbors.next, handlePrevious, handleNext, handleBack]);

  // Truncate product names for display
  const truncateName = (name, maxLength = 20) => {
    if (!name) return '';
    return name.length > maxLength
      ? `${name.substring(0, maxLength)}...`
      : name;
  };

  // Get context label for back button
  const getBackLabel = () => {
    if (!navigationContext) return 'Volver a la tienda';

    if (navigationContext.type === 'similar') {
      return 'Volver a productos similares';
    }
    if (navigationContext.type === 'home') {
      return 'Volver al inicio';
    }
    if (navigationContext.type === 'default') {
      return 'Volver a la tienda';
    }
    if (navigationContext.category) {
      return `Volver a ${navigationContext.category}`;
    }
    if (navigationContext.search) {
      return `Volver a búsqueda`;
    }

    return 'Volver a la tienda';
  };

  // Always render navigation, but show different states based on context
  const hasNavigationContext = !!navigationContext;
  const hasNeighbors = !!(neighbors.prev || neighbors.next);

  return (
    <>
      {/* Inline Navigation Bar */}
      <div className="flex items-center justify-between py-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#a10009] hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#a10009] focus:ring-offset-2 border border-gray-200 hover:border-[#a10009]"
          aria-label={getBackLabel()}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{getBackLabel()}</span>
          <span className="sm:hidden">Volver</span>
        </button>

        {/* Previous/Next Navigation */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={!neighbors.prev || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#a10009] hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#a10009] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-[#a10009]"
            aria-label={`Anterior: ${neighbors.prev?.name || 'No disponible'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <div className="hidden sm:block text-left">
              <div className="text-xs text-gray-500">Anterior</div>
              <div className="font-medium">
                {truncateName(neighbors.prev?.name || '')}
              </div>
            </div>
            <div className="sm:hidden">
              <span className="text-xs">Anterior</span>
            </div>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!neighbors.next || loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#a10009] hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#a10009] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-[#a10009]"
            aria-label={`Siguiente: ${neighbors.next?.name || 'No disponible'}`}
          >
            <div className="hidden sm:block text-right">
              <div className="text-xs text-gray-500">Siguiente</div>
              <div className="font-medium">
                {truncateName(neighbors.next?.name || '')}
              </div>
            </div>
            <div className="sm:hidden">
              <span className="text-xs">Siguiente</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductNavigation;
