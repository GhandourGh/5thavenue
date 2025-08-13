// Format Colombian Peso
export const formatCOP = amount => {
  // Colombian Peso format: $200.000 (no space after $, dots for thousands, no decimals)
  if (!amount || isNaN(amount)) {
    return '$0';
  }

  const num = parseFloat(amount);
  
  // Use the amount exactly as stored - no multiplication or scaling
  const fullAmount = Math.round(num);
  
  // Use Colombian locale formatting for proper thousand separators
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fullAmount);
  
  return `$${formatted}`;
};

// Convert to COP amount (remove currency symbol and dots, return as number)
export const toCOPAmount = amount => {
  if (!amount) return 0;
  
  // Remove all non-digit characters and convert to number
  const cleanAmount = amount.toString().replace(/[^\d]/g, '');
  return parseInt(cleanAmount) || 0;
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
