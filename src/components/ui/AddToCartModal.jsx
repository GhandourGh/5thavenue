import React, { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useCart } from '../../contexts/CartContext';
import { formatCOP, toCOPAmount } from '../../utils/helpers';
import PriceWithDiscount from './PriceWithDiscount';

const AddToCartModal = () => {
  const navigate = useNavigate();
  const { lastAdded, clearLastAdded, openCart, cart } = useCart();
  const [suggestions, setSuggestions] = useState([]);

  const loadSuggestions = useCallback(async () => {
    try {
      // Prefer products from the same category as last added, fallback to recent
      if (lastAdded?.id) {
        const baseQuery = supabase
          .from('products')
          .select(`*, categories (name)`)
          .order('created_at', { ascending: false })
          .limit(8);

        const { data, error } = await baseQuery;
        if (!error) {
          const filtered = (data || []).filter(
            p => p.id !== lastAdded.id && !cart.some(ci => ci.id === p.id)
          );
          setSuggestions(filtered.slice(0, 4));
        }
      }
    } catch (e) {
      setSuggestions([]);
    }
  }, [lastAdded, cart]);

  useEffect(() => {
    if (lastAdded) loadSuggestions();
  }, [lastAdded, loadSuggestions]);

  if (!lastAdded) return null;

  const base = toCOPAmount(Number(lastAdded.price) || 0);
  const unit = base;
  const quantity = Number(lastAdded.quantity) || 1;
  const currentTotal = formatCOP(unit * quantity);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 md:p-6 transition-opacity duration-300 ease-out"
      onClick={clearLastAdded}
    >
      <div
        className="w-full max-w-sm md:max-w-3xl lg:max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform scale-95 opacity-0 animate-[modalIn_300ms_ease-out_forwards]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Producto agregado
          </h3>
          <button
            onClick={clearLastAdded}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top content */}
        <div className="px-4 py-4 md:px-6 md:py-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Product summary */}
          <div className="md:col-span-2 flex items-start gap-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {lastAdded.image_url ? (
                <img
                  src={lastAdded.image_url}
                  alt={lastAdded.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {lastAdded.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">Cantidad: {quantity}</p>
            </div>
          </div>

          {/* Price and actions */}
          <div className="md:col-span-1">
            <div className="text-right mb-3">
              <p className="text-sm text-gray-600">Precio del producto</p>
              <p className="text-lg font-bold text-gray-900">{currentTotal}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  clearLastAdded();
                  openCart();
                }}
                className="w-full border border-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Ver carrito
              </button>
              <button
                onClick={() => {
                  clearLastAdded();
                  navigate('/checkout');
                }}
                className="w-full bg-[#a10009] text-white py-2 rounded-lg font-semibold hover:bg-[#8a0008] flex items-center justify-center gap-2 transition-colors"
              >
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              También te puede gustar
            </h4>

            {/* Mobile: horizontal scroll */}
            <div className="md:hidden -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory">
                {suggestions.map(p => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    onClick={clearLastAdded}
                    className="min-w-[9.5rem] snap-start block group h-full"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col h-full">
                      <div className="relative bg-white flex-shrink-0 pt-2 px-2">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-24 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 text-[10px]">
                              Sin Imagen
                            </span>
                          </div>
                        )}
                        {p.discount > 0 && (
                          <div className="absolute top-1 left-1 bg-[#a10009] text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                            {p.discount}% OFF
                          </div>
                        )}
                        <div className="mt-2 border-t border-gray-200" />
                      </div>
                      <div className="p-2 flex flex-col flex-1">
                        <div className="mb-1 text-center">
                          <p className="text-[10px] font-semibold text-gray-900 uppercase tracking-wide line-clamp-2">
                            {p.name}
                          </p>
                        </div>
                        <div className="text-center mt-auto">
                          <PriceWithDiscount
                            price={p.price}
                            discount={p.discount}
                            size="sm"
                            showBadge={false}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-4 gap-3">
              {suggestions.map(p => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  onClick={clearLastAdded}
                  className="block group h-full"
                >
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col h-full">
                    <div className="relative bg-white flex-shrink-0 pt-3 px-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-28 object-contain transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs">
                            Sin Imagen
                          </span>
                        </div>
                      )}
                      {p.discount > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-[#a10009] text-white rounded-full px-2 py-1 text-[10px] font-bold tracking-wide">
                          {p.discount}% OFF
                        </div>
                      )}
                      <div className="mt-3 border-t border-gray-200" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <div className="mb-2 text-center">
                        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide line-clamp-2">
                          {p.name}
                        </p>
                      </div>
                      <div className="text-center mt-auto">
                        <PriceWithDiscount
                          price={p.price}
                          discount={p.discount}
                          size="sm"
                          showBadge={false}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToCartModal;
