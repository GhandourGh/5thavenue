// Application configuration
export const APP_CONFIG = {
  name: '5th Avenue Spanish Online',
  version: '1.0.0',
  description: 'Premium perfume store for the Colombian market',
  baseUrl: process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
};

// API configuration
export const API_CONFIG = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  wompiPublicKey: process.env.REACT_APP_WOMPI_PUBLIC_KEY,
};

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'COP',
  country: 'CO',
  supportedMethods: ['credit_card', 'pse', 'nequi'],
  codEnabled: true,
  codMessage: 'Cash on delivery available for orders over $50.000',
};

// Shipping configuration
export const SHIPPING_SCOPE = 'local'; // 'local' | 'nationwide'

export const SHIPPING_CONFIG = {
  freeShippingThreshold: 200000, // 200k COP
  standardShippingCost: 15000, // 15k COP
  expressShippingCost: 25000, // 25k COP
  estimatedDeliveryDays: {
    standard: '3-5 business days',
    express: '1-2 business days',
  },
};

// Product configuration
export const PRODUCT_CONFIG = {
  itemsPerPage: 12,
  maxQuantity: 10,
  categories: ['men', 'women', 'unisex', 'kids', 'arabic', 'niche'],
  brands: ['Boss', 'Lacoste', 'Paco Rabanne', 'Sai', 'Arabic Oud'],
};

// SEO configuration
export const SEO_CONFIG = {
  defaultTitle: '5th Avenue Spanish Online - Premium Perfumes',
  defaultDescription:
    "Discover luxury fragrances from the world's finest brands. Free shipping on orders over $200.000",
  defaultKeywords:
    'perfumes, fragrances, luxury, colombia, boss, lacoste, paco rabanne',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@5thavenue_co',
};

// Feature flags
export const FEATURES = {
  wishlist: true,
  reviews: true,
  recommendations: true,
  socialLogin: false,
  guestCheckout: true,
  orderTracking: true,
  emailNotifications: true,
};

// Error messages
export const ERROR_MESSAGES = {
  networkError: 'Error de conexión. Por favor, inténtalo de nuevo.',
  invalidEmail: 'Por favor, ingresa un email válido.',
  invalidPassword: 'La contraseña debe tener al menos 8 caracteres.',
  requiredField: 'Este campo es obligatorio.',
  invalidPhone: 'Por favor, ingresa un número de teléfono válido.',
  cartEmpty: 'Tu carrito está vacío.',
  paymentFailed: 'Error en el pago. Por favor, inténtalo de nuevo.',
  orderFailed: 'Error al procesar tu orden. Por favor, inténtalo de nuevo.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  orderPlaced: '¡Tu orden ha sido procesada exitosamente!',
  paymentSuccessful: 'Pago procesado exitosamente.',
  itemAdded: 'Producto agregado al carrito.',
  itemRemoved: 'Producto removido del carrito.',
  profileUpdated: 'Perfil actualizado exitosamente.',
  passwordChanged: 'Contraseña cambiada exitosamente.',
};

// Validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  phone: {
    required: true,
    pattern: /^(\+57|57)?[1-9][0-9]{9}$/,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
  },
};

// COD (Cash on Delivery) configuration
export const COD_DISABLED_MESSAGE =
  'Contra Entrega está disponible solo en San Andrés.';

// Normalize text for comparison (remove accents and convert to lowercase)
const normalize = s => {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Check if COD is allowed for a location
export const isCodAllowedLocation = ({ department, city }) => {
  const d = normalize(department);
  const c = normalize(city);

  if (!d && !c) return false;

  // Common variants for the San Andrés department naming
  const codAllowedDepartments = new Set([
    'san andres y providencia',
    'san andres, providencia y santa catalina',
    'archipielago de san andres, providencia y santa catalina',
  ]);

  const codAllowedCities = new Set(['san andres']);

  if (codAllowedDepartments.has(d)) return true;
  if (codAllowedCities.has(c)) return true;

  return false;
};
