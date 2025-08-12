import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  MapPin,
  Truck,
  CreditCard,
  Shield,
  CheckCircle,
  ArrowLeft,
  LogIn,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/helpers';
import { db } from '../services/supabase';
import { supabase } from '../services/supabase';
import { setPageSEO } from '../utils/seo';
import { useAuth } from '../context/AuthContext';
import { isCodAllowedLocation, COD_DISABLED_MESSAGE } from '../utils/config';

// Import payment method icons
import codIcon from '../assets/icons/cod.svg';
import cardIcon from '../assets/icons/card.svg';

// Import banner
import banner1 from '../assets/images/banner1.webp';

// Country calling codes and Colombian locations will be fetched from public APIs with local cache fallbacks.

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState('+57');
  const [nationalPhone, setNationalPhone] = useState('');
  const [countryCodes, setCountryCodes] = useState([
    { code: '+57', label: 'Colombia (+57)' },
  ]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const { cart, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [formData, setFormData] = useState({
    // Customer Information
    fullName: '',
    email: '',
    phone: '',

    // Shipping Address
    city: '',
    department: '',
    streetAddress: '',
    apartment: '',

    // Shipping Method
    shippingMethod: 'standard',

    // Payment Method
    paymentMethod: 'wompi',

    // Promo Code
    promoCode: '',

    // Security
    agreeToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [codAllowed, setCodAllowed] = useState(false);
  const citySelectRef = useRef(null);
  const deptSelectRef = useRef(null);

  const availableCities = useMemo(() => {
    const base = formData.department
      ? cities.filter(c => c.department === formData.department)
      : cities;
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [cities, formData.department]);

  // Redirect if cart is empty and not showing confirmation modal
  useEffect(() => {
    if (cart.length === 0 && !showConfirmModal) {
      navigate('/products');
    }
  }, [cart, navigate, showConfirmModal]);

  // SEO
  useEffect(() => {
    setPageSEO({
      title: 'Checkout | 5thAvenue',
      description:
        'Finaliza tu compra de perfumes de forma segura en 5thAvenue.',
      canonicalPath: '/checkout',
      robots: 'noindex',
    });
  }, []);

  const formatPrice = price => formatCOP(price);

  // Ensure viewport goes to top when confirmation modal opens on mobile
  useEffect(() => {
    if (showConfirmModal) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [showConfirmModal]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Prefill name and email for logged-in users without blocking manual edits
  useEffect(() => {
    if (!user) return;
    const suggestedEmail = user?.email || '';
    const suggestedName = user?.user_metadata?.full_name || '';
    setFormData(prev => ({
      ...prev,
      email: prev.email || suggestedEmail,
      fullName: prev.fullName || suggestedName,
    }));
  }, [user]);

  // Initialize phone split into country code + national number
  useEffect(() => {
    if (!formData.phone) return;
    try {
      const match = String(formData.phone).match(/^\s*(\+\d{1,4})?\s*(.*)$/);
      const code = (match && match[1]) || countryCode;
      const rest = (match && match[2]) || '';
      setCountryCode(code || '+57');
      setNationalPhone(rest.trim());
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep combined phone in formData when pieces change
  // Auto-select department based on city selection
  useEffect(() => {
    const selected = cities.find(c => c.name === formData.city);
    if (selected && selected.department && !formData.department)
      setFormData(prev => ({ ...prev, department: selected.department }));
  }, [formData.city]);

  // Clear city if it does not belong to the selected department
  useEffect(() => {
    if (!formData.city || !formData.department) return;
    const entry = cities.find(c => c.name === formData.city);
    if (entry && entry.department !== formData.department) {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [formData.department, formData.city, cities]);

  // Determine COD availability based on current location and scope
  useEffect(() => {
    const allowed = isCodAllowedLocation({
      department: formData.department,
      city: formData.city,
    });
    setCodAllowed(allowed);
    // If COD selected but not allowed, switch to bold automatically while keeping COD visible
    if (formData.paymentMethod === 'cod' && !allowed) {
      setFormData(prev => ({ ...prev, paymentMethod: 'bold' }));
    }
  }, [formData.department, formData.city]);

  // Fetch country calling codes (fallback to minimal list; keep +57 default)
  useEffect(() => {
    let cancelled = false;
    const loadCodes = async () => {
      try {
        const res = await fetch(
          'https://restcountries.com/v3.1/all?fields=idd,name'
        );
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const parsed = data
          .map(c => {
            const root = c?.idd?.root || '';
            const suffixes = Array.isArray(c?.idd?.suffixes)
              ? c.idd.suffixes
              : [];
            const name = c?.name?.common || '';
            if (!root || suffixes.length === 0) return null;
            return suffixes.map(s => ({
              code: `${root}${s}`,
              label: `${name} (${root}${s})`,
            }));
          })
          .filter(Boolean)
          .flat()
          .sort((a, b) => a.label.localeCompare(b.label));
        // Ensure +57 is present and first
        const unique = [];
        const seen = new Set();
        for (const it of parsed) {
          if (!seen.has(it.code)) {
            seen.add(it.code);
            unique.push(it);
          }
        }
        const has57 = unique.some(x => x.code === '+57');
        const finalList = has57
          ? [
              { code: '+57', label: 'Colombia (+57)' },
              ...unique.filter(x => x.code !== '+57'),
            ]
          : [{ code: '+57', label: 'Colombia (+57)' }, ...unique];
        if (!cancelled) setCountryCodes(finalList);
      } catch {
        if (!cancelled)
          setCountryCodes([{ code: '+57', label: 'Colombia (+57)' }]);
      }
    };
    loadCodes();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Colombian departments and cities from public JSON (cached on GitHub). Deduplicate for clean UI.
  useEffect(() => {
    let cancelled = false;
    const loadCo = async () => {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json'
        );
        const data = await res.json();
        if (!Array.isArray(data)) return;
        // Departments
        const deptSet = new Set();
        for (const d of data) if (d?.departamento) deptSet.add(d.departamento);
        const deptList = Array.from(deptSet).sort((a, b) => a.localeCompare(b));
        // Cities (dedupe on department-name pair)
        const cityPairSet = new Set();
        const cityList = [];
        for (const d of data) {
          const dep = d?.departamento;
          for (const n of d?.ciudades || []) {
            const key = `${dep}__${n}`;
            if (!cityPairSet.has(key)) {
              cityPairSet.add(key);
              cityList.push({ name: n, department: dep });
            }
          }
        }
        cityList.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) {
          setDepartments(deptList);
          setCities(cityList);
        }
      } catch {
        // Fallback minimal values to keep the form working
        if (!cancelled) {
          setDepartments([
            'Antioquia',
            'Atlántico',
            'Bolívar',
            'Cundinamarca',
            'Valle del Cauca',
          ]);
          setCities([
            { name: 'Medellín', department: 'Antioquia' },
            { name: 'Barranquilla', department: 'Atlántico' },
            { name: 'Cartagena', department: 'Bolívar' },
            { name: 'Bogotá', department: 'Cundinamarca' },
            { name: 'Cali', department: 'Valle del Cauca' },
          ]);
        }
      }
    };
    loadCo();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const combined = `${countryCode} ${nationalPhone}`.trim();
    setFormData(prev => ({ ...prev, phone: combined }));
  }, [countryCode, nationalPhone]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Frontend validation
    const errors = {};
    const nameOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,}$/.test(
      String(formData.fullName || '').trim()
    );
    if (!nameOk) errors.fullName = 'Nombre inválido. Solo letras y espacios.';

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(formData.email || '').trim()
    );
    if (!emailOk) errors.email = 'Correo inválido.';

    const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
    const phoneOk = phoneDigits.length === 12 && phoneDigits.startsWith('573'); // +57 + 10 digits starting with 3
    if (!phoneOk)
      errors.phone =
        'Número colombiano inválido. Debe iniciar con +57 3 y tener 10 dígitos.';

    if (
      !String(formData.streetAddress || '').trim() ||
      String(formData.streetAddress || '').trim().length < 5
    ) {
      errors.streetAddress = 'Dirección muy corta.';
    }

    if (!String(formData.city || '').trim()) {
      errors.city = 'Ciudad/Municipio es requerido.';
    }
    if (!String(formData.department || '').trim()) {
      errors.department = 'Departamento es requerido.';
    }

    // postal code removed

    if (!String(formData.paymentMethod || '').trim()) {
      errors.paymentMethod = 'Selecciona un método de pago.';
    }

    // Enforce COD restriction by location
    if (formData.paymentMethod === 'cod' && !codAllowed) {
      errors.paymentMethod = COD_DISABLED_MESSAGE;
    }

    if (Object.keys(errors).length > 0) {
      // Focus first error
      const order = [
        'fullName',
        'email',
        'phone',
        'streetAddress',
        'city',
        'department',
        'postalCode',
        'paymentMethod',
      ];
      const first = order.find(k => errors[k]);
      if (first) {
        const el = document.querySelector(`[name="${first}"]`);
        if (el && typeof el.focus === 'function') el.focus();
      }
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    // Snapshot items (ensure product_id is included for stock decrement RPC)
    const items = cart.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url || null,
    }));

    const subtotal = cartTotal();
    const shipping_cost = shippingCost;
    const total = subtotal + shipping_cost;

    const isCardMethod = [
      'bold',
      'card',
      'credit',
      'visa',
      'amex',
      'discover',
    ].includes(String(formData.paymentMethod || '').toLowerCase());
    const status = isCardMethod ? 'awaiting_payment' : 'awaiting_payment';

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const genId = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const orderId = genId();

    const orderData = {
      id: orderId,
      order_number: orderNumber,
      status,
      payment_method: formData.paymentMethod,
      shipping_method: formData.shippingMethod,
      currency: 'COP',
      subtotal,
      shipping_cost,
      total,
      items,
      is_verified: isCardMethod ? true : false,
      customer: {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      },
      shipping_address: {
        city: formData.city,
        department: formData.department,
        street: formData.streetAddress,
        apartment: formData.apartment,
      },
      promo_code: formData.promoCode || null,
      source: 'web',
    };

    try {
      // 1) Upsert customer record by phone/name before order
      try {
        await db.upsertUserByPhone({
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
          address: {
            city: formData.city,
            street: formData.streetAddress,
            apartment: formData.apartment,
          },
        });
      } catch (uerr) {
        console.warn('User upsert failed (non-blocking):', uerr);
      }

      // Create order with a timeout fallback so UX never stalls
      const createPromise = db
        .createOrder(orderData)
        .catch(e => ({ error: e }));
      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => resolve({ timeout: true }), 5000)
      );
      const result = await Promise.race([createPromise, timeoutPromise]);
      if (result && result.error)
        console.error('Supabase createOrder error:', result.error);

      // Build local representation regardless of returning rows (RLS-safe)
      let created = { id: orderId, ...orderData };

      if (result && result.error) {
        // Persist locally for resilience (optional)
        try {
          const existingRaw = localStorage.getItem('demo_orders');
          const existing = Array.isArray(JSON.parse(existingRaw || '[]'))
            ? JSON.parse(existingRaw || '[]')
            : [];
          const next = [...existing, created];
          localStorage.setItem('demo_orders', JSON.stringify(next));
        } catch (storageErr) {
          console.warn('Could not persist local demo order:', storageErr);
        }
      }

      if (String(created.payment_method).toLowerCase() === 'wompi') {
        // For Wompi, go to processing/payment page and finalize after verification
        navigate('/payment', { state: { order: created } });
      } else {
        // COD and others: finalize immediately
        try {
          if (created && created.items && Array.isArray(created.items)) {
            await db.decrementProductQuantities(created.items);
          }
        } catch (decErr) {
          console.warn('Could not decrement product quantities:', decErr);
        }
        clearCart();
        setConfirmedOrder(created);
        setShowConfirmModal(true);
        // send confirmation email (non-blocking)
        supabase.functions
          .invoke('resend-email', { body: { order: created } })
          .catch(() => {});
      }
    } catch (err) {
      console.error('Error creating order (unexpected):', err);
      // Hard fallback: still show confirmation modal and send email with the local order object
      const tempOrder = {
        order_number: orderData.order_number,
        total: orderData.total,
        shipping_cost: orderData.shipping_cost,
        subtotal: orderData.subtotal,
        payment_method: orderData.payment_method,
        shipping_method: orderData.shipping_method,
        customer: orderData.customer,
        shipping_address: orderData.shipping_address,
        items: orderData.items,
      };
      setConfirmedOrder(tempOrder);
      setShowConfirmModal(true);
      supabase.functions
        .invoke('resend-email', { body: { order: tempOrder } })
        .catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingMethods = [
    {
      id: 'standard',
      name: 'Envío Estándar',
      price: 0,
      time: '3-6 días hábiles',
    },
    {
      id: 'express',
      name: 'Envío Express',
      price: 15000,
      time: '1-2 días hábiles',
    },
  ];

  const paymentMethods = [
    { id: 'wompi', name: 'Paga con Tarjeta / PSE / Nequi', icon: cardIcon },
    { id: 'cod', name: 'Contra Entrega', icon: codIcon },
  ];

  const subtotal = cartTotal();
  const shippingCost = formData.shippingMethod === 'express' ? 15000 : 0;
  const total = subtotal + shippingCost;

  if (cart.length === 0 && !showConfirmModal) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {/* Banner */}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-gray-600 mr-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600 ">Pago Seguro</span>
              {/* Optional login quick link */}
              <button
                type="button"
                onClick={() => {
                  try {
                    window.history.replaceState(
                      {},
                      document.title,
                      window.location.pathname + window.location.search
                    );
                  } catch {}
                  // Open login via query param handled in Layout.jsx
                  window.location.href = '/?login=1';
                }}
                className="ml-3 inline-flex items-center text-sm text-[#a10009] hover:text-[#8a0008]"
                title="Iniciar sesión (opcional)"
              >
                <LogIn className="w-4 h-4 mr-1" /> Iniciar sesión (opcional)
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img
          src={banner1}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Finalizar Compra
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Completa tu pedido de forma segura
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#a10009]" />
                  Información del Cliente
                </h2>
                <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-900">
                  Compra como <strong>invitado</strong>. Crear una cuenta es{' '}
                  <strong>opcional</strong> y puedes hacerlo después de tu
                  compra.
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={e =>
                        handleInputChange('fullName', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      required
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Teléfono
                    </label>
                    <div className="flex gap-2">
                      <div className="w-36">
                        <select
                          name="phoneCode"
                          value={countryCode}
                          onChange={e => setCountryCode(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors bg-white"
                          aria-label="Código de país"
                        >
                          {countryCodes.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        value={nationalPhone}
                        onChange={e => setNationalPhone(e.target.value)}
                        placeholder="300 123 4567"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Se marcará con {countryCode} por defecto.
                    </p>
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[#a10009]" />
                  Dirección de Envío
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento
                      </label>
                      <select
                        name="department"
                        ref={deptSelectRef}
                        value={formData.department}
                        onChange={e =>
                          handleInputChange('department', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors bg-white"
                        required
                      >
                        <option value="">Selecciona un departamento</option>
                        {departments.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.department && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors.department}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad/Municipio
                      </label>
                      <select
                        name="city"
                        ref={citySelectRef}
                        value={formData.city}
                        onChange={e =>
                          handleInputChange('city', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors bg-white"
                        required
                      >
                        <option value="">Selecciona una ciudad</option>
                        {availableCities.map((c, idx) => (
                          <option
                            key={`${c.department}-${c.name}-${idx}`}
                            value={c.name}
                          >
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.city && (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErrors.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={e =>
                        handleInputChange('streetAddress', e.target.value)
                      }
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      required
                    />
                    {fieldErrors.streetAddress && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.streetAddress}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartamento (opcional)
                      </label>
                      <input
                        name="apartment"
                        type="text"
                        value={formData.apartment}
                        onChange={e =>
                          handleInputChange('apartment', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                      />
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-[#a10009]" />
                  Método de Envío
                </h2>
                <div className="space-y-3">
                  {shippingMethods.map(method => (
                    <label
                      key={method.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={formData.shippingMethod === method.id}
                        onChange={e =>
                          handleInputChange('shippingMethod', e.target.value)
                        }
                        className="w-4 h-4 text-[#a10009] border-gray-300 focus:ring-[#a10009]"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">
                            {method.name}
                          </span>
                          <span className="font-semibold text-[#a10009]">
                            {method.price === 0
                              ? 'Gratis'
                              : formatPrice(method.price)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{method.time}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-[#a10009]" />
                  Método de Pago
                </h2>
                <div className="space-y-4">
                  {paymentMethods.map(method => {
                    const isCod = method.id === 'cod';

                    const codEnabled = isCod ? codAllowed : true;
                    return (
                      <label
                        key={method.id}
                        className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.paymentMethod === method.id
                            ? 'border-[#a10009] bg-red-50'
                            : 'border-gray-200 hover:border-[#a10009] hover:bg-red-50'
                        } ${isCod && !codEnabled ? 'opacity-60' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={e => {
                            if (isCod && !codEnabled) return;
                            handleInputChange('paymentMethod', e.target.value);
                          }}
                          className="w-5 h-5 text-[#a10009] border-gray-300 focus:ring-[#a10009] focus:ring-2"
                          disabled={isCod && !codEnabled}
                        />
                        <div className="ml-4 flex items-center flex-1">
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-50 rounded-xl mr-4">
                            <img
                              src={method.icon}
                              alt={method.name}
                              className="w-10 h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-gray-800">
                                {method.name}
                              </span>
                              {isCod && (
                                <span className="text-xs bg-[#a10009] text-white px-3 py-1 rounded-full font-medium">
                                  Local
                                </span>
                              )}
                            </div>
                            {isCod && !codEnabled && (
                              <p className="text-sm text-red-600 mt-2">
                                {COD_DISABLED_MESSAGE}
                              </p>
                            )}
                            {method.id === 'wompi' && (
                              <div className="mt-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <img
                                    src={cardIcon}
                                    alt="Card"
                                    className="w-4 h-4"
                                  />
                                  <span>Tarjetas de crédito y débito</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* COD Instructions Banner */}
                {formData.paymentMethod === 'cod' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold mb-1">
                      Instrucciones para Contra Entrega
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Te contactaremos por WhatsApp o llamada para confirmar
                        la dirección y el horario.
                      </li>
                      <li>
                        El pago se realiza en efectivo al recibir el pedido.
                      </li>
                      <li>Ten el monto preparado para agilizar la entrega.</li>
                      <li>
                        Si necesitas reprogramar, respóndenos por WhatsApp.
                      </li>
                    </ul>
                  </div>
                )}

                {/* Wompi Payment Instructions Banner */}
                {formData.paymentMethod === 'wompi' && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="font-semibold mb-1">Pago Seguro con Wompi</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Aceptamos tarjetas de crédito, débito y PSE.</li>
                      <li>Pago procesado de forma segura por Wompi.</li>
                      <li>Confirmación inmediata del pago.</li>
                      <li>Procesamiento automático de tu orden.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Security & Consent */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[#a10009]" />
                  Seguridad y Consentimiento
                </h2>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={e =>
                      handleInputChange('agreeToTerms', e.target.checked)
                    }
                    className="w-5 h-5 text-[#a10009] border-gray-300 rounded focus:ring-[#a10009] mt-1"
                    required
                  />
                  <label
                    htmlFor="agreeToTerms"
                    className="text-sm text-gray-700"
                  >
                    Acepto los{' '}
                    <Link
                      to="/terms"
                      className="text-[#a10009] hover:underline"
                    >
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link
                      to="/privacy"
                      className="text-[#a10009] hover:underline"
                    >
                      Política de Privacidad
                    </Link>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8 w-full">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-[#a10009]" />
                  Resumen del Pedido
                </h2>

                {/* Products List */}
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 mr-4">
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
                        <h3 className="font-semibold text-base text-gray-800 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-[#a10009] text-lg">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Promocional (opcional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.promoCode}
                      onChange={e =>
                        handleInputChange('promoCode', e.target.value)
                      }
                      placeholder="Ingresa tu código"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a10009] focus:border-[#a10009] transition-colors"
                    />
                    <button
                      type="button"
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Envío:</span>
                    <span className="font-semibold text-green-600">
                      {shippingCost === 0
                        ? 'Gratis'
                        : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-2xl font-bold text-[#a10009]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!formData.agreeToTerms || isSubmitting}
                  className="w-full bg-[#a10009] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#8a0008] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 sm:p-4"
          onClick={() => {
            setShowConfirmModal(false);
            clearCart();
            navigate('/products');
          }}
        >
          <div
            className="w-full max-w-sm sm:max-w-md md:max-w-2xl mx-3 sm:mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white">
                  ✓
                </span>
                <h3 className="text-lg font-semibold text-emerald-800">
                  ¡Pedido confirmado!
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  clearCart();
                  navigate('/products');
                }}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                ¡Gracias por tu compra! Te enviamos un correo con la
                confirmación y te contactaremos para coordinar la entrega.
              </div>
              <p className="text-sm text-gray-700">
                Número de orden:{' '}
                <span className="font-semibold">
                  {confirmedOrder?.order_number}
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Cliente
                  </h4>
                  <p className="text-sm text-gray-700">
                    {confirmedOrder?.customer?.full_name}
                  </p>
                  <p className="text-sm text-gray-700">
                    {confirmedOrder?.customer?.phone}
                  </p>
                  {confirmedOrder?.customer?.email && (
                    <p className="text-sm text-gray-700">
                      {confirmedOrder?.customer?.email}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Envío
                  </h4>
                  <p className="text-sm text-gray-700">
                    {confirmedOrder?.shipping_address?.street}
                    {confirmedOrder?.shipping_address?.apartment
                      ? `, Apt ${confirmedOrder.shipping_address.apartment}`
                      : ''}
                  </p>
                  <p className="text-sm text-gray-700">
                    {confirmedOrder?.shipping_address?.city}
                    {confirmedOrder?.shipping_address?.department
                      ? `, ${confirmedOrder.shipping_address.department}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Método:{' '}
                    {confirmedOrder?.shipping_method === 'express'
                      ? 'Express (1-2 días hábiles)'
                      : 'Estándar (3-6 días hábiles)'}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Artículos
                </h4>
                <div className="max-h-56 overflow-auto divide-y divide-gray-100">
                  {(confirmedOrder?.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-gray-900 truncate">
                          {it.name || it.product_id}
                        </p>
                        <p className="text-gray-600">Cant.: {it.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700">{formatPrice(it.price)}</p>
                        <p className="font-semibold">
                          {formatPrice((it.price || 0) * (it.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(confirmedOrder?.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span className="font-semibold">
                      {confirmedOrder?.shipping_cost === 0
                        ? 'Gratis'
                        : formatPrice(confirmedOrder?.shipping_cost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-emerald-700">
                      {formatPrice(confirmedOrder?.total || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Pago:{' '}
                    {String(confirmedOrder?.payment_method || '').toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    clearCart();
                    navigate('/products');
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    clearCart();
                    navigate('/products');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
