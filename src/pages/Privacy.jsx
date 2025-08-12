import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const Privacy = () => {
  useEffect(() => {
    setPageSEO({
      title: 'Política de Privacidad | 5thAvenue',
      description:
        'Cómo recopilamos, usamos y protegemos tus datos en 5thAvenue.',
      canonicalPath: '/privacy',
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
          Política de Privacidad
        </h1>
        <p className="text-gray-700 mb-4">
          Esta Política de Privacidad describe cómo recopilamos, usamos,
          almacenamos y protegemos tu información personal en cumplimiento de la
          Ley de Habeas Data en Colombia y normativas aplicables.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Datos que recopilamos
        </h2>
        <p className="text-gray-700 mb-4">
          Recopilamos datos de contacto (nombre, email, teléfono), información
          de envío, historial de pedidos, preferencias y datos técnicos de
          navegación (cookies y analytics) con fines de prestación del servicio,
          soporte, seguridad y mejora de la experiencia.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Uso de la información
        </h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Procesar pedidos y gestionar envíos.</li>
          <li>Atención al cliente y confirmaciones (email/WhatsApp).</li>
          <li>
            Mejorar el sitio, prevenir fraude y cumplir requisitos legales.
          </li>
          <li>Marketing opcional (newsletter) con consentimiento revocable.</li>
        </ul>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Derechos del titular
        </h2>
        <p className="text-gray-700 mb-4">
          Puedes solicitar acceso, actualización, corrección o eliminación de
          tus datos, así como revocar autorizaciones. Escríbenos a{' '}
          <a
            href="mailto:contacto@5thavenue.co"
            className="text-[#a10009] font-medium"
          >
            contacto@5thavenue.co
          </a>
          .
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Conservación y seguridad
        </h2>
        <p className="text-gray-700 mb-4">
          Conservamos tu información por el tiempo necesario para las
          finalidades informadas y conforme a la ley. Implementamos medidas de
          seguridad razonables para proteger tus datos.
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Cookies
        </h2>
        <p className="text-gray-700">
          Usamos cookies para funcionamiento, análisis y personalización. Puedes
          gestionar preferencias en tu navegador. Más detalles en nuestra{' '}
          <a href="/cookies-policy" className="text-[#a10009] font-medium">
            Política de Cookies
          </a>
          .
        </p>
      </div>
    </main>
  );
};

export default Privacy;
