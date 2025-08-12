import React, { useEffect, useRef, useState } from 'react';
import { setPageSEO } from '../utils/seo';
import bossImg from '../assets/images/boss.webp';
import lacosteImg from '../assets/images/lacoste.webp';
import pacoImg from '../assets/images/paco.webp';
import banner5 from '../assets/images/banner5.webp';

const StoreCard = ({ store }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageSEO({
      title: 'Tiendas 5thAvenue | San Andrés',
      description:
        'Visita nuestras tiendas en San Andrés Islas. Horarios y direcciones.',
      canonicalPath: '/stores',
    });
  }, []);
  return (
    <div
      ref={ref}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-700 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } flex flex-col h-full`}
    >
      <div className="relative h-40 md:h-44 overflow-hidden">
        <img
          src={store.image}
          alt={`Fachada tienda - ${store.city}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3 bg-[#a10009] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
          {store.city}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.75rem]">
          {store.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 flex items-start">
          <span className="mr-2">📍</span>
          <span>{store.address}</span>
        </p>
        <p className="text-gray-600 text-sm mb-4 flex items-start">
          <span className="mr-2">🕐</span>
          <span>{store.hours}</span>
        </p>
        {store.maps && (
          <a
            href={store.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center w-full rounded-full border border-[#a10009] text-[#a10009] hover:bg-[#a10009] hover:text-white transition-colors font-semibold text-sm px-4 py-2"
          >
            Ver en Google Maps
          </a>
        )}
      </div>
    </div>
  );
};

const About = () => {
  const stores = [
    {
      name: 'Centro — Av. 20 de Julio',
      city: 'San Andrés Islas',
      address: 'Av. 20 de Julio – Zona Comercial Centro',
      hours: 'Lun - Dom: 10:00 am – 8:00 pm',
      image: bossImg,
      maps: 'https://maps.google.com/?q=Av.+20+de+Julio,+San+Andr%C3%A9s+Islas',
    },
    {
      name: 'North End — Peatonal Spratt Bight',
      city: 'San Andrés Islas',
      address: 'Peatonal Spratt Bight – Frente a la Playa',
      hours: 'Lun - Dom: 10:00 am – 8:00 pm',
      image: pacoImg,
      maps: 'https://maps.google.com/?q=Spratt+Bight,+San+Andr%C3%A9s+Islas',
    },
    {
      name: 'San Luis',
      city: 'San Andrés Islas',
      address: 'Sector San Luis – Vía principal',
      hours: 'Lun - Dom: 10:00 am – 8:00 pm',
      image: lacosteImg,
      maps: 'https://maps.google.com/?q=San+Luis,+San+Andr%C3%A9s+Islas',
    },
    {
      name: 'La Loma',
      city: 'San Andrés Islas',
      address: 'Barrio La Loma – Cerca a la Iglesia Baptista',
      hours: 'Lun - Dom: 10:00 am – 8:00 pm',
      image: banner5,
      maps: 'https://maps.google.com/?q=La+Loma,+San+Andr%C3%A9s+Islas',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Visita Nuestras Tiendas
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Estamos en San Andrés Islas. Conoce nuestras ubicaciones físicas y
            compra con total confianza.
          </p>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stores.map(store => (
            <div key={store.name} className="h-full">
              <StoreCard store={store} />
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 md:mt-16 bg-white rounded-2xl border border-[#a10009]/20 p-5 md:p-6 text-center">
          <p className="text-sm md:text-base text-gray-700">
            ¿Listo para visitarnos?{' '}
            <span className="font-semibold text-[#a10009]">
              ¡Estamos más cerca de lo que crees!
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
