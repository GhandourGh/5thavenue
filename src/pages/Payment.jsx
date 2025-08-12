import React, { useState, useEffect } from 'react';
import { setPageSEO } from '../utils/seo';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { db } from '../services/supabase';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  User,
  ChevronRight,
  ChevronDown,
  MapPin,
  Mail,
  MessageSquare,
  Save,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/helpers';
import { calculatePaymentTotal, WOMPI_CONFIG } from '../utils/paymentUtils';

// Import payment network icons
import visaIcon from '../assets/icons/visa.svg';
import amexIcon from '../assets/icons/amex.svg';
import discoverIcon from '../assets/icons/discover.svg';
import creditIcon from '../assets/icons/credit.svg';
import pseIcon from '../assets/icons/pse.svg';
import nequiIcon from '../assets/icons/nequi.svg';
import cardIcon from '../assets/icons/card.svg';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartTotal, clearCart } = useCart();
  const passedOrder = location.state?.order || null;

  const [status, setStatus] = useState('idle'); // idle|initiated|pending|succeeded|failed|expired|cancelled
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWompiWidget, setShowWompiWidget] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  useEffect(() => {
    setPageSEO({
      title: 'Pago | 5thAvenue',
      description:
        'Realiza tu transferencia bancaria de forma segura en 5thAvenue.',
      canonicalPath: '/payment',
      robots: 'noindex',
    });
  }, []);

  // Customer information state (hydrate from order if present)
  const [customerInfo, setCustomerInfo] = useState({
    fullName: passedOrder?.customer?.full_name || '',
    email: passedOrder?.customer?.email || '',
    phone: passedOrder?.customer?.phone || '',
    city: passedOrder?.shipping_address?.city || '',
    postalCode: passedOrder?.shipping_address?.postalCode || '',
    streetAddress: passedOrder?.shipping_address?.street || '',
    apartment: passedOrder?.shipping_address?.apartment || '',
    deliveryNote: '',
  });

  useEffect(() => {
    if (!passedOrder) return;
    setCustomerInfo({
      fullName: passedOrder?.customer?.full_name || '',
      email: passedOrder?.customer?.email || '',
      phone: passedOrder?.customer?.phone || '',
      city: passedOrder?.shipping_address?.city || '',
      postalCode: passedOrder?.shipping_address?.postalCode || '',
      streetAddress: passedOrder?.shipping_address?.street || '',
      apartment: passedOrder?.shipping_address?.apartment || '',
      deliveryNote: '',
    });
  }, [passedOrder]);

  // Edit mode states
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Handle edit mode
  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  // Handle save
  const handleSave = field => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: editValue,
    }));
    setEditingField(null);
    setEditValue('');
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const formatPrice = price => formatCOP(price);

  const handlePaymentSubmit = async e => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg('');
    try {
      // Calculate payment breakdown with fees
      const breakdown = calculatePaymentTotal(
        passedOrder?.subtotal || cartTotal(),
        passedOrder?.shipping_cost || 0
      );
      setPaymentBreakdown(breakdown);

      // Show Wompi widget
      setStatus('initiated');
      setShowWompiWidget(true);
    } catch (err) {
      console.error('Wompi payment init failed', err);
      setErrorMsg('No se pudo iniciar el pago. Inténtalo nuevamente.');
      setStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // For Wompi payments, we handle the widget display
  useEffect(() => {
    if (status === 'initiated' && showWompiWidget) {
      // Show Wompi payment widget
      setStatus('awaiting_payment');
    }
  }, [status, showWompiWidget]);

  // Finalize successful payments (for manual verification)
  useEffect(() => {
    const finalize = async () => {
      try {
        if (!passedOrder) return;
        await db.updateOrderStatus(passedOrder.id, {
          status: 'paid',
          is_verified: true,
        });
        if (passedOrder.items && Array.isArray(passedOrder.items)) {
          await db.decrementProductQuantities(passedOrder.items);
        }
        // Email (non-blocking)
        supabase.functions
          .invoke('resend-email', { body: { order: passedOrder } })
          .catch(() => {});
        clearCart();
        setShowSuccess(true);
      } catch (e) {
        console.error('Finalize error', e);
        setErrorMsg(
          'Se procesó el pago, pero hubo un problema finalizando el pedido. Contacto soporte.'
        );
      }
    };
    if (status === 'succeeded') finalize();
  }, [status, passedOrder, clearCart]);

  const subtotal =
    typeof passedOrder?.subtotal === 'number'
      ? passedOrder.subtotal
      : cartTotal();
  const shipping =
    typeof passedOrder?.shipping_cost === 'number'
      ? passedOrder.shipping_cost
      : 0;
  const total =
    typeof passedOrder?.total === 'number'
      ? passedOrder.total
      : subtotal + shipping;

  const isWaiting =
    isProcessing || status === 'initiated' || status === 'pending';

  // Ensure viewport is at top when success screen shows (mobile friendly)
  useEffect(() => {
    if (showSuccess) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [showSuccess]);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-6 pb-6">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-sm sm:max-w-md md:max-w-2xl w-full mx-3 sm:mx-4 mt-12">
          <div className="text-center">
            <CheckCircle
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Pago Exitoso!
            </h2>
            <p className="text-gray-800 font-semibold mb-1">
              ¡Gracias por tu compra!
            </p>
            <p className="text-gray-600 mb-6">
              Tu orden ha sido procesada correctamente. Recibirás un email de
              confirmación.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-green-800 mb-2">
                <strong>Pedido:</strong> {passedOrder?.order_number}
              </p>
              <p className="text-sm text-green-800 mb-2">
                <strong>Total pagado:</strong>{' '}
                {formatPrice(passedOrder?.total || total)}
              </p>
              <p className="text-sm text-green-800">
                <strong>Pago:</strong> Wompi (Verificado)
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-left mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Artículos
              </h3>
              <div className="max-h-56 overflow-auto divide-y divide-gray-100">
                {(passedOrder?.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate pr-2">
                      {it.name || it.product_id} × {it.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice((it.price || 0) * (it.quantity || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Address accordion */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 text-left">
              <button
                type="button"
                onClick={() => setShowAddress(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800"
              >
                Dirección de envío
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAddress ? 'rotate-180' : ''}`}
                />
              </button>
              {showAddress && (
                <div className="px-4 pb-4 text-sm text-gray-700 space-y-1">
                  <p>
                    {passedOrder?.shipping_address?.street}
                    {passedOrder?.shipping_address?.apartment
                      ? `, Apt ${passedOrder.shipping_address.apartment}`
                      : ''}
                  </p>
                  <p>
                    {passedOrder?.shipping_address?.city}
                    {passedOrder?.shipping_address?.department
                      ? `, ${passedOrder.shipping_address.department}`
                      : ''}
                  </p>
                  {passedOrder?.customer?.phone && (
                    <p>Tel: {passedOrder.customer.phone}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                onClick={() => navigate('/products')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Seguir comprando
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-4 py-2 rounded-lg bg-[#a10009] text-white hover:bg-[#8a0008] w-full sm:w-auto"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed / expired / cancelled screens
  if (['failed', 'expired', 'cancelled'].includes(status)) {
    const label =
      status === 'failed'
        ? 'Pago rechazado'
        : status === 'expired'
          ? 'Pago vencido'
          : 'Pago cancelado';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              !
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{label}</h2>
            <p className="text-gray-600 mb-6">
              {errorMsg || 'Tu pago no pudo ser procesado.'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 rounded-lg bg-[#a10009] text-white hover:bg-[#8a0008]"
              >
                Reintentar pago con BOLD
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Volver al Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Opción de Pago
            </h1>
            <div className="flex items-center text-green-600">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Pago Seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Summary - Horizontal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-[#a10009]" />
            Resumen del Pedido
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products List */}
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 mr-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">IMG</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate text-sm">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <span className="font-semibold text-[#a10009] text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Envío:</span>
                  <span className="font-semibold text-green-600">
                    {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-[#a10009]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-[#a10009]" />
            Información del Cliente
          </h2>

          <div className="space-y-4">
            {/* Customer Name */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  {editingField === 'fullName' ? (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Ingresa tu nombre completo"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave('fullName')}
                          disabled={!editValue.trim()}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-800">
                      {customerInfo.fullName || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>
              {editingField !== 'fullName' && (
                <button
                  onClick={() => handleEdit('fullName', customerInfo.fullName)}
                  className="text-sm text-[#a10009] hover:text-[#8a0008] font-medium"
                >
                  Cambiar
                </button>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  {editingField === 'email' ? (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="email"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Ingresa tu email"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave('email')}
                          disabled={
                            !editValue.includes('@') || !editValue.includes('.')
                          }
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-800">
                      {customerInfo.email || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>
              {editingField !== 'email' && (
                <button
                  onClick={() => handleEdit('email', customerInfo.email)}
                  className="text-sm text-[#a10009] hover:text-[#8a0008] font-medium"
                >
                  Cambiar
                </button>
              )}
            </div>

            {/* Delivery Location */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Dirección de Entrega</p>
                  {editingField === 'address' ? (
                    <div className="mt-2">
                      <div className="space-y-2 mb-2">
                        <input
                          type="text"
                          placeholder="Ingresa la dirección de entrega"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave('streetAddress')}
                          disabled={!editValue.trim()}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-800">
                      {customerInfo.streetAddress ? (
                        <>
                          {customerInfo.streetAddress}
                          {customerInfo.apartment &&
                            `, ${customerInfo.apartment}`}
                          <br />
                          {customerInfo.city && `${customerInfo.city}`}
                          {customerInfo.postalCode &&
                            ` - ${customerInfo.postalCode}`}
                        </>
                      ) : (
                        'No especificada'
                      )}
                    </p>
                  )}
                </div>
              </div>
              {editingField !== 'address' && (
                <button
                  onClick={() =>
                    handleEdit('address', customerInfo.streetAddress)
                  }
                  className="text-sm text-[#a10009] hover:text-[#8a0008] font-medium"
                >
                  Cambiar
                </button>
              )}
            </div>

            {/* Delivery Note */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Nota de Entrega</p>
                  {editingField === 'deliveryNote' ? (
                    <div className="mt-2">
                      <div className="space-y-2 mb-2">
                        <textarea
                          placeholder="Agregar nota de entrega (opcional)"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] resize-none transition-colors"
                          rows="3"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave('deliveryNote')}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-800">
                      {customerInfo.deliveryNote || 'Sin nota adicional'}
                    </p>
                  )}
                </div>
              </div>
              {editingField !== 'deliveryNote' && (
                <button
                  onClick={() =>
                    handleEdit('deliveryNote', customerInfo.deliveryNote)
                  }
                  className="text-sm text-[#a10009] hover:text-[#8a0008] font-medium"
                >
                  Cambiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Gateway */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-gray-600">Pago Seguro</p>
                      <div className="flex items-center space-x-2">
                        <img src={cardIcon} alt="Card" className="h-8 w-8" />
                        <span className="text-lg font-semibold text-gray-800">
                          Wompi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scrolling Payment Network Icons */}
                  <div className="relative overflow-hidden w-48">
                    <div className="flex items-center space-x-3 animate-scroll">
                      <img
                        src={visaIcon}
                        alt="Visa"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={amexIcon}
                        alt="American Express"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={discoverIcon}
                        alt="Discover"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={creditIcon}
                        alt="Credit Card"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={pseIcon}
                        alt="PSE"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={nequiIcon}
                        alt="Nequi"
                        className="w-6 h-6 object-contain"
                      />
                      {/* Duplicate icons for seamless loop */}
                      <img
                        src={visaIcon}
                        alt="Visa"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={amexIcon}
                        alt="American Express"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={discoverIcon}
                        alt="Discover"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={creditIcon}
                        alt="Credit Card"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={pseIcon}
                        alt="PSE"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={nequiIcon}
                        alt="Nequi"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={visaIcon}
                        alt="Visa"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={amexIcon}
                        alt="American Express"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={discoverIcon}
                        alt="Discover"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={creditIcon}
                        alt="Credit Card"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={pseIcon}
                        alt="PSE"
                        className="w-6 h-6 object-contain"
                      />
                      <img
                        src={nequiIcon}
                        alt="Nequi"
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    {/* Fade effects */}
                    <div className="absolute left-0 top-0 w-6 h-6 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 w-6 h-6 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-6">
                {!showWompiWidget ? (
                  <>
                    <div className="text-center mb-8">
                      <p className="text-gray-700 text-lg">
                        Paga de forma <strong>segura y rápida</strong> con
                        tarjetas, PSE o Nequi
                      </p>
                    </div>

                    {/* Payment Breakdown */}
                    {paymentBreakdown && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <h4 className="font-bold text-gray-800 mb-4">
                          Desglose del Pago
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">
                              {formatPrice(paymentBreakdown.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Envío:</span>
                            <span className="font-semibold">
                              {formatPrice(paymentBreakdown.shipping)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Comisión Wompi:
                            </span>
                            <span className="font-semibold">
                              {formatPrice(paymentBreakdown.fees)}
                            </span>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-800">
                                Total:
                              </span>
                              <span className="font-bold text-xl text-[#a10009]">
                                {formatPrice(paymentBreakdown.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security Section */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-[#a10009]" />
                          <span className="font-semibold text-[#a10009]">
                            Pago 100% seguro
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            💳 🏦 📱
                          </span>
                          <span className="text-sm text-gray-600">
                            Múltiples métodos
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                      <h4 className="font-bold text-gray-800 mb-4">
                        Métodos de Pago Disponibles
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(WOMPI_CONFIG.paymentMethods).map(
                          ([key, method]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                            >
                              <img
                                src={cardIcon}
                                alt="Card"
                                className="w-6 h-6"
                              />
                              <div>
                                <p className="font-semibold text-sm">
                                  {method.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {method.description}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handlePaymentSubmit}
                      disabled={isWaiting}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                        isWaiting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#a10009] text-white hover:bg-[#8a0008] shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                      }`}
                    >
                      {isWaiting ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center mb-1">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Procesando...
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 mr-2" />
                          Continuar con Wompi
                        </div>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Wompi Payment Widget */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Pago Seguro con Wompi
                      </h3>
                      <p className="text-gray-600">
                        Completa tu pago de forma segura
                      </p>
                    </div>

                    {/* Wompi Widget Placeholder */}
                    <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <img src={cardIcon} alt="Card" className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-gray-800 mb-2">
                          Widget de Wompi
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Aquí se integrará el widget de pago de Wompi
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                          <p>
                            <strong>Configuración necesaria:</strong>
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Crear cuenta en Wompi</li>
                            <li>Obtener API credentials</li>
                            <li>Integrar SDK de Wompi</li>
                            <li>Configurar webhooks</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Back Button */}
                    <button
                      onClick={() => setShowWompiWidget(false)}
                      className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Volver
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
