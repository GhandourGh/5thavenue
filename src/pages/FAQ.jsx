import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const QA = ({ q, a }) => (
  <details className="bg-white rounded-xl border border-gray-200 p-4">
    <summary className="cursor-pointer font-semibold text-gray-900 select-none">
      {q}
    </summary>
    <div className="mt-2 text-gray-700">{a}</div>
  </details>
);

const FAQ = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setPageSEO({
      title: 'Preguntas Frecuentes | 5thAvenue',
      description:
        'Respuestas a preguntas comunes sobre envíos, pagos y productos.',
      canonicalPath: '/faq',
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
          Preguntas Frecuentes
        </h1>
        <div className="space-y-4">
          <QA
            q="¿Los perfumes son originales?"
            a="Sí. Trabajamos con proveedores confiables y control de calidad estricto."
          />
          <QA
            q="¿Hacen entregas el mismo día?"
            a="En zonas cercanas, según disponibilidad. Escríbenos por WhatsApp para confirmarlo."
          />
          <QA
            q="¿Puedo cambiar un perfume abierto?"
            a="Por higiene, solo aceptamos cambios si el sello está intacto."
          />
          <QA
            q="¿Formas de pago?"
            a="Aceptamos tarjetas, transferencias y pagos contraentrega donde aplique."
          />
        </div>
      </div>
    </main>
  );
};

export default FAQ;
