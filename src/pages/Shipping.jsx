import React, { useEffect } from 'react';
import { SHIPPING_SCOPE } from '../utils/config';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const Shipping = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setPageSEO({
      title: 'Envíos | 5thAvenue',
      description: 'Conoce cobertura, costos y tiempos de envío de 5thAvenue.',
      canonicalPath: '/shipping',
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
          Información de Envío
        </h1>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cobertura
            </h2>
            {SHIPPING_SCOPE === 'local' ? (
              <p>
                Realizamos entregas en <strong>San Andrés Islas</strong>{' '}
                únicamente. Para otras ubicaciones, contáctanos y te
                confirmaremos opciones y tiempos de envío.
              </p>
            ) : (
              <p>
                Realizamos entregas{' '}
                <strong>a nivel nacional en Colombia</strong>. Los tiempos y
                costos dependen del destino.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tiempos de Entrega
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Entregas locales: 1–3 días hábiles.</li>
              <li>Pedidos especiales o alto volumen: 3–5 días hábiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Costos</h2>
            <p>
              El costo de envío se calcula al finalizar la compra según la zona
              de entrega y el tamaño del pedido. Ofrecemos promociones de envío
              gratuito en fechas especiales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Seguimiento
            </h2>
            <p>
              Te notificaremos por WhatsApp o correo cuando tu pedido esté listo
              para entrega, junto con el rango horario estimado.
            </p>
            {SHIPPING_SCOPE === 'local' ? (
              <p className="mt-2 text-sm text-gray-600">
                Nota: <strong>Contra Entrega</strong> está disponible solo
                dentro de <strong>San Andrés</strong>.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Nota: <strong>Contra Entrega</strong> puede estar limitado a
                zonas específicas. Verás la disponibilidad en el método de pago
                según tu dirección.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Shipping;
