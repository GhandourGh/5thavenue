import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

// Icon paths
const logo = '/logo5th.svg?v=2';

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: searchParams.get('token_hash'),
          type: 'signup',
        });

        if (error) {
          setStatus('error');
          setMessage(
            'El enlace de confirmación no es válido o ha expirado. Por favor, solicita un nuevo enlace.'
          );
        } else {
          // Create user profile after successful verification
          if (data.user) {
            try {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  id: data.user.id,
                  full_name: data.user.user_metadata?.full_name || 'Usuario',
                  email: data.user.email,
                });

              if (profileError) {
                console.error('Error creating user profile:', profileError);
              }
            } catch (profileError) {
              console.error('Error creating user profile:', profileError);
            }
          }

          setStatus('success');
          setMessage(
            '¡Tu cuenta ha sido confirmada exitosamente! Ya puedes disfrutar de todos nuestros productos.'
          );

          // Auto-login the user after successful verification
          if (data.user) {
            // The user is now automatically logged in
          }

          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          'Ocurrió un error al confirmar tu cuenta. Por favor, intenta nuevamente.'
        );
      }
    };

    if (searchParams.get('token_hash')) {
      handleEmailConfirmation();
    } else {
      setStatus('error');
      setMessage('Enlace de confirmación inválido.');
    }
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: searchParams.get('email'),
      });

      if (error) {
        setMessage(
          'Error al reenviar el correo. Por favor, intenta nuevamente.'
        );
      } else {
        setMessage(
          'Correo de confirmación reenviado. Revisa tu bandeja de entrada.'
        );
      }
    } catch (error) {
      setMessage('Error al reenviar el correo. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="5thAvenue" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            Confirmación de Email
          </h1>
        </div>

        {/* Status Content */}
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a10009] mx-auto"></div>
              <p className="text-gray-600">Verificando tu cuenta...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                ¡Cuenta Confirmada!
              </h2>
              <p className="text-gray-600">{message}</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#a10009] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8a0008] transition-colors"
                >
                  Ir al Inicio
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Error de Confirmación
              </h2>
              <p className="text-gray-600">{message}</p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResendEmail}
                  className="w-full bg-[#a10009] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8a0008] transition-colors"
                >
                  Reenviar Correo
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Mail className="w-4 h-4" />
            <span className="text-sm">
              ¿Necesitas ayuda? Contacta nuestro soporte
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
