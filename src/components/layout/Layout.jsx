import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, User, Search, X, TrendingUp, Menu } from 'lucide-react';
import logo from '../../assets/icons/logo5th.svg';
import eyeIcon from '../../assets/icons/eye.svg';
import seyeIcon from '../../assets/icons/seye.svg';
import whatsappIcon from '../../assets/icons/whatsapp.svg';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Cart from '../ui/Cart';
import AddToCartModal from '../ui/AddToCartModal';
import EmailConfirmationMessage from '../ui/EmailConfirmationMessage';
import Toast from '../ui/Toast';
import { supabase } from '../../services/supabase';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [activeAuthTab, setActiveAuthTab] = useState('login');
  const [verifySending, setVerifySending] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState({ type: null, text: '' });
  const [toast, setToast] = useState({
    open: false,
    type: 'success',
    message: '',
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(
      () => setToast({ open: false, type, message: '' }),
      2200
    );
  };

  // Detect Supabase password recovery session after email link
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetModal(true);
        // Clean URL hash if present
        try {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          );
        } catch {}
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const profileDropdownRef = useRef(null);
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  const [searchParams] = useSearchParams();
  const { cartItemCount, isCartOpen, toggleCart, closeCart } = useCart();
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();

  // Popular search suggestions
  const popularSearches = [
    'Perfumes masculinos',
    'Fragancias femeninas',
    'Eau de Parfum',
    'Perfumes de lujo',
    'Fragancias orientales',
    'Perfumes frescos',
    'Fragancias florales',
    'Perfumes amaderados',
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Open auth modals based on query parameters
  useEffect(() => {
    const login = searchParams.get('login');
    const signup = searchParams.get('signup');
    if (login === '1') {
      setIsLoginOpen(true);
    }
    if (signup === '1') {
      setIsSignupOpen(true);
    }
  }, [searchParams]);

  const handleWhatsAppClick = () => {
    const phoneNumber = '96176088440'; // Remove + for WhatsApp API
    const message = encodeURIComponent(
      '¡Hola! Me interesa conocer más sobre sus perfumes y fragancias. ¿Podrían ayudarme?'
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSearch = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (name)
        `
        )
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setSearchResults([]);
    }
  };

  const handleSearchInputChange = e => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleProductClick = productId => {
    navigate(`/products/${productId}`);
    setSearchQuery('');
    setIsSearchOpen(false);
    setSearchResults([]);
  };

  const handleSuggestionClick = suggestion => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Simple cookie consent banner (first-time visitors)
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    try {
      return localStorage.getItem('cookie_consent') !== '1';
    } catch {
      return true;
    }
  });
  const acceptCookies = () => {
    try {
      localStorage.setItem('cookie_consent', '1');
    } catch {}
    setShowCookieBanner(false);
  };

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleSignupClick = () => {
    setIsSignupOpen(true);
    setIsProfileDropdownOpen(false);
  };

  const handleLoginClick = () => {
    setIsLoginOpen(true);
    setIsProfileDropdownOpen(false);
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
    setLoginForm({ email: '', password: '', rememberMe: false });
    setFormError('');
    setSuccessMessage('');
    // If user cancels login, send them back to the page they came from
    try {
      const prev = sessionStorage.getItem('redirect_prev_path');
      if (prev) {
        sessionStorage.removeItem('redirect_prev_path');
        navigate(prev);
      }
    } catch {}
  };

  const handleSignupClose = () => {
    setIsSignupOpen(false);
    setSignupForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    });
    setFormError('');
    setSuccessMessage('');
  };

  const handleSignupSubmit = async e => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    if (signupForm.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!signupForm.terms) {
      setFormError('Debes aceptar los términos y condiciones');
      return;
    }

    const { success, error } = await signUp(
      signupForm.email,
      signupForm.password,
      signupForm.name
    );
    if (!success) {
      setFormError(error?.message || 'Error al registrar');
      return;
    }
    setConfirmationEmail(signupForm.email);
    setShowEmailConfirmation(true);
    showToast('Cuenta creada. Verifica tu email.', 'success');
  };

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setFormError('');
    const { success, error } = await signIn(
      loginForm.email,
      loginForm.password
    );
    if (!success) {
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('verify') || msg.includes('confirm')) {
        setConfirmationEmail(loginForm.email);
        setShowEmailConfirmation(true);
      }
      setFormError(error?.message || 'Error al iniciar sesión');
      return;
    }
    // redirect after auth if present
    try {
      const redirectTo = sessionStorage.getItem('redirect_after_auth');
      if (redirectTo) {
        sessionStorage.removeItem('redirect_after_auth');
        navigate(redirectTo);
      }
    } catch {}
    setIsLoginOpen(false);
    showToast('¡Bienvenido de nuevo!', 'success');
  };

  const handleSignout = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    showToast('Cerraste sesión', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header (hidden on admin) */}
      {!isAdminPage && (
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isHomePage
              ? isScrolled
                ? 'bg-[#a10009]/95 backdrop-blur-md shadow-lg'
                : 'bg-transparent'
              : 'bg-[#a10009]/95 backdrop-blur-md shadow-lg'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img src={logo} alt="5thAvenue" className="h-20 w-auto" />
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-2">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/'
                      ? 'bg-[#a10009] text-white shadow-lg'
                      : isHomePage
                        ? isScrolled
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Inicio
                </Link>
                <Link
                  to="/products"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/products'
                      ? 'bg-[#a10009] text-white shadow-lg'
                      : isHomePage
                        ? isScrolled
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Productos
                </Link>
                <Link
                  to="/arabic"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/arabic'
                      ? 'bg-[#a10009] text-white shadow-lg'
                      : isHomePage
                        ? isScrolled
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Árabes
                </Link>
                <Link
                  to="/stores"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/stores'
                      ? 'bg-[#a10009] text-white shadow-lg'
                      : isHomePage
                        ? isScrolled
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Tiendas
                </Link>
              </nav>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isHomePage
                      ? isScrolled
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  aria-label="Buscar productos"
                >
                  <Search className="w-6 h-6" />
                </button>

                <button
                  onClick={toggleCart}
                  className={`p-2 rounded-full transition-all duration-300 relative ${
                    isHomePage
                      ? isScrolled
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {cartItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#a10009] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                      {cartItemCount()}
                    </span>
                  )}
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`md:hidden p-2 rounded-full transition-all duration-300 ${
                    isHomePage
                      ? isScrolled
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  aria-label="Menú móvil"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>

                <div
                  className="relative hidden md:block"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={toggleProfileDropdown}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      isHomePage
                        ? isScrolled
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-black/20 backdrop-blur-md text-white hover:bg-black/30'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    aria-label="Perfil de usuario"
                  >
                    {user ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span
                          className={`font-semibold ${isScrolled ? 'text-black' : 'text-white'}`}
                        >
                          {user.user_metadata?.full_name
                            ?.substring(0, 2)
                            ?.toUpperCase() ||
                            user.email?.substring(0, 2)?.toUpperCase() ||
                            'U'}
                        </span>
                      </div>
                    ) : (
                      <User
                        className={`w-6 h-6 ${isScrolled ? 'text-black' : 'text-white'}`}
                      />
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#a10009] rounded-lg shadow-xl border border-[#a10009] py-1 z-50">
                      {user ? (
                        <>
                          <div className="px-4 py-2 text-sm text-white/80 border-b border-white/20">
                            <div className="font-medium">
                              {user.user_metadata?.full_name || 'Usuario'}
                            </div>
                            <div className="text-xs opacity-75">
                              {user.email}
                            </div>
                          </div>
                          <button
                            onClick={handleSignout}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white hover:text-[#a10009] transition-colors duration-200"
                          >
                            Cerrar Sesión
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleLoginClick}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white hover:text-[#a10009] transition-colors duration-200"
                          >
                            Iniciar Sesión
                          </button>
                          <div className="border-t border-white/20 my-1"></div>
                          <button
                            onClick={handleSignupClick}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white hover:text-[#a10009] transition-colors duration-200"
                          >
                            Crear Cuenta
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Side Panel */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Side Panel */}
          <div className="md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Menú</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-6">
                <div className="space-y-4">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                      location.pathname === '/'
                        ? 'bg-[#a10009] text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Inicio
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                      location.pathname === '/products'
                        ? 'bg-[#a10009] text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Productos
                  </Link>
                  <Link
                    to="/arabic"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                      location.pathname === '/arabic'
                        ? 'bg-[#a10009] text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Árabes
                  </Link>
                  <Link
                    to="/stores"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                      location.pathname === '/stores'
                        ? 'bg-[#a10009] text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Tiendas
                  </Link>
                </div>
              </nav>

              {/* Actions Section */}
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-3">
                  {/* Search Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center w-full px-4 py-4 rounded-lg text-lg font-medium text-gray-800 hover:bg-gray-100 transition-all duration-300"
                  >
                    <Search className="w-6 h-6 mr-3" />
                    Buscar Productos
                  </button>

                  {/* Cart Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      toggleCart();
                    }}
                    className="flex items-center w-full px-4 py-4 rounded-lg text-lg font-medium text-gray-800 hover:bg-gray-100 transition-all duration-300 relative"
                  >
                    <ShoppingBag className="w-6 h-6 mr-3" />
                    Carrito
                    {cartItemCount() > 0 && (
                      <span className="ml-auto bg-[#a10009] text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-medium">
                        {cartItemCount()}
                      </span>
                    )}
                  </button>

                  {/* Profile Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (user) {
                        toggleProfileDropdown();
                      } else {
                        handleLoginClick();
                      }
                    }}
                    className="flex items-center w-full px-4 py-4 rounded-lg text-lg font-medium text-gray-800 hover:bg-gray-100 transition-all duration-300"
                  >
                    <User className="w-6 h-6 mr-3" />
                    {user ? 'Mi Perfil' : 'Iniciar Sesión'}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="text-center text-gray-600 text-sm">
                  <p>5th Avenue</p>
                  <p className="mt-1">Perfumes de Lujo</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Floating WhatsApp Button - Mobile Only (hidden on admin) */}
      {!isAdminPage && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleWhatsAppClick}
            className="bg-[#a10009] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative"
            aria-label="Contactar por WhatsApp"
          >
            <img src={whatsappIcon} alt="WhatsApp" className="w-8 h-8" />
            {/* Notification Badge */}
            <div className="absolute -top-2 -right-2 bg-[#a10009] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              1
            </div>
          </button>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white shadow-2xl w-full max-w-2xl mx-auto md:mt-20"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Buscar Productos
                </h2>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Buscar perfumes, fragancias, marcas..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors pr-12"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#a10009]"></div>
                    </div>
                  )}
                </div>
              </form>

              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Resultados de búsqueda
                      </h3>
                      <div className="space-y-2">
                        {searchResults.map(product => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">
                                    IMG
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 truncate">
                                {product.name}
                              </h4>
                              {product.categories && (
                                <p className="text-sm text-gray-600 truncate">
                                  {product.categories.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-[#a10009]">
                                {new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                })
                                  .format(product.price)
                                  .replace(',', '.')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No se encontraron productos
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Popular Searches */}
              {!searchQuery && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">
                      Búsquedas populares
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={closeCart} />
      {/* Add-to-cart Modal */}
      <AddToCartModal />

      {/* Signup Modal */}
      {isSignupOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Crear Cuenta
                </h2>
                <button
                  onClick={handleSignupClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={signupForm.name}
                    onChange={e =>
                      setSignupForm({ ...signupForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={signupForm.email}
                    onChange={e =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={signupForm._showPw ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={signupForm.password}
                      onChange={e =>
                        setSignupForm({
                          ...signupForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors pr-10"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSignupForm(s => ({ ...s, _showPw: !s._showPw }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    >
                      <img
                        src={signupForm._showPw ? seyeIcon : eyeIcon}
                        alt={signupForm._showPw ? 'Ocultar' : 'Mostrar'}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={signupForm._showPw2 ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={e =>
                        setSignupForm({
                          ...signupForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors pr-10"
                      placeholder="Repite tu contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSignupForm(s => ({ ...s, _showPw2: !s._showPw2 }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    >
                      <img
                        src={signupForm._showPw2 ? seyeIcon : eyeIcon}
                        alt={signupForm._showPw2 ? 'Ocultar' : 'Mostrar'}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    checked={signupForm.terms}
                    onChange={e =>
                      setSignupForm({ ...signupForm, terms: e.target.checked })
                    }
                    className="h-4 w-4 text-[#a10009] focus:ring-[#a10009] border-gray-300 rounded"
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Acepto los{' '}
                    <a href="#" className="text-[#a10009] hover:underline">
                      términos y condiciones
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#a10009] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#8a0008] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      setIsSignupOpen(false);
                      setIsLoginOpen(true);
                    }}
                    className="text-[#a10009] hover:underline font-medium"
                  >
                    Iniciar Sesión
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Iniciar Sesión
                </h2>
                <button
                  onClick={handleLoginClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              {activeAuthTab === 'reset' ? (
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setFormError('');
                    try {
                      const email = loginForm.email || signupForm.email;
                      if (!email) {
                        setFormError('Ingresa tu correo para enviar el enlace');
                        return;
                      }
                      await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + '/?login=1',
                      });
                      setSuccessMessage(
                        'Hemos enviado un enlace para restablecer tu contraseña.'
                      );
                    } catch (err) {
                      setFormError(
                        err?.message ||
                          'No se pudo enviar el correo de restablecimiento'
                      );
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={loginForm.email || signupForm.email}
                      onChange={e =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#a10009] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#8a0008] transition-colors"
                  >
                    Enviar enlace de restablecimiento
                  </button>
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      className="text-[#a10009] hover:underline"
                      onClick={() => setActiveAuthTab('login')}
                    >
                      Volver a iniciar sesión
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="loginEmail"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="loginEmail"
                      name="loginEmail"
                      value={loginForm.email}
                      onChange={e =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="loginPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={loginForm._showPw ? 'text' : 'password'}
                        id="loginPassword"
                        name="loginPassword"
                        value={loginForm.password}
                        onChange={e =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors pr-10"
                        placeholder="Ingresa tu contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLoginForm(s => ({ ...s, _showPw: !s._showPw }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      >
                        <img
                          src={loginForm._showPw ? seyeIcon : eyeIcon}
                          alt={loginForm._showPw ? 'Ocultar' : 'Mostrar'}
                          className="w-5 h-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        checked={loginForm.rememberMe}
                        onChange={e =>
                          setLoginForm({
                            ...loginForm,
                            rememberMe: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-[#a10009] focus:ring-[#a10009] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Recordarme
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-[#a10009] hover:underline"
                      onClick={() => setActiveAuthTab('reset')}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#a10009] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#8a0008] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      setIsLoginOpen(false);
                      setIsSignupOpen(true);
                    }}
                    className="text-[#a10009] hover:underline font-medium"
                  >
                    Crear Cuenta
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <EmailConfirmationMessage
          email={confirmationEmail}
          onClose={() => setShowEmailConfirmation(false)}
          onResend={async () => {
            setVerifyStatus({ type: null, text: '' });
            setVerifySending(true);
            try {
              const { error } = await supabase.auth.resend({
                type: 'signup',
                email: confirmationEmail,
              });
              if (error) throw error;
              setVerifyStatus({
                type: 'success',
                text: 'Correo reenviado. Revisa tu bandeja.',
              });
              showToast('Correo de verificación reenviado', 'success');
            } catch (e) {
              setVerifyStatus({
                type: 'error',
                text: e?.message || 'No se pudo reenviar. Intenta nuevamente.',
              });
              showToast('No se pudo reenviar el correo', 'error');
            } finally {
              setVerifySending(false);
            }
          }}
          isSending={verifySending}
          statusType={verifyStatus.type}
          statusText={verifyStatus.text}
        />
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Restablecer contraseña
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowResetModal(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {resetError && (
                <div className="mb-3 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                  {resetError}
                </div>
              )}
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setResetError('');
                  if (resetForm.password.length < 8) {
                    setResetError(
                      'La contraseña debe tener al menos 8 caracteres'
                    );
                    return;
                  }
                  setResetLoading(true);
                  try {
                    const { error } = await supabase.auth.updateUser({
                      password: resetForm.password,
                    });
                    if (error) throw error;
                    setShowResetModal(false);
                    setResetForm({ password: '', confirm: '' });
                    showToast('Contraseña actualizada', 'success');
                    setIsLoginOpen(true);
                    setActiveAuthTab('login');
                  } catch (err) {
                    setResetError(
                      err?.message || 'No se pudo actualizar la contraseña'
                    );
                  } finally {
                    setResetLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={resetForm._show ? 'text' : 'password'}
                      value={resetForm.password}
                      onChange={e =>
                        setResetForm({ ...resetForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] pr-10"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setResetForm(s => ({ ...s, _show: !s._show }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    >
                      <img
                        src={resetForm._show ? seyeIcon : eyeIcon}
                        alt={resetForm._show ? 'Ocultar' : 'Mostrar'}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#a10009] text-white py-3 rounded-lg font-medium hover:bg-[#8a0008] disabled:opacity-60"
                >
                  {resetLoading ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer (hidden on admin) */}
      {!isAdminPage && (
        <footer className="bg-[#a10009] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="mb-0">
                  <img src={logo} alt="5thAvenue" className="h-32 w-auto" />
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Perfumes y fragancias premium para el cliente exigente. Aromas
                  de lujo que cuentan tu historia.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">
                  Enlaces Rápidos
                </h4>
                <ul className="space-y-3 text-sm text-white/80">
                  <li>
                    <Link
                      to="/products"
                      className="hover:text-white transition-colors"
                    >
                      Productos
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/stores"
                      className="hover:text-white transition-colors"
                    >
                      Tiendas
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="hover:text-white transition-colors"
                    >
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">
                  Servicio al Cliente
                </h4>
                <ul className="space-y-3 text-sm text-white/80">
                  <li>
                    <Link
                      to="/shipping"
                      className="hover:text-white transition-colors"
                    >
                      Información de Envío
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/returns"
                      className="hover:text-white transition-colors"
                    >
                      Devoluciones
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="hover:text-white transition-colors"
                    >
                      Preguntas Frecuentes
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/return-and-refund-policy"
                      className="hover:text-white transition-colors"
                    >
                      Política de Reembolsos
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">
                  Legal
                </h4>
                <ul className="space-y-3 text-sm text-white/80">
                  <li>
                    <Link
                      to="/privacy"
                      className="hover:text-white transition-colors"
                    >
                      Política de Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="hover:text-white transition-colors"
                    >
                      Términos y Condiciones
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/cookies-policy"
                      className="hover:text-white transition-colors"
                    >
                      Política de Cookies
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/20 mt-1 pt-5 text-center text-sm text-white/80">
              <p>
                &copy; {new Date().getFullYear()} 5thAvenue. Todos los derechos
                reservados.
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Cookie consent banner */}
      {showCookieBanner && !isAdminPage && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto max-w-3xl z-50">
          <div className="bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 text-sm">
              Usamos cookies para mejorar tu experiencia. Consulta nuestra{' '}
              <Link to="/cookies-policy" className="text-[#a10009] font-medium">
                Política de Cookies
              </Link>
              .
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptCookies}
                className="px-4 py-2 rounded-lg bg-[#a10009] text-white font-medium hover:bg-[#8a0008]"
              >
                Aceptar
              </button>
              <Link
                to="/cookies-policy"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Más info
              </Link>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ open: false, type: 'success', message: '' })}
        accent="#a10009"
      />
    </div>
  );
};

export default Layout;
