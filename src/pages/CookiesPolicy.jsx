import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const CookiesPolicy = () => {
  useEffect(() => {
    setPageSEO({
      title: 'Política de Cookies | 5thAvenue',
      description:
        'Uso de cookies para funcionamiento, análisis y preferencias.',
      canonicalPath: '/cookies-policy',
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
          Política de Cookies
        </h1>
        <p className="text-gray-700 mb-4">Usamos cookies para:</p>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Funcionamiento esencial del sitio.</li>
          <li>Análisis de uso (Google Analytics u otros).</li>
          <li>Personalización de contenido y recordatorios.</li>
        </ul>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Tipos de cookies
        </h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Necesarias</li>
          <li>Analíticas</li>
          <li>Preferencias</li>
        </ul>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Gestión de cookies
        </h2>
        <p className="text-gray-700">
          Puedes deshabilitar cookies desde la configuración de tu navegador.
          Ten en cuenta que algunas funciones pueden verse afectadas.
        </p>
      </div>
    </main>
  );
};

export default CookiesPolicy;
