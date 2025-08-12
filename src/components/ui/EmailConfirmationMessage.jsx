import React from 'react';
import { Mail, CheckCircle, Clock } from 'lucide-react';

const EmailConfirmationMessage = ({
  email,
  onClose,
  onResend,
  isSending = false,
  statusType = null,
  statusText = '',
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              ¡Cuenta Creada Exitosamente!
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              Hemos enviado un correo de confirmación a:
            </p>

            {/* Email Display */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="font-medium text-gray-800">{email}</p>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Haz clic en el enlace de confirmación en tu correo</p>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>El enlace expira en 24 horas</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onClose}
                className="w-full bg-[#a10009] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#8a0008] transition-colors duration-200"
              >
                Entendido
              </button>

              <button
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Abrir Gmail
              </button>
              <button
                onClick={onResend}
                disabled={isSending}
                className={`w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${isSending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                {isSending ? 'Enviando…' : 'Reenviar correo de verificación'}
              </button>
              {statusText ? (
                <div
                  className={`text-sm mt-2 ${statusType === 'error' ? 'text-red-600' : 'text-green-700'}`}
                >
                  {statusText}
                </div>
              ) : null}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                ¿No recibiste el correo? Revisa tu carpeta de spam o solicita un
                nuevo enlace desde tu perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationMessage;
