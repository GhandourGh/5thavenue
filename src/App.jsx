import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ui/ScrollToTop';
import LoadingOverlay from './components/ui/LoadingOverlay';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Promos from './pages/Promos';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Payment from './pages/Payment';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ReturnRefund from './pages/ReturnRefund';
import CookiesPolicy from './pages/CookiesPolicy';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
// Removed protected routes while resetting user login/cart logic

function AppContent() {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/stores" element={<About />} />
                <Route path="/arabic" element={<Promos />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                {/* Confirmation route removed per request */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route
                  path="/return-and-refund-policy"
                  element={<ReturnRefund />}
                />
                <Route path="/cookies-policy" element={<CookiesPolicy />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <Admin />
                    </ProtectedAdminRoute>
                  }
                />
                {/* Add more routes as needed */}
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </Router>
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}

export default App;
