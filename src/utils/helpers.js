// Format price with currency
export const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

// Format number as Colombian Pesos (COP) with thousand separators and no decimals.
// Supports values saved in thousands (e.g., 200 -> $200.000) and full COP (e.g., 30000 -> $30.000).
export const formatCOP = value => {
  const numericValue = Number(value) || 0;
  const isStoredInThousands = Math.abs(numericValue) < 1000;
  const amountInCop = isStoredInThousands ? numericValue * 1000 : numericValue;

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCop);
};

// Convert a numeric value that may be stored in thousands to an absolute COP amount (number)
export const toCOPAmount = value => {
  const numericValue = Number(value) || 0;
  return Math.abs(numericValue) < 1000 ? numericValue * 1000 : numericValue;
};

// Unified discounted price calculation - ensures consistency across all components
export const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  const priceInCop = toCOPAmount(Number(originalPrice) || 0);
  const discount = Number(discountPercentage) || 0;

  if (discount <= 0) return priceInCop;

  const discountedPrice = priceInCop * (1 - discount / 100);
  return Math.round(discountedPrice);
};

// Calculate discount percentage from original and discounted prices
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  const original = toCOPAmount(Number(originalPrice) || 0);
  const discounted = toCOPAmount(Number(discountedPrice) || 0);

  if (original <= 0 || discounted >= original) return 0;

  const percentage = ((original - discounted) / original) * 100;
  return Math.ceil(percentage); // Round up for display consistency
};

// Format date
export const formatDate = date => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Show notification (for future toast implementation)
export const showNotification = (message, type = 'info') => {
  // This will be replaced with a proper toast notification system
  console.log(`${type.toUpperCase()}: ${message}`);
};

// Validate email
export const validateEmail = email => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const validatePassword = password => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar,
    errors: {
      length: password.length < minLength,
      uppercase: !hasUpperCase,
      lowercase: !hasLowerCase,
      numbers: !hasNumbers,
      special: !hasSpecialChar,
    },
  };
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Scroll to top utility
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

// Local storage helpers
export const storage = {
  get: key => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Cart helpers
export const cartHelpers = {
  getCart: () => {
    return storage.get('5thavenue_cart') || [];
  },

  addToCart: (product, quantity = 1) => {
    const cart = cartHelpers.getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    storage.set('5thavenue_cart', cart);
    return cart;
  },

  removeFromCart: productId => {
    const cart = cartHelpers.getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    storage.set('5thavenue_cart', updatedCart);
    return updatedCart;
  },

  updateQuantity: (productId, quantity) => {
    const cart = cartHelpers.getCart();
    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    storage.set('5thavenue_cart', updatedCart);
    return updatedCart;
  },

  clearCart: () => {
    storage.remove('5thavenue_cart');
    return [];
  },

  getCartTotal: () => {
    const cart = cartHelpers.getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    const cart = cartHelpers.getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },
};
