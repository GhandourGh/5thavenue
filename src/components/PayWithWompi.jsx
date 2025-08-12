import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import cardIcon from '../assets/icons/card.svg';

// Wompi brand configuration
const WOMPI_BRAND = {
  palette: {
    primary: {
      mint: '#B0F2AE',
      jungle: '#00825A',
      lime: '#DFFF61',
      sky: '#99D1FC',
    },
    neutral: { black: '#2C2A29', grayLight: '#FAFAFA' },
  },
  typography: {
    display: { size: 'clamp(28px, 5vw, 40px)', weight: 700 },
    h2: { size: 'clamp(22px, 3vw, 28px)', weight: 700 },
    body: { size: '16px', weight: 400, lineHeight: 1.6 },
    cta: { weight: 600, transform: 'none', case: 'sentence' },
  },
  microcopy: {
    security:
      'Pagos seguros con verificación 3D Secure y certificación PCI DSS.',
    fee_disclosure: 'Se agregará una comisión de procesamiento al total.',
    success: '¡Pago exitoso! Estamos confirmando tu transacción.',
    pending: 'Tu pago está en proceso. Te notificaremos en segundos.',
    failed:
      'No pudimos procesar tu pago. Intenta nuevamente o usa otro método.',
  },
};

const PayWithWompi = ({
  amountCOP,
  customerEmail,
  reference,
  currency = 'COP',
  onSuccess,
  onError,
  onCancel,
  enabledMethods = ['CARD', 'PSE', 'NEQUI'],
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [integritySignature, setIntegritySignature] = useState('');
  const wompiWidgetRef = useRef(null);

  // Environment configuration
  const isProduction = process.env.REACT_APP_WOMPI_ENV === 'prod';
  const publicKey =
    process.env.REACT_APP_WOMPI_PUBLIC_KEY || 'pub_test_1234567890';
  const baseUrl = isProduction
    ? 'https://production.wompi.co'
    : 'https://sandbox.wompi.co';

  // Generate integrity signature
  const generateIntegritySignature = async () => {
    try {
      const response = await fetch('/api/wompi/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountCOP,
          currency,
          reference,
          customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate signature');
      }

      const { signature } = await response.json();
      return signature;
    } catch (error) {
      console.error('Error generating signature:', error);
      throw error;
    }
  };

  // Initialize Wompi widget
  const initializeWompiWidget = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('loading');
      setErrorMessage('');

      // Generate integrity signature
      const signature = await generateIntegritySignature();
      setIntegritySignature(signature);

      // Wompi widget configuration
      const widgetConfig = {
        publicKey,
        amount: amountCOP,
        currency,
        reference,
        customerEmail,
        integritySignature: signature,
        redirectUrl: `${window.location.origin}/payment/success?reference=${reference}`,
        cancelUrl: `${window.location.origin}/payment/cancel?reference=${reference}`,
        enabledPaymentMethods: enabledMethods,
        theme: {
          primaryColor: WOMPI_BRAND.palette.primary.jungle,
          backgroundColor: WOMPI_BRAND.palette.neutral.grayLight,
          borderRadius: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      };

      // Load Wompi SDK
      if (window.WompiWidget) {
        window.WompiWidget.init(widgetConfig);
        window.WompiWidget.mount('#wompi-widget-container');

        // Listen for events
        window.WompiWidget.on('payment.success', data => {
          setPaymentStatus('success');
          onSuccess?.(data);
        });

        window.WompiWidget.on('payment.error', error => {
          setPaymentStatus('error');
          setErrorMessage(error.message || WOMPI_BRAND.microcopy.failed);
          onError?.(error);
        });

        window.WompiWidget.on('payment.cancel', () => {
          setPaymentStatus('idle');
          onCancel?.();
        });
      } else {
        // Fallback to redirect flow
        const redirectUrl = `${baseUrl}/checkout?${new URLSearchParams({
          public_key: publicKey,
          amount: amountCOP,
          currency,
          reference,
          customer_email: customerEmail,
          integrity_signature: signature,
          redirect_url: widgetConfig.redirectUrl,
          cancel_url: widgetConfig.cancelUrl,
          enabled_payment_methods: enabledMethods.join(','),
        }).toString()}`;

        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error initializing Wompi:', error);
      setPaymentStatus('error');
      setErrorMessage('Error al inicializar el pago. Intenta nuevamente.');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Wompi SDK
  useEffect(() => {
    const loadWompiSDK = () => {
      const script = document.createElement('script');
      script.src = `${baseUrl}/v1/widget.js`;
      script.async = true;
      script.onload = () => {
        console.log('Wompi SDK loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Wompi SDK');
      };
      document.head.appendChild(script);
    };

    if (!window.WompiWidget) {
      loadWompiSDK();
    }
  }, [baseUrl]);

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'CARD',
      name: 'Tarjeta',
      icon: cardIcon,
      description: 'Crédito y débito',
    },
    {
      id: 'PSE',
      name: 'PSE',
      icon: '🏦',
      description: 'Pagos Seguros en Línea',
    },
    {
      id: 'NEQUI',
      name: 'Nequi',
      icon: '📱',
      description: 'Billetera digital',
    },
  ].filter(method => enabledMethods.includes(method.id));

  return (
    <div className={`wompi-payment-container ${className}`}>
      {/* Payment Methods Row */}
      <div className="mb-6">
        <h3
          className="text-lg font-semibold mb-3"
          style={{ color: WOMPI_BRAND.palette.neutral.black }}
        >
          Métodos de Pago Disponibles
        </h3>
        <div className="flex flex-wrap gap-3">
          {paymentMethods.map(method => (
            <div
              key={method.id}
              className="flex items-center space-x-2 px-4 py-2 border rounded-lg"
              style={{
                borderColor: WOMPI_BRAND.palette.primary.sky,
                backgroundColor: WOMPI_BRAND.palette.neutral.grayLight,
              }}
            >
              {typeof method.icon === 'string' ? (
                <span className="text-lg">{method.icon}</span>
              ) : (
                <img
                  src={method.icon}
                  alt={method.name}
                  className="w-6 h-6 object-contain"
                />
              )}
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: WOMPI_BRAND.palette.neutral.black }}
                >
                  {method.name}
                </p>
                <p className="text-xs text-gray-600">{method.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={initializeWompiWidget}
        disabled={isLoading || paymentStatus === 'loading'}
        className="w-full py-4 px-6 rounded-full font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: WOMPI_BRAND.palette.primary.jungle,
          color: WOMPI_BRAND.palette.neutral.grayLight,
          fontWeight: WOMPI_BRAND.typography.cta.weight,
        }}
        onMouseEnter={e => {
          if (!isLoading) {
            e.target.style.backgroundColor = '#006B4B';
          }
        }}
        onMouseLeave={e => {
          if (!isLoading) {
            e.target.style.backgroundColor = WOMPI_BRAND.palette.primary.jungle;
          }
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Procesando pago...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Lock className="w-5 h-5 mr-2" />
            Pagar con Wompi
          </div>
        )}
      </button>

      {/* Error Message */}
      {paymentStatus === 'error' && errorMessage && (
        <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentStatus === 'success' && (
        <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{WOMPI_BRAND.microcopy.success}</p>
          </div>
        </div>
      )}

      {/* Widget Container */}
      <div id="wompi-widget-container" className="mt-6"></div>

      {/* Trust Section */}
      <div
        className="mt-6 p-4 border rounded-lg"
        style={{
          borderColor: WOMPI_BRAND.palette.primary.sky,
          backgroundColor: WOMPI_BRAND.palette.neutral.grayLight,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield
              className="w-5 h-5"
              style={{ color: WOMPI_BRAND.palette.primary.jungle }}
            />
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: WOMPI_BRAND.palette.neutral.black }}
              >
                PCI Level 1
              </p>
              <p className="text-xs text-gray-600">Respaldo de Bancolombia</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">
              {WOMPI_BRAND.microcopy.security}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Disclosure */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          {WOMPI_BRAND.microcopy.fee_disclosure}
        </p>
      </div>
    </div>
  );
};

export default PayWithWompi;
