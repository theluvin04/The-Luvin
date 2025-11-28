
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Page, FrameConfig, LegoPart, DraggableItem, TextConfig, LegoCharacterConfig, OutfitColor, Order, PresetBackground, CollectionTemplate, FeedbackItem, FrameOption } from './types';
import { 
    FRAME_OPTIONS, 
    LEGO_PARTS, 
    INITIAL_FRAME_CONFIG, 
    COLLECTION_TEMPLATES, 
    FEEDBACK_ITEMS, 
    MOCK_ORDERS, 
    PRESET_BACKGROUNDS_SQUARE, 
    PRESET_BACKGROUNDS_RECTANGLE, 
    GENERAL_ASSETS,
    defaultShirtColors,
    defaultPantsColors,
} from './constants';
import FramePreview from './components/FramePreview';
import { createOrder, getOrderById, getOrdersByPhone } from './services/orderService'; 
import { getAllParts } from './services/productService'; 
import { getAllBackgrounds } from './services/backgroundService'; 
import { getStoreConfig } from './services/configService'; 
import { getAllTemplates } from './services/templateService'; 
import { getAllFeedbacks } from './services/feedbackService'; 
import { getAllFrames } from './services/frameService'; 
import AdminPage from './components/AdminPage'; 
import { sendOrderEmail } from './services/emailService'; 
import { uploadToCloudinary } from './services/uploadService'; 

declare var html2canvas: any;
declare var confetti: any;

const formatCurrency = (amount: number, context: 'price' | 'payment' = 'price') => {
  if (amount === 0 && context === 'price') return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const ZoomIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);

const CHARACTER_BASE_PRICE = 10000;
const FREE_SHIPPING_THRESHOLD = 349000;

// Updated to accept dynamic frames
const calculatePrice = (config: FrameConfig, allParts: Record<string, LegoPart>, frames: FrameOption[]) => {
    const breakdown: {label: string, value: number}[] = [];
    const frame = frames.find(f => f.id === config.frameId) || frames[0] || FRAME_OPTIONS[0];
    let total = frame.price;
    breakdown.push({ label: `Khung ${frame.name}`, value: frame.price });

    if(config.characters.length > 0) { const val = config.characters.length * CHARACTER_BASE_PRICE; total += val; breakdown.push({ label: `${config.characters.length} nhân vật`, value: val}); }
    
    config.characters.forEach((char, index) => {
        const customPrint = char.customPrintPrice || 0;
        if(customPrint > 0) {
            total += customPrint;
            breakdown.push({ label: `NV ${index + 1} - In yêu cầu`, value: customPrint });
        }
    });

    const hairPrice = config.characters.reduce((acc, char) => acc + (char.hair?.price || 0) + (char.selectedHairColor?.price || 0), 0);
    if(hairPrice > 0) { breakdown.push({ label: 'Tóc & Màu', value: hairPrice }); total += hairPrice; }

    const hatPrice = config.draggableItems.filter(i => i.type === 'hat').reduce((acc, item) => acc + (allParts[item.partId]?.price || 0), 0);
    if(hatPrice > 0) { breakdown.push({ label: 'Mũ', value: hatPrice }); total += hatPrice; }

    const shirtBasePrice = config.characters.reduce((acc, char) => acc + (char.shirt?.price || 0), 0);
    const shirtColorPrice = config.characters.reduce((acc, char) => acc + (char.selectedShirtColor?.price || 0), 0);
    const totalShirtPrice = shirtBasePrice + shirtColorPrice;
    if(totalShirtPrice > 0) { 
        total += totalShirtPrice; 
        breakdown.push({ label: 'Áo & Màu', value: totalShirtPrice }); 
    }

    const pantsBasePrice = config.characters.reduce((acc, char) => acc + (char.pants?.price || 0), 0);
    const pantsColorPrice = config.characters.reduce((acc, char) => acc + (char.selectedPantsColor?.price || 0), 0);
    const totalPantsPrice = pantsBasePrice + pantsColorPrice;
    if(totalPantsPrice > 0) { 
        total += totalPantsPrice; 
        breakdown.push({ label: 'Quần & Màu', value: totalPantsPrice }); 
    }

    const accessoryPrice = config.draggableItems.filter(i => i.type === 'accessory').reduce((acc, item) => acc + (allParts[item.partId]?.price || 0) + (item.selectedColor?.price || 0), 0);
    if(accessoryPrice > 0) { total += accessoryPrice; breakdown.push({ label: 'Phụ kiện', value: accessoryPrice }); }
    
    const petPrice = config.draggableItems.filter(i => i.type === 'pet').reduce((acc, item) => acc + (allParts[item.partId]?.price || 0) + (item.selectedColor?.price || 0), 0);
    if(petPrice > 0) { total += petPrice; breakdown.push({ label: 'Thú cưng', value: petPrice }); }

    return { totalPrice: total, priceBreakdown: breakdown };
};


type Transform = { x: number; y: number; rotation: number; scale: number; width?: number };

const StepIndicator: React.FC<{ currentStep: number; setStep: (step: number) => void }> = ({ currentStep, setStep }) => {
  const steps = ['Thông tin SP', 'Nền & Chữ', 'Thiết kế', 'Mua hàng'];
  
  return (
    <div id="builder-step-indicator" className="w-full max-w-3xl mx-auto md:mx-0 my-6 px-2 scroll-mt-24">
      <div className="flex justify-between md:justify-start md:gap-4 items-center relative md:w-max">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2 hidden sm:block"></div>
        
        {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;
            
            return (
                <button
                    key={index}
                    onClick={() => setStep(stepNumber)}
                    className={`
                        relative flex items-center justify-center
                        transition-all duration-300 ease-in-out
                        ${isActive ? 'flex-grow sm:flex-grow-0' : 'flex-shrink-0'}
                    `}
                    style={{ minWidth: isActive ? 'auto' : '32px' }}
                >
                    <div className={`
                        flex items-center rounded-full border-2 transition-all duration-300 overflow-hidden bg-white
                        ${isActive 
                            ? 'border-luvin-pink pl-1 pr-4 py-1 gap-2 shadow-sm w-full' 
                            : isCompleted 
                                ? 'border-luvin-pink p-1 w-8 h-8 justify-center' 
                                : 'border-gray-300 p-1 w-8 h-8 justify-center'
                        }
                        sm:w-auto sm:h-auto sm:px-4 sm:py-1.5 sm:gap-2
                    `}>
                        <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                            ${isActive 
                                ? 'bg-luvin-pink text-white' 
                                : isCompleted 
                                    ? 'bg-luvin-pink text-white' 
                                    : 'bg-gray-200 text-gray-500'
                            }
                        `}>
                            {isCompleted ? '✓' : stepNumber}
                        </div>
                        <span className={`
                            text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300
                            ${isActive 
                                ? 'text-luvin-pink opacity-100 max-w-[150px]' 
                                : 'text-gray-500 max-w-0 opacity-0 sm:max-w-[150px] sm:opacity-100 sm:block hidden'
                            }
                        `}>
                            {label}
                        </span>
                    </div>
                </button>
            );
        })}
      </div>
    </div>
  );
};

// ... (Step1Frame, PresetBackgroundButton, Step2BackgroundAndDecorations, PartButton - Keep as is) ...
const Step1Frame: React.FC<{ config: FrameConfig; setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>; frames: FrameOption[] }> = ({ config, setConfig, frames }) => {
  const selectedFrame = frames.find(f => f.id === config.frameId) || frames[0];
  
  useEffect(() => {
      if (selectedFrame && selectedFrame.colors && selectedFrame.colors.length > 0) {
          if (!config.frameColor || !selectedFrame.colors.includes(config.frameColor)) {
              setConfig(prev => ({ ...prev, frameColor: selectedFrame.colors[0] }));
          }
      }
  }, [selectedFrame, config.frameColor, setConfig]);

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">CHỌN KÍCH THƯỚC</h4>
        <div className="grid grid-cols-3 gap-3">
          {frames.map(frame => (
            <button
              key={frame.id}
              onClick={() => setConfig(prev => ({ ...prev, frameId: frame.id }))}
              disabled={frame.stock === 0}
              className={`border rounded-lg py-2 px-1 text-xs sm:text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center h-20 relative ${
                config.frameId === frame.id ? 'bg-luvin-pink text-gray-800 border-luvin-pink' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-50'
              } ${frame.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{frame.name}</span>
              <span className="font-normal opacity-80 mt-1">{formatCurrency(frame.price)}</span>
              {frame.stock === 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 rounded-bl">Hết hàng</span>}
            </button>
          ))}
        </div>
        {selectedFrame && selectedFrame.colors && selectedFrame.colors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-500 uppercase mb-2">MÀU KHUNG</h4>
                <div className="flex gap-3 flex-wrap">
                    {selectedFrame.colors.map(color => {
                        const getColorStyle = (c: string) => {
                            if (c === 'white') return { bg: '#fff', border: '#ddd' };
                            if (c === 'black') return { bg: '#000', border: '#000' };
                            if (c === 'wood') return { bg: '#d2b48c', border: '#c1a075' };
                            if (c === 'gold') return { bg: '#ffd700', border: '#e6c200' };
                            return { bg: c, border: c };
                        };
                        const style = getColorStyle(color);
                        const isSelected = config.frameColor === color;

                        return (
                            <button 
                                key={color}
                                onClick={() => setConfig(prev => ({ ...prev, frameColor: color }))}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all capitalize ${isSelected ? 'border-luvin-pink ring-1 ring-luvin-pink bg-pink-50' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <div 
                                    className="w-4 h-4 rounded-full shadow-sm border" 
                                    style={{ backgroundColor: style.bg, borderColor: style.border }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">{color === 'white' ? 'Trắng' : color === 'black' ? 'Đen' : color}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
       {selectedFrame && (
        <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3">GIÁ CƠ BẢN BAO GỒM</h4>
            <ul className="text-sm list-disc list-inside text-gray-600 space-y-1">
                <li>1 Khung ảnh {selectedFrame.name} ({selectedFrame.description}).</li>
                <li>1 Nền tùy chọn (mẫu có sẵn hoặc ảnh của bạn).</li>
                <li>Miễn phí thêm chữ & ảnh nhỏ trang trí.</li>
                <li>Hộp quà & thiệp viết tay theo yêu cầu.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2 italic">Lưu ý: Giá chưa bao gồm nhân vật LEGO và phụ kiện.</p>
        </div>
      )}
    </div>
  );
};

const PresetBackgroundButton: React.FC<{
    bg: PresetBackground;
    isSelected: boolean;
    onClick: () => void;
    onZoom: (url: string) => void;
}> = ({ bg, isSelected, onClick, onZoom }) => {
    let line1 = bg.name;
    let line2 = '';

    const match = bg.name.match(/^(.*?)(\s+\d+)$/);
    
    if (match) {
        line1 = match[1]; 
        line2 = match[2].trim();
    } else {
        const parts = bg.name.split(' ');
        if (parts.length > 1) {
            line1 = parts[0];
            line2 = parts.slice(1).join(' ');
        }
    }

    return (
        <button
            onClick={onClick}
            className={`border-2 rounded-xl p-1.5 flex flex-col items-center justify-start gap-1.5 transition-all text-center w-full relative group ${
                isSelected
                    ? 'border-luvin-pink bg-pink-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="w-full aspect-[4/5] rounded-md bg-gray-100 overflow-hidden flex items-center justify-center relative">
                <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto">
                    <div 
                        className="bg-black/40 hover:bg-black/60 text-white p-1 rounded-full cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onZoom(bg.url); }}
                        title="Zoom"
                    >
                        <ZoomIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center flex-shrink-0 h-9 leading-tight">
                <span className="text-[11px] font-semibold text-gray-700">{line1}</span>
                {line2 && <span className="text-[11px] font-semibold text-gray-700">{line2}</span>}
            </div>
        </button>
    );
};

// ... [Rest of App.tsx remains same until handlePlaceOrder]

const App: React.FC = () => {
  // ... [state declarations]
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [config, setConfig] = useState<FrameConfig>(INITIAL_FRAME_CONFIG);
  
  // ADDED: Control initial step when entering builder
  const [builderInitialStep, setBuilderInitialStep] = useState(1);

  const [cartItems, setCartItems] = useState<FrameConfig[]>(() => {
      try {
          const savedCart = localStorage.getItem('shopping_cart');
          return savedCart ? JSON.parse(savedCart) : [];
      } catch (error) {
          console.error("Failed to load cart from storage", error);
          return [];
      }
  });

  useEffect(() => {
      try {
          localStorage.setItem('shopping_cart', JSON.stringify(cartItems));
      } catch (error) {
          console.error("Failed to save cart to storage", error);
      }
  }, [cartItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true); 
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null); 
  
  const [legoParts, setLegoParts] = useState(LEGO_PARTS);
  const [backgrounds, setBackgrounds] = useState<PresetBackground[]>([]); 
  const [templates, setTemplates] = useState<CollectionTemplate[]>(COLLECTION_TEMPLATES);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(FEEDBACK_ITEMS);
  const [frames, setFrames] = useState<FrameOption[]>(FRAME_OPTIONS); 

  const [logoUrl, setLogoUrl] = useState<string>(() => {
      try {
          const cached = localStorage.getItem('app_config');
          return cached ? JSON.parse(cached).logoUrl || "" : "";
      } catch (e) { return ""; }
  });
  
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(() => {
      try {
          const cached = localStorage.getItem('app_config');
          return cached ? JSON.parse(cached).heroImageUrl : undefined;
      } catch (e) { return undefined; }
  });

  const [inspireImageUrl, setInspireImageUrl] = useState<string | undefined>(() => {
      try {
          const cached = localStorage.getItem('app_config');
          return cached ? JSON.parse(cached).inspireImageUrl : undefined;
      } catch (e) { return undefined; }
  });

  useEffect(() => {
      try {
          const cached = localStorage.getItem('app_config');
          if (cached) {
              const config = JSON.parse(cached);
              if (config.faviconUrl) {
                  const link = document.querySelector("link[rel~='icon']");
                  if (link instanceof HTMLLinkElement) {
                      link.href = config.faviconUrl;
                  } else {
                      const newLink = document.createElement('link');
                      newLink.rel = 'icon';
                      newLink.href = config.faviconUrl;
                      document.head.appendChild(newLink);
                  }
              }
          }
      } catch(e) {}
  }, []);

  useEffect(() => {
      const fetchData = async () => {
          try {
            const [parts, bgs, storeConfig, tpls, fbs, fetchedFrames] = await Promise.all([
                getAllParts(), 
                getAllBackgrounds(), 
                getStoreConfig(),
                getAllTemplates(),
                getAllFeedbacks(),
                getAllFrames()
            ]);
            
            if (parts && parts.length > 0) {
                setLegoParts(categorizeParts(parts));
            }
            if (bgs && bgs.length > 0) {
                setBackgrounds(bgs);
            }
            if (tpls && tpls.length > 0) {
                setTemplates(tpls);
            }
            if (fbs && fbs.length > 0) {
                setFeedbacks(fbs);
            }
            if (fetchedFrames && fetchedFrames.length > 0) {
                setFrames(fetchedFrames);
            }

            if (storeConfig) {
                localStorage.setItem('app_config', JSON.stringify(storeConfig));

                if (storeConfig.logoUrl) setLogoUrl(storeConfig.logoUrl);
                if (storeConfig.heroImageUrl) setHeroImageUrl(storeConfig.heroImageUrl);
                if (storeConfig.inspireImageUrl) setInspireImageUrl(storeConfig.inspireImageUrl);
                
                if (storeConfig.faviconUrl) {
                    const link = document.querySelector("link[rel~='icon']");
                    if (link instanceof HTMLLinkElement) {
                        link.href = storeConfig.faviconUrl;
                    } else {
                        const newLink = document.createElement('link');
                        newLink.rel = 'icon';
                        newLink.href = storeConfig.faviconUrl;
                        document.head.appendChild(newLink);
                    }
                }
            }
          } catch (error) {
              console.error("Initial fetch error:", error);
          } finally {
              setIsAppLoading(false);
          }
      };
      fetchData();
  }, []);

  const allParts = useMemo(() => (Object.values(legoParts) as LegoPart[][]).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {} as Record<string, LegoPart>), [legoParts]);

  const navigateTo = (page: Page) => {
    // Reset initial step to 1 when navigating to builder normally
    if (page === 'builder') {
        setBuilderInitialStep(1);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // ADDED: Handle customizing template from collection
  const handleCustomizeTemplate = (templateConfig: FrameConfig) => {
      setConfig(templateConfig);
      setBuilderInitialStep(3); // Start at Step 3 (Design)
      setCurrentPage('builder');
      window.scrollTo(0, 0);
  };

  useEffect(() => {
      const checkHash = () => {
          if (window.location.hash === '#/admin') {
              setCurrentPage('admin');
          }
      };
      checkHash();
      window.addEventListener('hashchange', checkHash);
      return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleAddToCart = (newConfig: FrameConfig, openCart = true) => {
    setCartItems(prev => [...prev, { ...newConfig, quantity: 1 }]);
    if (openCart) setIsCartOpen(true);
  };

  const handleUpdateCartItem = (updatedConfig: FrameConfig) => {
      if (editingCartIndex !== null) {
          setCartItems(prev => prev.map((item, i) => i === editingCartIndex ? { ...updatedConfig, quantity: item.quantity } : item)); 
          setEditingCartIndex(null);
          setConfig(INITIAL_FRAME_CONFIG); 
          setIsCartOpen(true); 
      }
  };

  const handleEditCartItem = (index: number) => {
      setConfig(cartItems[index]);
      setEditingCartIndex(index);
      setIsCartOpen(false);
      // When editing cart, also start at design step usually, but keeping default flow for now
      setBuilderInitialStep(4); // Jump to step 4 or 3 depending on preference, sticking to logic
      navigateTo('builder');
  };

  const handleCancelEdit = () => {
      setEditingCartIndex(null);
      setConfig(INITIAL_FRAME_CONFIG);
      setIsCartOpen(true);
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartQuantity = (index: number, newQuantity: number) => {
      if (newQuantity < 1) return;
      setCartItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
  };

  const handlePlaceOrder = async (orderData: Omit<Order, 'status' | 'createdAt'>) => {
    const res = await createOrder(orderData);
    if (res.success && res.data) {
        setCurrentOrder(res.data);
        
        try {
            const rawSaved = localStorage.getItem('my_orders');
            let saved: { id: string; date: number }[] = [];
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed)) {
                    saved = parsed as { id: string; date: number }[];
                }
            }
            
            const newEntry = { id: res.data.id, date: Date.now() };
            // FIX: Ensure spread works by filtering on a typed array
            const updated = [newEntry, ...saved.filter((o) => o.id !== (res.data?.id || ''))].slice(0, 5);
            localStorage.setItem('my_orders', JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save local order history", e);
        }

        setCartItems([]); 
        navigateTo('order-confirmation');
        sendOrderEmail(res.data);
    } else {
        alert("Lỗi đặt hàng. Vui lòng thử lại.");
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (isAppLoading && !logoUrl) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 text-luvin-pink">
              <div className="animate-pulse flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 1.5C12 1.5 12 5.5 15 8.5C18 11.5 22.5 12 22.5 12C22.5 12 18 12.5 15 15.5C12 18.5 12 22.5 12 22.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22.5C12 22.5 12 18.5 9 15.5C6 12.5 1.5 12 1.5 12C1.5 12 6 11.5 9 8.5C12 5.5 12 1.5 12 1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-heading text-2xl tracking-wider">The Luvin</span>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
         {currentPage !== 'admin' && (
             <Header navigateTo={navigateTo} cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} logoUrl={logoUrl} />
        )}
        
        <main className="flex-grow">
            {currentPage === 'home' && <HomePage navigateTo={navigateTo} heroImage={heroImageUrl} inspireImage={inspireImageUrl} feedbacks={feedbacks} templates={templates} />}
            {currentPage === 'builder' && (
                <BuilderPage 
                    config={config} 
                    setConfig={setConfig} 
                    navigateTo={navigateTo} 
                    onAddToCart={handleAddToCart} 
                    onUpdateCart={handleUpdateCartItem} 
                    showToast={showToast}
                    legoParts={legoParts}
                    backgrounds={backgrounds}
                    frames={frames}
                    editingCartIndex={editingCartIndex} 
                    onCancelEdit={handleCancelEdit} 
                    onZoomImage={setZoomedImageUrl} 
                    logoUrl={logoUrl}
                    initialStep={builderInitialStep}
                />
            )}
            {currentPage === 'collection' && <CollectionPage navigateTo={navigateTo} onCustomize={handleCustomizeTemplate} templates={templates} />}
            {currentPage === 'cart' && <CartPage 
                cartItems={cartItems} 
                onRemoveItem={handleRemoveCartItem} 
                onEditItem={handleEditCartItem} 
                allParts={allParts} 
                navigateTo={navigateTo}
                onUpdateQuantity={handleUpdateCartQuantity}
                onZoomImage={setZoomedImageUrl} 
            />}
            {currentPage === 'checkout' && <CheckoutPage cartItems={cartItems} allParts={allParts} onPlaceOrder={handlePlaceOrder} onZoomImage={(url) => setZoomedImageUrl(url)} />}
            {currentPage === 'order-confirmation' && <OrderConfirmationPage order={currentOrder} navigateTo={navigateTo} onZoomImage={(url) => setZoomedImageUrl(url)} />}
            {currentPage === 'order-lookup' && <OrderLookupPage onZoomImage={(url) => setZoomedImageUrl(url)} />}
            {currentPage === 'about' && <AboutPage />}
            {currentPage === 'warranty' && <WarrantyPage />}
            {currentPage === 'admin' && <AdminPage />}
        </main>

        {currentPage !== 'admin' && <Footer navigateTo={navigateTo} />}

        <CartPanel 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            cartItems={cartItems} 
            onRemoveItem={handleRemoveCartItem}
            onEditItem={handleEditCartItem} 
            allParts={allParts}
            navigateTo={navigateTo}
            onUpdateQuantity={handleUpdateCartQuantity}
            onZoomImage={setZoomedImageUrl}
        />
        
         {zoomedImageUrl && (
            <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedImageUrl(null)}>
                <div className="relative max-w-4xl max-h-full w-full flex justify-center">
                    <img src={zoomedImageUrl} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <button className="absolute -top-12 right-0 sm:-right-12 text-white hover:text-gray-300 transition-colors" onClick={() => setZoomedImageUrl(null)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )}

        {toast && (
            <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {toast.message}
            </div>
        )}
    </div>
  );
};

export default App;
