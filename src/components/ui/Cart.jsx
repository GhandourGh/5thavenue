import React, { useState, useEffect, useCallback } from 'react';
import { X, ShoppingBag, ArrowRight, Star, Truck, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { formatCOP, toCOPAmount } from '../../utils/helpers';
import PriceWithDiscount from './PriceWithDiscount';
import { useCart } from '../../contexts/CartContext';

const Cart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    isPromosProduct,
    getItemPrice,
    getPromosItemsCount,
    getPromosSavings,
    addToCart,
    addToCartSilent,
    isInCart,
  } = useCart();

  const [similarProducts, setSimilarProducts] = useState([]);

  // Minimum order threshold in COP
  const FREE_SHIPPING_THRESHOLD = 100000;

  const loadSimilarProducts = useCallback(async () => {
    try {
      // Get categories from cart items
      const cartCategories = cart.map(item => item.category_id).filter(Boolean);

      if (cartCategories.length === 0) {
        // If no categories, just get recent products
        const { data, error } = await supabase
          .from('products')
          .select(
            `
            *,
            categories (name)
          `
          )
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setSimilarProducts(data || []);
        return;
      }

      // Get products from same categories as cart items
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .in('category_id', cartCategories)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Filter out products already in cart
      let filteredProducts = (data || []).filter(
        product => !cart.some(cartItem => cartItem.id === product.id)
      );

      // Fallback to recent products if none found in same categories
      if (!filteredProducts || filteredProducts.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select(
            `
            *,
            categories (name)
          `
          )
          .order('created_at', { ascending: false })
          .limit(6);
        if (!fallbackError) {
          filteredProducts = (fallbackData || []).filter(
            product => !cart.some(cartItem => cartItem.id === product.id)
          );
        }
      }
      setSimilarProducts((filteredProducts || []).slice(0, 4));
    } catch (error) {
      console.error('Error loading similar products:', error);
    }
  }, [cart]);

  // Load similar products based on cart items
  useEffect(() => {
    if (cart.length > 0) {
      loadSimilarProducts();
    }
  }, [cart, loadSimilarProducts]);

  const formatPrice = price => formatCOP(price);

  const handleQuantityChange = async (productId, newQuantity) => {
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async productId => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleQuickAdd = async product => {
    await addToCartSilent(product, 1);
  };

  // Calculate order requirements
  const subtotal = cartTotal();
  const meetsMinimumOrder = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-[#a10009]" />
              Carrito ({cartItemCount()})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#a10009] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="px-4 py-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega algunos productos para comenzar
              </p>
              <Link
                to="/products"
                onClick={onClose}
                className="bg-[#a10009] text-white px-6 py-3 rounded-lg hover:bg-[#8a0008] transition-colors font-medium"
              >
                Explorar Productos
              </Link>
            </div>
          ) : (
            <>
              {/* Minimum Order Requirements */}
              {!meetsMinimumOrder && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-center">
                    <Truck className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">
                      Pedido mínimo: {formatPrice(FREE_SHIPPING_THRESHOLD)}
                    </span>
                  </div>
                </div>
              )}

              {/* Promos info banner removed per request */}

              {/* Cart Items List */}
              <div className="space-y-2 mb-3">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className={`relative flex items-center justify-between gap-1 rounded-lg border ${
                      isPromosProduct(item.category_id)
                        ? 'bg-yellow-50 border-yellow-200 p-2 sm:p-3'
                        : 'bg-gray-50 border-gray-200 p-1'
                    }`}
                  >
                    {/* Promos badge removed; using descriptive text instead */}

                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-white flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ShoppingBag className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h3
                        className="font-semibold text-gray-900 text-base md:text-lg leading-snug mb-1 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {item.brand}
                        </p>
                      )}
                      {item.size && (
                        <span className="text-[11px] text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          {item.size}
                        </span>
                      )}
                      {isPromosProduct(item.category_id) &&
                        (() => {
                          const unit = toCOPAmount(Number(item.price) || 0);
                          const bulkMap = { 30000: 200000, 45000: 350000 };
                          const bulk = bulkMap[unit];
                          if (!bulk) return null;
                          const offerText = `1 x ${formatPrice(unit)} y 10 x ${formatPrice(bulk)}`;
                          return (
                            <p className="text-[11px] sm:text-xs text-yellow-800 mt-1">
                              {offerText}
                            </p>
                          );
                        })()}
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex flex-col items-end gap-2 shrink-0 min-w-[96px] sm:min-w-[112px]">
                      {/* Price */}
                      <div className="text-right">
                        {isPromosProduct(item.category_id) ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#a10009] text-lg">
                              {formatPrice(getItemPrice(item))}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900 text-base">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Dropdown */}
                      <div className="flex items-center mt-1">
                        <select
                          value={item.quantity}
                          onChange={e =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value)
                            )
                          }
                          className="text-sm font-semibold text-[#a10009] bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#a10009] focus:border-[#a10009] appearance-none cursor-pointer shadow-sm"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.25rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2rem',
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-[#a10009] transition-colors p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total:</span>
                    <span className="text-xl font-bold text-[#a10009]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={!meetsMinimumOrder}
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                    className={`w-full py-3 rounded-lg transition-colors font-semibold ${
                      meetsMinimumOrder
                        ? 'bg-[#a10009] text-white hover:bg-[#8a0008]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {meetsMinimumOrder
                      ? 'Proceder al Pago'
                      : 'Pedido Mínimo No Cumplido'}
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpiar Carrito
                  </button>
                </div>
              </div>

              {/* Similar Products */}
              {similarProducts.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Productos Similares
                  </h3>
                  <div className="space-y-3">
                    {similarProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors h-full"
                      >
                        {/* Product Image */}
                        <Link
                          to={`/products/${product.id}`}
                          onClick={onClose}
                          className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 block"
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 px-3">
                          <Link
                            to={`/products/${product.id}`}
                            onClick={onClose}
                            className="block"
                          >
                            <h4 className="font-medium text-gray-800 truncate">
                              {product.name}
                            </h4>
                          </Link>
                          {product.brand && (
                            <p className="text-sm text-gray-500 truncate">
                              {product.brand}
                            </p>
                          )}
                          {/* Price */}
                          <div className="flex items-center mt-1">
                            <PriceWithDiscount
                              price={product.price}
                              discount={product.discount}
                              size="sm"
                              align="left"
                            />
                          </div>
                        </div>

                        {/* Quick Add */}
                        <button
                          onClick={() => handleQuickAdd(product)}
                          disabled={isInCart(product.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                            isInCart(product.id)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-[#a10009] text-white hover:bg-[#8a0008]'
                          }`}
                        >
                          {isInCart(product.id) ? 'En carrito' : 'Agregar'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/products"
                    onClick={onClose}
                    className="flex items-center justify-center mt-4 text-[#a10009] hover:text-[#8a0008] font-medium"
                  >
                    Ver Más Productos
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
