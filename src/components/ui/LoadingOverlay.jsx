import React from 'react';

const LoadingOverlay = ({ isLoading, message = 'Cargando...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        {/* Loading message with enhanced typography */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-3 tracking-wide">
            {message}
          </h2>
          <p className="text-gray-500 text-sm md:text-base font-medium tracking-wide">
            Preparando tu experiencia de lujo...
          </p>
        </div>

        {/* Premium animated loading dots with smoother timing */}
        <div className="flex justify-center space-x-3 mb-12">
          <div
            className="w-4 h-4 bg-gradient-to-r from-[#a10009] to-[#8a0008] rounded-full animate-pulse shadow-lg"
            style={{
              animationDelay: '0ms',
              animationDuration: '1.5s',
              animationTimingFunction: 'ease-in-out',
            }}
          ></div>
          <div
            className="w-4 h-4 bg-gradient-to-r from-[#a10009] to-[#8a0008] rounded-full animate-pulse shadow-lg"
            style={{
              animationDelay: '200ms',
              animationDuration: '1.5s',
              animationTimingFunction: 'ease-in-out',
            }}
          ></div>
          <div
            className="w-4 h-4 bg-gradient-to-r from-[#a10009] to-[#8a0008] rounded-full animate-pulse shadow-lg"
            style={{
              animationDelay: '400ms',
              animationDuration: '1.5s',
              animationTimingFunction: 'ease-in-out',
            }}
          ></div>
        </div>

        {/* Enhanced progress bar with gradient and smoother animation */}
        <div className="w-80 mx-auto mb-12">
          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-[#a10009] via-[#8a0008] to-[#a10009] h-full rounded-full animate-pulse"
              style={{
                width: '75%',
                animationDuration: '2s',
                animationTimingFunction: 'ease-in-out',
              }}
            ></div>
          </div>
        </div>

        {/* Elegant brand tagline with subtle animation */}
        <div className="animate-fade-in">
          <p className="text-gray-400 text-sm font-medium tracking-wider uppercase">
            Perfumes de Lujo • 5thAvenue
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
