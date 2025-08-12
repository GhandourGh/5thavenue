// Payment Utilities for Wompi Integration
// 5th Avenue Spanish - Payment Processing

/**
 * Calculate Wompi payment fees
 * @param {number} amount - Amount in COP
 * @returns {number} - Fee amount in COP
 */
export const calculateWompiFees = amount => {
  const percentage = 0.0295; // 2.95%
  const fixedFee = 1000; // $1,000 COP
  return Math.round(amount * percentage + fixedFee);
};

/**
 * Calculate total amount including fees
 * @param {number} subtotal - Subtotal in COP
 * @param {number} shipping - Shipping cost in COP
 * @returns {object} - Object with breakdown
 */
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

/**
 * Format payment breakdown for display
 * @param {object} breakdown - Payment breakdown object
 * @returns {string} - Formatted string
 */
export const formatPaymentBreakdown = breakdown => {
  return {
    subtotal: `$${breakdown.subtotal.toLocaleString('es-CO')}`,
    shipping: `$${breakdown.shipping.toLocaleString('es-CO')}`,
    fees: `$${breakdown.fees.toLocaleString('es-CO')}`,
    total: `$${breakdown.total.toLocaleString('es-CO')}`,
  };
};

/**
 * Validate payment amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} - Is valid
 */
export const validatePaymentAmount = amount => {
  return amount > 0 && amount <= 10000000; // Max 10M COP
};

/**
 * Generate unique payment reference
 * @param {string} orderNumber - Order number
 * @returns {string} - Payment reference
 */
export const generatePaymentReference = orderNumber => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${orderNumber}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Wompi payment configuration
 */
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

/**
 * Get Wompi widget configuration
 * @param {object} orderData - Order data
 * @returns {object} - Widget configuration
 */
export const getWompiWidgetConfig = orderData => {
  const { total, order_number, customer } = orderData;

  return {
    publicKey: WOMPI_CONFIG.publicKey,
    amount: total,
    currency: WOMPI_CONFIG.currency,
    reference: generatePaymentReference(order_number),
    customerEmail: customer.email,
    customerName: customer.full_name,
    country: WOMPI_CONFIG.country,
    redirectUrl: `${window.location.origin}/payment/success`,
    cancelUrl: `${window.location.origin}/payment/cancel`,
  };
};

/**
 * Handle Wompi payment success
 * @param {object} paymentData - Payment response data
 * @param {function} onSuccess - Success callback
 * @param {function} onError - Error callback
 */
export const handleWompiSuccess = (paymentData, onSuccess, onError) => {
  try {
    if (paymentData.status === 'APPROVED') {
      onSuccess(paymentData);
    } else {
      onError(new Error(`Payment failed: ${paymentData.status}`));
    }
  } catch (error) {
    onError(error);
  }
};

/**
 * Handle Wompi payment error
 * @param {object} error - Error object
 * @param {function} onError - Error callback
 */
export const handleWompiError = (error, onError) => {
  console.error('Wompi payment error:', error);
  onError(error);
};
