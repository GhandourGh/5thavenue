import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { toCOPAmount } from '../utils/helpers';
import { useAuth } from './AuthContext';
import { userData } from '../services/supabase';

const CART_KEY = '5thavenue_cart';
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Hydrate synchronously from localStorage for best UX on first paint
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const { user } = useAuth();
  const previousUserIdRef = useRef(null);
  const memoryCartRef = useRef([]);

  // Promo pricing: when buying 10 units, apply special bundle price
  // Keyed by unit price in COP (after normalization via toCOPAmount)
  const PROMO_BULK_PRICING = useRef({
    30000: 200000, // 10 x 30,000 => 200,000
    45000: 350000, // 10 x 45,000 => 350,000
  });

  const safeReadLocalCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(it => ({
          id: it.id,
          name: it.name,
          price: Number(it.price) || 0,
          image_url: it.image_url,
          brand: it.brand,
          size: it.size,
          category_id: it.category_id,
          quantity: Number(it.quantity) || 0,
        }))
        .filter(it => it && it.id && it.quantity >= 0);
    } catch {
      return memoryCartRef.current || [];
    }
  };

  const safeWriteLocalCart = value => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(value));
    } catch {
      memoryCartRef.current = Array.isArray(value) ? value : [];
    }
  };

  const persistCartLocal = nextCart => {
    // Keep a single place to mirror local storage instantly after state changes
    safeWriteLocalCart(nextCart);
  };

  // Load cart from Supabase if logged in; fall back to localStorage for guests
  const loadCart = async () => {
    setIsCartLoading(true);
    setCartError(null);
    if (user?.id) {
      const { data, error } = await userData.getCartItems(user.id);
      if (error) {
        setCartError(error);
        setCart(safeReadLocalCart());
        setIsCartLoading(false);
        return;
      }
      const mapped = (data || []).map(row => ({
        id: row.product_id || row.products?.id,
        name: row.products?.name,
        price: Number(row.products?.price) || 0,
        image_url: row.products?.image_url,
        category_id: row.products?.category_id,
        quantity: Number(row.quantity) || 0,
      }));
      setCart(mapped);
      setIsCartLoading(false);
      return;
    }
    // guest
    setCart(safeReadLocalCart());
    setIsCartLoading(false);
  };

  // Persist cart to localStorage mirror for both guests and logged-in users
  useEffect(() => {
    safeWriteLocalCart(cart);
  }, [cart]);

  useEffect(() => {
    // Ensure immediate hydration for guests before any async auth kicks in
    if (!user?.id) {
      setCart(safeReadLocalCart());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load/merge cart on user changes
  useEffect(() => {
    const mergeLocalIntoSupabase = async () => {
      const localItems = safeReadLocalCart();
      if (!Array.isArray(localItems) || localItems.length === 0) return;
      // push each item
      await Promise.all(
        localItems.map(it => userData.addToCart(user.id, it.id, it.quantity))
      );
      // clear local after merge
      safeWriteLocalCart([]);
    };

    const init = async () => {
      if (user?.id) {
        // if user just logged in, merge
        if (previousUserIdRef.current !== user.id) {
          await mergeLocalIntoSupabase();
        }
      }
      await loadCart();
      previousUserIdRef.current = user?.id || null;
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Add item to cart
  const addToCart = useCallback(async (product, quantity = 1) => {
    let nextCartSnapshot = [];
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let next;
      if (existingItem) {
        next = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        next = [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image_url: product.image_url,
            brand: product.brand,
            size: product.size,
            category_id: product.category_id,
            quantity: Number(quantity) || 0,
          },
        ];
      }
      nextCartSnapshot = next;
      persistCartLocal(next);
      setLastAdded({
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        price: Number(product.price) || 0,
        quantity,
      });
      return next;
    });
    // Persist for logged-in user
    if (user?.id) {
      await userData.addToCart(user.id, product.id, quantity);
    }
  }, []);

  // Add item to cart without triggering popup (for use inside cart)
  const addToCartSilent = useCallback(async (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let next;
      if (existingItem) {
        next = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        next = [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image_url: product.image_url,
            brand: product.brand,
            size: product.size,
            category_id: product.category_id,
            quantity: Number(quantity) || 0,
          },
        ];
      }
      persistCartLocal(next);
      return next;
    });
    if (user?.id) {
      await userData.addToCart(user.id, product.id, quantity);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(
    async productId => {
      setCart(prevCart => {
        const next = prevCart.filter(item => item.id !== productId);
        persistCartLocal(next);
        return next;
      });
      if (user?.id) {
        await userData.removeFromCart(user.id, productId);
      }
    },
    [user]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      setCart(prevCart => {
        const next = prevCart
          .map(item =>
            item.id === productId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          )
          .filter(item => item.quantity > 0);
        persistCartLocal(next);
        return next;
      });
      if (user?.id) {
        if (quantity > 0) {
          await userData.updateCartItem(user.id, productId, quantity);
        } else {
          await userData.removeFromCart(user.id, productId);
        }
      }
    },
    [user]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    setCart([]);
    persistCartLocal([]);
    if (user?.id) {
      await userData.clearCart(user.id);
    }
  }, [user]);

  // Calculate cart total
  const cartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + getItemPrice(item), 0);
  }, [cart]);

  // Calculate total items in cart
  const cartItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Get cart item by ID
  const getCartItem = useCallback(
    productId => {
      return cart.find(item => item.id === productId);
    },
    [cart]
  );

  // Check if item is in cart
  const isInCart = useCallback(
    productId => {
      return cart.some(item => item.id === productId);
    },
    [cart]
  );

  // Get item price with promo-awareness (handles 10x bundle pricing when applicable)
  const getItemPrice = useCallback(item => {
    const numericPrice = Number(item.price) || 0;
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const unitPriceCop = toCOPAmount(numericPrice);

    const bulkPriceForTen = PROMO_BULK_PRICING.current[unitPriceCop];
    if (!bulkPriceForTen || quantity < 1) {
      return unitPriceCop * quantity;
    }

    const bundleCount = Math.floor(quantity / 10);
    const remainder = quantity % 10;
    const totalWithBundles =
      bundleCount * bulkPriceForTen + remainder * unitPriceCop;
    return totalWithBundles;
  }, []);

  // Determine if a given category contains promo-eligible items (by unit price pattern)
  const isPromosProduct = useCallback(
    categoryId => {
      if (!categoryId) return false;
      const item = cart.find(it => it.category_id === categoryId);
      if (!item) return false;
      const unitPriceCop = toCOPAmount(Number(item.price) || 0);
      return Boolean(PROMO_BULK_PRICING.current[unitPriceCop]);
    },
    [cart]
  );

  // Count total quantity of promo-eligible items in the cart
  const getPromosItemsCount = useCallback(() => {
    return cart.reduce((sum, it) => {
      const unitPriceCop = toCOPAmount(Number(it.price) || 0);
      return (
        sum +
        (PROMO_BULK_PRICING.current[unitPriceCop]
          ? Number(it.quantity) || 0
          : 0)
      );
    }, 0);
  }, [cart]);

  // Calculate total savings from promo bundles across the cart
  const getPromosSavings = useCallback(() => {
    return cart.reduce((savings, it) => {
      const unitPriceCop = toCOPAmount(Number(it.price) || 0);
      const bulk = PROMO_BULK_PRICING.current[unitPriceCop];
      if (!bulk) return savings;
      const quantity = Math.max(0, Number(it.quantity) || 0);
      const bundleCount = Math.floor(quantity / 10);
      const regularForBundles = unitPriceCop * 10 * bundleCount;
      const promoForBundles = bulk * bundleCount;
      return savings + Math.max(0, regularForBundles - promoForBundles);
    }, 0);
  }, [cart]);

  // Toggle cart open/close
  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  // Open cart
  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Close cart
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  // Clear last added item
  const clearLastAdded = useCallback(() => {
    setLastAdded(null);
  }, []);

  const value = {
    cart,
    isCartOpen,
    lastAdded,
    cartTotal,
    cartItemCount,
    getCartItem,
    isInCart,
    getItemPrice,
    isPromosProduct,
    getPromosItemsCount,
    getPromosSavings,
    addToCart,
    addToCartSilent,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    clearLastAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
