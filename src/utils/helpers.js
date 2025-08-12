// Format Colombian Peso
export const formatCOP = amount => {
  // Colombian Peso format: $ 500.000 (with space after $, dots for thousands, no decimals)
  const number = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `$ ${number}`;
};

// Convert to COP amount (remove currency symbol)
export const toCOPAmount = amount => {
  return parseInt(amount.toString().replace(/[^\d]/g, ''));
};

// Calculate discount percentage
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Format price with discount
export const formatPriceWithDiscount = (originalPrice, discountedPrice) => {
  const discountPercentage = calculateDiscountPercentage(
    originalPrice,
    discountedPrice
  );
  return {
    originalPrice: formatCOP(originalPrice),
    discountedPrice: formatCOP(discountedPrice),
    discountPercentage,
  };
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

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate email
export const validateEmail = email => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number (Colombian format)
export const validatePhone = phone => {
  const re = /^(\+57|57)?[1-9][0-9]{9}$/;
  return re.test(phone.replace(/\s/g, ''));
};

// Format phone number
export const formatPhone = phone => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = str => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get initials from name
export const getInitials = name => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
