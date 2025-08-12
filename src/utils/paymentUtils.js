// Payment utility functions
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PSE: 'pse',
  NEQUI: 'nequi',
  CASH_ON_DELIVERY: 'cod',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Format payment amount for display
export const formatPaymentAmount = (amount, currency = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Validate credit card number (Luhn algorithm)
export const validateCreditCard = cardNumber => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Get card type from number
export const getCardType = cardNumber => {
  const cleaned = cardNumber.replace(/\s/g, '');

  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
};

// Format credit card number for display
export const formatCreditCardNumber = cardNumber => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const cardType = getCardType(cleaned);

  if (cardType === 'amex') {
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  } else {
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
};

// Validate CVV
export const validateCVV = (cvv, cardType) => {
  const cleaned = cvv.replace(/\s/g, '');
  const length = cardType === 'amex' ? 4 : 3;
  return /^\d+$/.test(cleaned) && cleaned.length === length;
};

// Validate expiration date
export const validateExpirationDate = (month, year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  if (expMonth < 1 || expMonth > 12) return false;

  return true;
};

// Generate payment reference
export const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

// Calculate payment fees
export const calculatePaymentFees = (amount, paymentMethod) => {
  const fees = {
    [PAYMENT_METHODS.CREDIT_CARD]: 0.029, // 2.9%
    [PAYMENT_METHODS.PSE]: 0.01, // 1%
    [PAYMENT_METHODS.NEQUI]: 0.005, // 0.5%
    [PAYMENT_METHODS.CASH_ON_DELIVERY]: 0, // No fees
  };

  const feeRate = fees[paymentMethod] || 0;
  return Math.round(amount * feeRate);
};

// Validate Colombian phone number for PSE
export const validateColombianPhone = phone => {
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+57|57)?[1-9][0-9]{9}$/.test(cleaned);
};

// Format phone number for PSE
export const formatPhoneForPSE = phone => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+57')) {
    return cleaned.substring(3);
  }
  if (cleaned.startsWith('57')) {
    return cleaned.substring(2);
  }
  return cleaned;
};

// Calculate Wompi payment fees
export const calculateWompiFees = amount => {
  const percentage = 0.0295; // 2.95%
  const fixedFee = 1000; // $1,000 COP
  return Math.round(amount * percentage + fixedFee);
};

// Calculate total amount including fees
export const calculatePaymentTotal = (subtotal, shipping = 0) => {
  const baseTotal = subtotal + shipping;
  const fees = calculateWompiFees(baseTotal);
  const total = baseTotal + fees;

  return {
    subtotal,
    shipping,
    fees,
    total,
    breakdown: {
      subtotal: subtotal,
      shipping: shipping,
      fees: fees,
      total: total,
    },
  };
};

// Wompi payment configuration
export const WOMPI_CONFIG = {
  // Test credentials (replace with production)
  publicKey: process.env.REACT_APP_WOMPI_PUBLIC_KEY || 'pub_test_1234567890',
  currency: 'COP',
  country: 'CO',

  // Payment methods
  paymentMethods: {
    card: {
      name: 'Tarjeta de Crédito/Débito',
      description: 'Visa, Mastercard, American Express',
    },
  },

  // Fee structure
  fees: {
    percentage: 0.0295, // 2.95%
    fixed: 1000, // $1,000 COP
    international: 0.035, // 3.5% for international cards
  },
};
