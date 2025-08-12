import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const Terms = () => {
  useEffect(() => {
    setPageSEO({
      title: 'Términos y Condiciones | 5thAvenue',
      description:
        'Condiciones de compra, envíos, devoluciones y responsabilidad.',
      canonicalPath: '/terms',
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
          Términos y Condiciones
        </h1>
        <p className="text-gray-700 mb-4">
          Al realizar una compra en 5thAvenue aceptas los siguientes términos.
          La moneda de transacción es COP. Métodos de pago aceptados: Bold
          (tarjeta/transferencia) y Contra Entrega según disponibilidad.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Envíos
        </h2>
        <p className="text-gray-700 mb-4">
          El alcance de envío y los tiempos estimados se describen en la página
          de Envío. Las restricciones pueden aplicar por ubicación o
          disponibilidad. Contra Entrega puede limitarse a zonas específicas.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Devoluciones y reembolsos
        </h2>
        <p className="text-gray-700 mb-4">
          Consulta el proceso, condiciones y plazos en la{' '}
          <a
            href="/return-and-refund-policy"
            className="text-[#a10009] font-medium"
          >
            Política de Devoluciones y Reembolsos
          </a>
          .
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Responsabilidad
        </h2>
        <p className="text-gray-700 mb-4">
          No somos responsables por retrasos de terceros transportadores o
          eventos de fuerza mayor. Las descripciones de productos buscan ser
          exactas; sin embargo, errores tipográficos pueden ocurrir.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Ley aplicable y disputas
        </h2>
        <p className="text-gray-700">
          Estos términos se rigen por las leyes de Colombia. Cualquier
          controversia se resolverá ante los tribunales competentes en Colombia.
        </p>
      </div>
    </main>
  );
};

export default Terms;
