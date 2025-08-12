import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const Returns = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setPageSEO({
      title: 'Devoluciones | 5thAvenue',
      description: 'Revisa condiciones y proceso de devoluciones en 5thAvenue.',
      canonicalPath: '/returns',
    });
  }, []);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Política de Devoluciones
        </h1>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Plazo de Devolución
            </h2>
            <p>
              Dispones de 30 días desde la recepción para solicitar una
              devolución.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Condiciones
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                El producto debe estar sin uso, en su empaque original y con sus
                sellos intactos.
              </li>
              <li>Se requiere comprobante de compra.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Proceso
            </h2>
            <p>
              Escríbenos a{' '}
              <a
                className="text-[#a10009] font-medium"
                href="mailto:contacto@5thavenue.co"
              >
                contacto@5thavenue.co
              </a>{' '}
              o por WhatsApp indicando tu número de pedido y motivo. Te daremos
              el RMA y las instrucciones.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reembolsos
            </h2>
            <p>
              Una vez recibido y verificado el producto, procesaremos el
              reembolso a tu método de pago original en 3–5 días hábiles.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Returns;
