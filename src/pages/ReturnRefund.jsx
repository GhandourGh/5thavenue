import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const ReturnRefund = () => {
  useEffect(() => {
    setPageSEO({
      title: 'Devoluciones y Reembolsos | 5thAvenue',
      description: 'Condiciones, proceso y tiempos de reembolso en 5thAvenue.',
      canonicalPath: '/return-and-refund-policy',
    });
  }, []);

  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[#a10009] hover:text-[#8a0008] font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Política de Devoluciones y Reembolsos
        </h1>
        <p className="text-gray-700 mb-4">
          Aceptamos devoluciones de productos{' '}
          <strong>sin uso, con sellos intactos</strong> dentro de 30 días desde
          la recepción.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Proceso
        </h2>
        <p className="text-gray-700 mb-4">
          Escríbenos a{' '}
          <a
            className="text-[#a10009] font-medium"
            href="mailto:contacto@5thavenue.co"
          >
            contacto@5thavenue.co
          </a>{' '}
          o por WhatsApp indicando tu número de pedido. Te enviaremos un RMA y
          las instrucciones.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Costos de devolución
        </h2>
        <p className="text-gray-700 mb-4">
          El costo de transporte de la devolución puede ser asumido por el
          cliente salvo que el producto sea defectuoso.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Reembolsos
        </h2>
        <p className="text-gray-700">
          Procesamos el reembolso a tu método de pago original dentro de 3–5
          días hábiles tras recibir y verificar el producto.
        </p>
      </div>
    </main>
  );
};

export default ReturnRefund;
