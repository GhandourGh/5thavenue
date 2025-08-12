import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { setPageSEO } from '../utils/seo';

const Contact = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setPageSEO({
      title: 'Contacto | 5thAvenue',
      description: 'Contáctanos por email o WhatsApp para soporte y consultas.',
      canonicalPath: '/contact',
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
          Contáctanos
        </h1>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            ¿Tienes preguntas sobre un producto o tu pedido? Escríbenos y te
            ayudamos.
          </p>
          <ul className="space-y-2">
            <li>
              <span className="font-semibold">Email:</span>{' '}
              <a
                href="mailto:contacto@5thavenue.co"
                className="text-[#a10009] font-medium"
              >
                contacto@5thavenue.co
              </a>
            </li>
            <li>
              <span className="font-semibold">WhatsApp:</span>{' '}
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a10009] font-medium"
              >
                +57 300 123 4567
              </a>
            </li>
            <li>
              <span className="font-semibold">Horario:</span> Lun - Dom: 10:00
              am – 8:00 pm
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default Contact;
