import React, { useState, useMemo, useEffect } from 'react';
import type { Page } from '../types';
import { PRODUCT_HIGHLIGHTS, FEEDBACK_ITEMS, GENERAL_ASSETS } from '../constants';

const HomePage: React.FC<{ navigateTo: (page: Page) => void }> = ({ navigateTo }) => {
  const BowIcon = () => (
    <svg className="w-6 h-6 text-luvin-pink opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 1.5C12 1.5 12 5.5 15 8.5C18 11.5 22.5 12 22.5 12C22.5 12 18 12.5 15 15.5C12 18.5 12 22.5 12 22.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22.5C12 22.5 12 18.5 9 15.5C6 12.5 1.5 12 1.5 12C1.5 12 6 11.5 9 8.5C12 5.5 12 1.5 12 1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderProducts = useMemo(() => PRODUCT_HIGHLIGHTS.slice(0, 4), []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    setActiveSlide(prev => (prev - 1 + sliderProducts.length) % sliderProducts.length);
  };
  const handleNext = () => {
    setActiveSlide(prev => (prev + 1) % sliderProducts.length);
  };

  return (
    <div>
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2">
          <div className="hidden md:block bg-cover bg-center" style={{backgroundImage: `url(${GENERAL_ASSETS.hero})`}}></div>
          <div className="flex flex-col justify-center items-center p-8 text-center bg-white">
             <h1 className="text-5xl font-heading text-luvin-pink">The Luvin</h1>
             <p className="font-script text-3xl my-4 text-gray-600">self love, self care</p>
             <button 
               onClick={() => navigateTo('builder')}
               className="mt-4 border-2 border-luvin-pink text-luvin-pink font-bold py-2 px-8 rounded-full hover:bg-luvin-pink hover:text-gray-800 transition-colors duration-300 font-body tracking-wider"
             >
               BẮT ĐẦU THIẾT KẾ
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto my-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
          <div className="h-[500px] md:h-[600px] bg-cover bg-center" style={{backgroundImage: `url(${GENERAL_ASSETS.inspire})`}}></div>
          <div className="bg-gray-100 flex flex-col justify-center items-center p-8 md:p-16 h-[500px] md:h-[600px] relative">
              <div className="relative w-full max-w-xs aspect-square">
                  {sliderProducts.map((product, index) => (
                      <img 
                          key={product.id} 
                          src={product.imageUrl} 
                          alt={product.name}
                          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-in-out ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}
                      />
                  ))}
              </div>
               <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 p-2 rounded-full hover:bg-white transition-colors z-10">&larr;</button>
               <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 p-2 rounded-full hover:bg-white transition-colors z-10">&rarr;</button>
              <div className="flex gap-3 my-6">
                  {sliderProducts.map((_, index) => (
                      <button 
                          key={index}
                          onClick={() => setActiveSlide(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeSlide === index ? 'bg-gray-800 scale-125' : 'bg-gray-400 hover:bg-gray-400'}`}
                          aria-label={`Go to slide ${index + 1}`}
                      />
                  ))}
              </div>
              <div className="text-center h-20">
                   <p className="text-xs text-gray-500 uppercase tracking-wider">{sliderProducts[activeSlide].collection}</p>
                   <h3 className="font-semibold text-lg mt-1">{sliderProducts[activeSlide].name}</h3>
              </div>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white group">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold font-body text-center mb-8">Our feedbacks</h2>
          <div className="w-full overflow-hidden relative">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...FEEDBACK_ITEMS, ...FEEDBACK_ITEMS].map((feedback, index) => (
                   <div key={index} className="flex-shrink-0 w-60 sm:w-72 bg-luvin-cream p-4 rounded-xl flex flex-col items-center mx-4">
                     <h3 className="font-script text-3xl text-luvin-pink mb-3">Feedback</h3>
                     <div className="w-full aspect-square rounded-lg overflow-hidden">
                       <img src={feedback.imageUrl} alt={feedback.name} className="w-full h-full object-cover"/>
                     </div>
                     <div className="mt-4">
                       <BowIcon />
                     </div>
                   </div>
                ))}
            </div>
            <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-white to-transparent"></div>
            <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
