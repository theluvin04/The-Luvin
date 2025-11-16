// FIX: Export API_BASE_URL for use in other components.
export const API_BASE_URL = '';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// FIX: Update type imports to include AllProducts for admin functionality.
import type { Page, FrameConfig, LegoPart, DraggableItem, TextConfig, LegoCharacterConfig, OutfitColor, OrderDetails, StoredOrder, OrderStatus, AllProducts, AllBackgrounds } from './types';
import { 
    FRAME_OPTIONS, 
    LEGO_PARTS, 
    INITIAL_FRAME_CONFIG, 
    COLLECTION_TEMPLATES, 
    FEEDBACK_ITEMS, 
    PRESET_BACKGROUNDS_SQUARE, 
    PRESET_BACKGROUNDS_RECTANGLE, 
    PRODUCT_HIGHLIGHTS,
    GENERAL_ASSETS,
} from './constants';
import FramePreview from './components/FramePreview';
// FIX: Import admin components
import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import AdminPage from './components/AdminPage';
import DashboardPage from './components/DashboardPage';
import ProductManagementPage from './components/ProductManagementPage';
import AdminBackgroundsPage from './components/AdminBackgroundsPage';


declare var html2canvas: any;

const formatCurrency = (amount: number) => {
  if (amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CHARACTER_BASE_PRICE = 10000;

const calculatePrice = (config: FrameConfig, allParts: Record<string, LegoPart>) => {
    const breakdown: {label: string, value: number}[] = [];
    const frame = FRAME_OPTIONS.find(f => f.id === config.frameId) || FRAME_OPTIONS[0];
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

    const hairPrice = config.characters.reduce((acc, char) => acc + (char.hair?.price || 0), 0);
    if(hairPrice > 0) { breakdown.push({ label: 'Tóc', value: hairPrice }); total += hairPrice; }

    const hatPrice = config.characters.reduce((acc, char) => acc + (char.hat?.price || 0), 0);
    if(hatPrice > 0) { breakdown.push({ label: 'Mũ', value: hatPrice }); total += hatPrice; }

    const shirtPrice = config.characters.reduce((acc, char) => acc + (char.shirt?.price || 0) + (char.selectedShirtColor?.price || 0), 0);
    if(shirtPrice > 0) { total += shirtPrice; breakdown.push({ label: 'Áo & Màu', value: shirtPrice }); }

    const pantsPrice = config.characters.reduce((acc, char) => acc + (char.pants?.price || 0) + (char.selectedPantsColor?.price || 0), 0);
    if(pantsPrice > 0) { total += pantsPrice; breakdown.push({ label: 'Quần & Màu', value: pantsPrice }); }

    const accessoryPrice = config.draggableItems.filter(i => i.type === 'accessory').reduce((acc, item) => acc + (allParts[item.partId]?.price || 0), 0);
    if(accessoryPrice > 0) { total += accessoryPrice; breakdown.push({ label: 'Phụ kiện', value: accessoryPrice }); }
    
    const petPrice = config.draggableItems.filter(i => i.type === 'pet').reduce((acc, item) => acc + (allParts[item.partId]?.price || 0), 0);
    if(petPrice > 0) { total += petPrice; breakdown.push({ label: 'Thú cưng', value: petPrice }); }

    return { totalPrice: total, priceBreakdown: breakdown };
};


type Transform = { x: number; y: number; rotation: number; scale: number; width?: number };

const StepIndicator: React.FC<{ currentStep: number; setStep: (step: number) => void }> = ({ currentStep, setStep }) => {
  const steps = ['Thông tin SP', 'Nền & Chữ', 'Thiết kế', 'Mua hàng'];
  return (
    <div className="flex items-center space-x-2 sm:space-x-4 my-4 overflow-x-auto no-scrollbar pb-2">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;

        return(
          <button
            key={index}
            onClick={() => setStep(stepNumber)}
            className={`flex flex-shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
              isActive ? 'bg-luvin-pink text-white' : isCompleted ? 'bg-gray-300 text-gray-700' : 'bg-white text-gray-500 border border-gray-300'
            }`}
          >
            <div className={`w-4 h-4 flex items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-white text-luvin-pink' : 'bg-gray-400 text-white'}`}>
              {stepNumber}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Step1Frame: React.FC<{ config: FrameConfig; setConfig: React.Dispatch<React.SetStateAction<FrameConfig>> }> = ({ config, setConfig }) => {
  const selectedFrame = FRAME_OPTIONS.find(f => f.id === config.frameId) || FRAME_OPTIONS[0];
  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">CHỌN KÍCH THƯỚC</h4>
        <div className="grid grid-cols-3 gap-3">
          {FRAME_OPTIONS.map(frame => (
            <button
              key={frame.id}
              onClick={() => setConfig(prev => ({ ...prev, frameId: frame.id }))}
              className={`border rounded-lg py-2 px-1 text-xs sm:text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center h-16 ${
                config.frameId === frame.id ? 'bg-luvin-pink text-gray-800 border-luvin-pink' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
            >
              <span>{frame.name}</span>
              <span className="font-normal opacity-80 mt-1">{formatCurrency(frame.price)}</span>
            </button>
          ))}
        </div>
      </div>
       {selectedFrame && (
        <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3">GIÁ CƠ BẢN BAO GỒM</h4>
            <ul className="text-sm list-disc list-inside text-gray-600 space-y-1">
                <li>1 Khung ảnh composite cao cấp.</li>
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
    bg: { name: string; url: string };
    isSelected: boolean;
    onClick: () => void;
}> = ({ bg, isSelected, onClick }) => {
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
            className={`border-2 rounded-xl p-1.5 flex flex-col items-center justify-start gap-1.5 transition-all text-center w-full ${
                isSelected
                    ? 'border-luvin-pink bg-pink-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="w-full aspect-[4/5] rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex flex-col justify-center items-center flex-shrink-0 h-9 leading-tight">
                <span className="text-[11px] font-semibold text-gray-700">{line1}</span>
                {line2 && <span className="text-[11px] font-semibold text-gray-700">{line2}</span>}
            </div>
        </button>
    );
};


const Step2BackgroundAndDecorations: React.FC<{
  config: FrameConfig;
  setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>;
  addText: () => void;
  addCharm: (dataUrl: string) => void;
  allBackgrounds: AllBackgrounds | null;
}> = ({ config, setConfig, addText, addCharm, allBackgrounds }) => {
  const bgUploadRef = useRef<HTMLInputElement>(null);
  const charmUploadRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const availableBackgrounds = useMemo(() => {
    if (!allBackgrounds) return [];
    const isSquare = config.frameId === 'sm' || config.frameId === 'lg';
    return (isSquare ? allBackgrounds.square : allBackgrounds.rectangle).filter(bg => bg.isVisible);
  }, [config.frameId, allBackgrounds]);

  const categories = useMemo(() => {
    return ['Tất cả', ...Array.from(new Set(availableBackgrounds.map(bg => bg.category)))];
  }, [availableBackgrounds]);

  const filteredBackgrounds = useMemo(() => {
    if (selectedCategory === 'Tất cả') {
      return availableBackgrounds;
    }
    return availableBackgrounds.filter(bg => bg.category === selectedCategory);
  }, [selectedCategory, availableBackgrounds]);

  useEffect(() => {
    // Reset category if it's no longer available for the selected frame size
    if (!categories.includes(selectedCategory)) {
        setSelectedCategory('Tất cả');
    }
  }, [categories, selectedCategory]);

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setConfig((prev) => ({ ...prev, background: { type: 'upload', value: event.target.result as string } }));
        }
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCharmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          addCharm(event.target.result as string);
        }
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">A. CHỌN MẪU NỀN CÓ SẴN</h4>
        
        <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                            selectedCategory === category
                                ? 'bg-luvin-pink text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2 min-h-[150px]">
          {filteredBackgrounds.length > 0 ? (
            filteredBackgrounds.map((bg) => (
              <PresetBackgroundButton
                key={bg.name}
                bg={bg}
                isSelected={config.background.value === bg.url}
                onClick={() => setConfig((prev) => ({ ...prev, background: { type: 'image', value: bg.url } }))}
              />
            ))
          ) : (
            <p className="col-span-3 text-center text-sm text-gray-500 py-10">
              Không có mẫu nào phù hợp với lựa chọn của bạn.
            </p>
          )}
        </div>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">B. HOẶC TẢI ẢNH CỦA BẠN</h4>
        <button onClick={() => bgUploadRef.current?.click()} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">
          Tải ảnh nền
        </button>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-2">C. THÊM CHỮ & TRANG TRÍ</h4>
        <p className="text-sm text-gray-600 mb-3">Chỉnh sửa trực tiếp trên khung xem trước.</p>
        <div className="flex gap-2">
            <button onClick={addText} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">
              + Thêm chữ mới
            </button>
            <button onClick={() => charmUploadRef.current?.click()} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">
              Tải ảnh nhỏ
            </button>
        </div>
      </div>
      <input type="file" ref={bgUploadRef} accept="image/*" onChange={handleBgFileUpload} className="hidden" />
      <input type="file" ref={charmUploadRef} accept="image/*" onChange={handleCharmFileUpload} className="hidden" />
    </div>
  );
};

const PartButton: React.FC<{
    part: LegoPart;
    isSelected: boolean;
    onClick: () => void;
}> = ({ part, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`border rounded-lg p-1.5 flex flex-col items-center justify-start gap-1 transition-all text-center w-full ${
                isSelected
                    ? 'border-luvin-pink bg-pink-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="w-full aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                <img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center items-center flex-shrink-0 h-10 leading-tight">
                <span className="text-[11px] font-semibold text-gray-800">{part.name}</span>
                <span className="text-[11px] font-bold text-luvin-pink">{formatCurrency(part.price)}</span>
            </div>
        </button>
    );
};


const Step3Characters: React.FC<{ config: FrameConfig; setConfig: React.Dispatch<React.SetStateAction<FrameConfig>> }> = ({ config, setConfig }) => {
    const [activeCharId, setActiveCharId] = useState<number | null>(config.characters[0]?.id || null);
    const [activePartType, setActivePartType] = useState<'shirt' | 'pants' | 'face' | 'hair' | 'hat'>('shirt');
    const activeCharacter = config.characters.find(c => c.id === activeCharId);
    const [printDialogCharId, setPrintDialogCharId] = useState<number | null>(null);

     useEffect(() => {
        if (!config.characters.find(c => c.id === activeCharId)) {
            setActiveCharId(config.characters[config.characters.length - 1]?.id || null);
        }
     }, [config.characters, activeCharId]);

    const handleAddChar = () => {
        const newId = Date.now();
        const newCharacter: LegoCharacterConfig = {
            id: newId, 
            shirt: LEGO_PARTS.shirt[0], 
            pants: LEGO_PARTS.pants[0],
            face: LEGO_PARTS.face[0],
            hair: undefined, // Default is no hair
            x: 30 + (config.characters.length % 3) * 20, 
            y: 75, 
            rotation: 0, 
            scale: 1,
            selectedShirtColor: LEGO_PARTS.shirt[0].colors?.[0],
            selectedPantsColor: LEGO_PARTS.pants[0].colors?.[0],
        };
        setConfig(prev => ({ ...prev, characters: [...prev.characters, newCharacter] }));
        setActiveCharId(newId);
    };
    
    const handleRemoveChar = (id: number) => {
        setConfig(prev => ({...prev, characters: prev.characters.filter(c => c.id !== id)}));
    };
    
    const handlePartSelect = (part: LegoPart | undefined) => {
        if (!activeCharId || !part) return;
        setConfig(prev => ({
            ...prev,
            characters: prev.characters.map(c => {
                if (c.id === activeCharId) {
                    const newChar = { ...c, [part.type]: part };
                    if (part.type === 'shirt') newChar.selectedShirtColor = part.colors?.[0];
                    if (part.type === 'pants') newChar.selectedPantsColor = part.colors?.[0];
                    if (part.type === 'hair') newChar.hat = undefined;
                    if (part.type === 'hat') newChar.hair = undefined;
                    return newChar;
                }
                return c;
            })
        }));
    };

    const handlePartDeselect = (partType: 'hair' | 'hat') => {
      if (!activeCharId) return;
      setConfig(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === activeCharId ? { ...c, [partType]: undefined } : c)
      }));
    }
    
    const addDraggableItem = (part: LegoPart) => {
        if (part.type !== 'accessory' && part.type !== 'pet') return;
        const newItem: DraggableItem = {
            id: Date.now(), partId: part.id, type: part.type, x: 50 + (Math.random() - 0.5) * 20, y: 50 + (Math.random() - 0.5) * 20, rotation: 0, scale: 1,
        };
        setConfig(prev => ({...prev, draggableItems: [...prev.draggableItems, newItem]}));
    }

    const handleCustomPrintSelect = (price: number) => {
      if (!printDialogCharId) return;
      setConfig(prev => ({
        ...prev,
        characters: prev.characters.map(c => 
          c.id === printDialogCharId ? { ...c, customPrintPrice: price } : c
        )
      }));
      setPrintDialogCharId(null);
    };

    const handleColorSelect = (partType: 'shirt' | 'pants', color: OutfitColor) => {
        if (!activeCharId) return;
        const key = partType === 'shirt' ? 'selectedShirtColor' : 'selectedPantsColor';
        setConfig(prev => ({
            ...prev,
            characters: prev.characters.map(c => c.id === activeCharId ? { ...c, [key]: color } : c)
        }));
    }
    
    const partTypes: { key: 'shirt' | 'pants' | 'face' | 'hair' | 'hat', label: string }[] = [
        { key: 'shirt', label: 'Áo' },
        { key: 'pants', label: 'Quần' },
        { key: 'face', label: 'Mặt' },
        { key: 'hair', label: 'Tóc' },
        { key: 'hat', label: 'Mũ' },
    ];

    const currentPartList = LEGO_PARTS[activePartType] || [];

    return (
        <div className="space-y-4">
            {printDialogCharId && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                  <h3 className="font-bold text-lg mb-2">Chọn chất lượng in</h3>
                  <p className="text-sm text-gray-600 mb-4">In theo yêu cầu sẽ có chi phí cao hơn. Vui lòng chọn chất lượng mong muốn cho nhân vật này.</p>
                  <div className="space-y-2">
                    <button onClick={() => handleCustomPrintSelect(150000)} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300">In thường - {formatCurrency(150000)}</button>
                    <button onClick={() => handleCustomPrintSelect(300000)} className="w-full bg-luvin-pink text-gray-800 font-semibold py-2 rounded-lg hover:opacity-90">In cao cấp - {formatCurrency(300000)}</button>
                    {config.characters.find(c => c.id === printDialogCharId)?.customPrintPrice && 
                      <button onClick={() => handleCustomPrintSelect(0)} className="w-full bg-red-100 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-200">Bỏ in yêu cầu</button>
                    }
                  </div>
                  <button onClick={() => setPrintDialogCharId(null)} className="text-xs text-gray-500 mt-4 hover:underline">Hủy</button>
                </div>
              </div>
            )}
            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">QUẢN LÝ NHÂN VẬT</h4>
                <div className="flex items-center gap-2 flex-wrap">
                    {config.characters.map((char, index) => (
                        <div key={char.id} className="relative">
                            <button onClick={() => setActiveCharId(char.id)} className={`px-4 py-2 text-sm rounded-lg font-medium ${activeCharId === char.id ? 'bg-pink-100 text-luvin-pink border border-luvin-pink' : 'bg-gray-200 text-gray-800'}`}>
                                NV {index + 1}
                            </button>
                            <button onClick={() => handleRemoveChar(char.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">
                                &times;
                            </button>
                        </div>
                    ))}
                    <button onClick={handleAddChar} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg font-medium">+ Thêm ({formatCurrency(CHARACTER_BASE_PRICE)})</button>
                </div>
                {activeCharacter && 
                  <div className="mt-4 pt-4 border-t">
                    <button onClick={() => setPrintDialogCharId(activeCharacter.id)} className="text-sm text-blue-600 hover:underline font-semibold">
                      {activeCharacter.customPrintPrice ? `Đang chọn in yêu cầu (${formatCurrency(activeCharacter.customPrintPrice)}) - Thay đổi?` : 'Thêm tuỳ chọn in theo yêu cầu?'}
                    </button>
                  </div>
                }
                {config.characters.length > 0 && !activeCharacter && <p className="text-sm text-center text-gray-500 mt-2">Hãy chọn một nhân vật để bắt đầu thiết kế.</p>}
                {config.characters.length === 0 && <p className="text-sm text-center text-gray-500 mt-2">Chưa có nhân vật nào. Hãy thêm một nhân vật!</p>}
            </div>

            {activeCharacter && (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4">
                        {partTypes.map(pt => (
                            <button key={pt.key} onClick={() => setActivePartType(pt.key)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${activePartType === pt.key ? 'bg-luvin-pink text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {pt.label}
                            </button>
                        ))}
                    </div>
                     <div className="grid grid-cols-4 gap-2">
                         {(activePartType === 'hair' || activePartType === 'hat') && (
                             <button onClick={() => handlePartDeselect(activePartType as 'hair' | 'hat')} className="border-2 border-dashed border-gray-300 rounded-lg p-1.5 flex flex-col items-center justify-center gap-1 transition-colors text-center w-full h-full min-h-[100px] text-gray-500 hover:bg-gray-100 hover:border-gray-400">
                               <span className="text-2xl font-bold">&times;</span>
                               <span className="text-[11px] font-semibold">Không chọn</span>
                             </button>
                         )}
                        {currentPartList.map(part => (
                            <PartButton 
                                key={part.id} 
                                part={part}
                                isSelected={activeCharacter[activePartType]?.id === part.id}
                                onClick={() => handlePartSelect(part)} 
                            />
                        ))}
                    </div>

                    {(activePartType === 'shirt' && activeCharacter.shirt?.colors) && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-bold text-gray-600 block mb-2">Chỉnh màu áo</label>
                         <div className="flex flex-wrap gap-2">
                           {activeCharacter.shirt.colors.map(color => (
                             <button
                               key={color.name}
                               onClick={() => handleColorSelect('shirt', color)}
                               className={`w-8 h-8 rounded-full border-2 transition-all ${activeCharacter.selectedShirtColor?.imageUrl === color.imageUrl ? 'border-luvin-pink scale-110' : 'border-white'}`}
                               style={{ backgroundColor: color.hex }}
                               title={`${color.name} (${formatCurrency(color.price)})`}
                             />
                           ))}
                         </div>
                      </div>
                    )}
                    {(activePartType === 'pants' && activeCharacter.pants?.colors) && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-bold text-gray-600 block mb-2">Chỉnh màu quần</label>
                         <div className="flex flex-wrap gap-2">
                           {activeCharacter.pants.colors.map(color => (
                             <button
                               key={color.name}
                               onClick={() => handleColorSelect('pants', color)}
                               className={`w-8 h-8 rounded-full border-2 transition-all ${activeCharacter.selectedPantsColor?.imageUrl === color.imageUrl ? 'border-luvin-pink scale-110' : 'border-white'}`}
                               style={{ backgroundColor: color.hex }}
                               title={`${color.name} (${formatCurrency(color.price)})`}
                             />
                           ))}
                         </div>
                      </div>
                    )}
                </div>
            )}
            
            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">THÊM PHỤ KIỆN</h4>
                <div className="grid grid-cols-4 gap-2">
                    {LEGO_PARTS.accessory.map(part => (
                        <PartButton key={part.id} part={part} isSelected={false} onClick={() => addDraggableItem(part)} />
                    ))}
                </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">THÊM THÚ CƯNG</h4>
                <div className="grid grid-cols-4 gap-2">
                    {LEGO_PARTS.pet.map(part => (
                        <PartButton key={part.id} part={part} isSelected={false} onClick={() => addDraggableItem(part)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const Step4Summary: React.FC<{ totalPrice: number; priceBreakdown: {label: string, value: number}[]; frameName: string; charCount: number; onAddToCart: () => void; onBuyNow: () => void; isSaving: boolean; }> = ({ totalPrice, priceBreakdown, frameName, charCount, onAddToCart, onBuyNow, isSaving }) => {

  return (
    <div>
        <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">THÔNG TIN KHUNG</h4>
            <div className="space-y-1 text-sm text-gray-700 mb-4">
                <p><strong>Kích thước:</strong> {frameName}</p>
                <p><strong>Số nhân vật:</strong> {charCount}</p>
            </div>
            
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">GIÁ DỰ KIẾN</h4>
            <div className="space-y-1 text-sm text-gray-700">
                {priceBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value > 0 ? formatCurrency(item.value) : 'Miễn phí'}</span>
                    </div>
                ))}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between text-base font-bold text-gray-800">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(totalPrice)}</span>
                </div>
            </div>
        </div>
        <div className="mt-4 space-y-3">
            <button onClick={onAddToCart} disabled={isSaving} className="w-full bg-pink-100 text-luvin-pink border border-luvin-pink font-bold py-3 rounded-lg text-base hover:bg-pink-200 transition-colors disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
            </button>
            <button onClick={onBuyNow} disabled={isSaving} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 rounded-lg text-base hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Đang xử lý...' : 'Mua ngay & Thanh toán'}
            </button>
        </div>
    </div>
  );
};

const Header: React.FC<{ navigateTo: (page: Page) => void; cartCount: number; onCartClick: () => void; }> = ({ navigateTo, cartCount, onCartClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);
  
  const navItems: { label: string; page: Page }[] = [
    { label: 'Trang chủ', page: 'home' }, { label: 'Thiết kế', page: 'builder' }, { label: 'Bộ sưu tập', page: 'collection' }, { label: 'Tra cứu', page: 'order-lookup' },
  ];
  
  const handleNav = (page: Page) => { navigateTo(page); setIsMenuOpen(false); }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-4xl font-heading text-luvin-pink cursor-pointer" onClick={() => handleNav('home')}>The Luvin</div>
          <div className="hidden md:flex items-center space-x-6 font-body">
            {navItems.map(item => (
              <button key={item.page} onClick={() => handleNav(item.page)} className="text-gray-800 hover:text-luvin-pink transition-colors font-semibold text-sm">
                {item.label}
              </button>
            ))}
            <button onClick={onCartClick} className="relative text-gray-800 hover:text-luvin-pink transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {cartCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button onClick={onCartClick} className="relative text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="text-gray-800 focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </nav>
      </header>

      {/* FIX: Mobile menu is now outside the sticky header to prevent stacking context issues */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isMenuOpen}
      >
        <div 
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div className={`absolute top-0 right-0 h-full w-4/5 max-w-xs bg-white transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              <div className="p-5 flex justify-end">
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-800">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="flex flex-col items-start space-y-6 p-8 font-body">
                  {navItems.map(item => ( 
                    <button 
                      key={item.page} 
                      onClick={() => handleNav(item.page)} 
                      className="text-gray-800 hover:text-luvin-pink text-xl font-semibold"
                    >
                      {item.label}
                    </button> 
                  ))}
              </div>
            </div>
        </div>
      </div>
    </>
  );
};

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-instagram"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
)

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
)

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-gray-800 mt-auto font-body text-sm">
        <div className="bg-gray-100 py-2">
            <div className="container mx-auto px-6 text-center text-gray-500 text-xs tracking-widest">
                <span>LEGO</span>
                <span className="mx-2">|</span>
                <span>QUÀ TẶNG</span>
                <span className="mx-2">|</span>
                <span>KỶ NIỆM</span>
                <span className="mx-2">|</span>
                <span>TÌNH YÊU</span>
            </div>
        </div>
        <div className="container mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h3 className="font-bold text-base mb-3">THE LUVIN - KHUNG ẢNH LEGO THIẾT KẾ</h3>
                    <p className="text-gray-600">Địa chỉ: Khu 6, Thư Lâm, Hà Nội</p>
                    <p className="text-gray-600">Hotline: 0964 393 115</p>
                    <p className="text-gray-600">Email: theluvin.gifts@gmail.com</p>
                </div>
                <div>
                    <h3 className="font-bold text-base mb-3">MORE ABOUT US</h3>
                    <div className="flex space-x-4">
                        <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300"><InstagramIcon /></a>
                        <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300"><FacebookIcon /></a>
                    </div>
                </div>
            </div>
        </div>
        <div className="border-t border-gray-200">
            <div className="container mx-auto px-6 py-4 text-center text-xs text-gray-500">
                <p>Copyright © {new Date().getFullYear()} The Luvin. All Rights Reserved.</p>
            </div>
        </div>
    </footer>
  );
};

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


const TextEditor: React.FC<{
    activeText: TextConfig;
    setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>;
    selectedTextId: number;
    deselect: () => void;
}> = ({ activeText, setConfig, selectedTextId, deselect }) => {
    
    const updateActiveText = (updates: Partial<TextConfig>) => {
        setConfig(prev => ({
            ...prev,
            texts: prev.texts.map((t) => t.id === selectedTextId ? { ...t, ...updates } : t)
        }));
    }
    
    return (
        <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">CHỈNH SỬA CHỮ</h3>
                <button onClick={deselect} className="text-sm font-body bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300">Xong</button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1">Nội dung</label>
                    <textarea
                        value={activeText.content}
                        onChange={e => updateActiveText({ content: e.target.value })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                        placeholder="Nhập nội dung văn bản..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-1">Font chữ</label>
                        <select value={activeText.font} onChange={e => updateActiveText({font: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
                            <option value="Playfair Display">Font Playfair</option>
                            <option value="Montserrat">Font Montserrat</option>
                            <option value="Serif">Font Serif</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-600 block mb-1">Màu chữ</label>
                        <input type="color" value={activeText.color} onChange={e => updateActiveText({color: e.target.value})} className="h-10 w-full p-0.5 bg-white rounded-lg border border-gray-300"/>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1">Cỡ chữ</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="120" 
                      value={activeText.size} 
                      onChange={e => updateActiveText({ size: parseInt(e.target.value)})} 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <button onClick={() => updateActiveText({background: !activeText.background})} className={`text-sm px-3 py-2 rounded-lg ${activeText.background ? 'bg-luvin-pink text-gray-800' : 'bg-gray-200 text-gray-800'}`}>
                      {activeText.background ? 'Bỏ nền mờ' : 'Thêm nền mờ'}
                    </button>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                        {(['left', 'center', 'right'] as const).map(align => (
                           <button key={align} onClick={() => updateActiveText({ textAlign: align })} className={`px-3 py-1 text-sm ${activeText.textAlign === align ? 'bg-luvin-pink text-gray-800' : 'bg-white text-gray-800'}`}>
                             {align.charAt(0).toUpperCase()}
                           </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const BuilderPage: React.FC<{ 
    config: FrameConfig; 
    setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>; 
    navigateTo: (p:Page) => void; 
    onAddToCart: (config: FrameConfig) => void; 
    showToast: (message: string, type: 'success' | 'error') => void;
    allBackgrounds: AllBackgrounds | null;
}> = ({ config, setConfig, navigateTo, onAddToCart, showToast, allBackgrounds }) => {
  const [step, setStep] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const previewContainerParentRef = useRef<HTMLDivElement>(null);
  const frameCaptureRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(480);
  const [isSaving, setIsSaving] = useState(false);

  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const scrollYRef = useRef(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 20;
      
      // Hide bar when scrolling down, unless at the very bottom
      if (currentScrollY > scrollYRef.current && currentScrollY > 150 && !isAtBottom) {
        setIsBottomBarVisible(false);
      } else {
        // Show bar when scrolling up, at the top, or at the bottom
        setIsBottomBarVisible(true);
      }
      scrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        setPreviewWidth(width > 520 ? 520 : width);
      }
    });

    if (previewContainerParentRef.current) {
      observer.observe(previewContainerParentRef.current);
    }

    return () => {
      if (previewContainerParentRef.current) {
        observer.unobserve(previewContainerParentRef.current);
      }
    };
  }, []);
  
  // FIX: Correctly type and memoize the allParts object.
  const allParts = useMemo(() => Object.values(LEGO_PARTS).flat().reduce((acc: Record<string, LegoPart>, part: LegoPart) => {
    acc[part.id] = part;
    return acc;
  }, {}), []);


  const { totalPrice, priceBreakdown } = useMemo(() => calculatePrice(config, allParts), [config, allParts]);
  
  const selectedText = useMemo(() => {
    if (selectedItemId?.startsWith('text-')) {
        const id = parseInt(selectedItemId.split('-')[1], 10);
        return config.texts.find(t => t.id === id) || null;
    }
    return null;
  }, [selectedItemId, config.texts]);

  const handleItemTransform = useCallback((id: string, newTransform: Transform) => {
      const [type, ...rest] = id.split('-');
      const rawId = rest.join('-');
      
      setConfig(prev => {
          if (type === 'text') {
              const idToUpdate = parseInt(rawId);
              return { ...prev, texts: prev.texts.map(item => item.id === idToUpdate ? { ...item, ...newTransform } : item) };
          }
          const itemId = parseInt(rawId);
          if (type === 'character') return { ...prev, characters: prev.characters.map(item => item.id === itemId ? { ...item, ...newTransform } : item) };
          if (type === 'item') return { ...prev, draggableItems: prev.draggableItems.map(item => item.id === itemId ? { ...item, ...newTransform } : item) };
          return prev;
      });
  }, [setConfig]);

  const handleItemDelete = useCallback((id: string) => {
    const [type, ...rest] = id.split('-');
    const rawId = rest.join('-');
    
    setSelectedItemId(null);

    setConfig(prev => {
        if (type === 'text') {
            const idToDelete = parseInt(rawId);
            return { ...prev, texts: prev.texts.filter(t => t.id !== idToDelete) };
        }
        const itemId = parseInt(rawId);
        if (type === 'character') return { ...prev, characters: prev.characters.filter(item => item.id !== itemId) };
        if (type === 'item') return { ...prev, draggableItems: prev.draggableItems.filter(item => item.id !== itemId) };
        return prev;
    });
  }, [setConfig]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
            handleItemDelete(selectedItemId);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleItemDelete]);

  const handleTextUpdate = useCallback((id: number, updates: Partial<TextConfig>) => {
    setConfig(prev => ({
        ...prev,
        texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  }, [setConfig]);
  
  const addText = () => {
      const newId = Date.now();
      const newText: TextConfig = { id: newId, content: 'Nhập chữ...', font: 'Montserrat', size: 12, color: '#333333', x: 50, y: 50, rotation: 0, scale: 1, background: true, textAlign: 'center', width: 200 };
      setConfig(prev => ({...prev, texts: [...prev.texts, newText]}));
      setSelectedItemId(`text-${newId}`);
  };

  const addCharm = (dataUrl: string) => {
      const newCharm: DraggableItem = { id: Date.now(), partId: dataUrl, type: 'charm', x: 50, y: 50, rotation: 0, scale: 0.5 };
      setConfig(prev => ({...prev, draggableItems: [...prev.draggableItems, newCharm]}));
  }
  
  const captureFrameAsImage = async (): Promise<string> => {
    return new Promise((resolve) => {
      const originalSelectedId = selectedItemId;
      setSelectedItemId(null); // Deselect to hide controls

      setTimeout(async () => {
        const element = frameCaptureRef.current;
        if (element && typeof html2canvas !== 'undefined') {
          try {
            const canvas = await html2canvas(element, {
              backgroundColor: null, // Transparent background
              logging: false,
              useCORS: true,
              ignoreElements: (el) => el.classList.contains('transform-handle'),
            });
            resolve(canvas.toDataURL('image/png'));
          } catch (error) {
            console.error('Error capturing frame:', error);
            resolve('');
          } finally {
            setSelectedItemId(originalSelectedId); // Reselect item
          }
        } else {
          resolve('');
          setSelectedItemId(originalSelectedId); // Reselect item
        }
      }, 50); // Small delay to allow DOM to update
    });
  };

  const handleAddToCart = async () => {
      setIsSaving(true);
      const imageUrl = await captureFrameAsImage();
      setIsSaving(false);
      if(imageUrl) {
        onAddToCart({ ...config, previewImageUrl: imageUrl });
      } else {
        showToast('Đã có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
      }
  };

  const handleBuyNow = async () => {
    setIsSaving(true);
    const imageUrl = await captureFrameAsImage();
    setIsSaving(false);
    if(imageUrl) {
      onAddToCart({ ...config, previewImageUrl: imageUrl });
      navigateTo('checkout');
    } else {
      showToast('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return <Step1Frame config={config} setConfig={setConfig} />;
      case 2: return <Step2BackgroundAndDecorations config={config} setConfig={setConfig} addText={addText} addCharm={addCharm} allBackgrounds={allBackgrounds} />;
      case 3: return <Step3Characters config={config} setConfig={setConfig} />;
      case 4: return <Step4Summary totalPrice={totalPrice} priceBreakdown={priceBreakdown} frameName={FRAME_OPTIONS.find(f => f.id === config.frameId)?.name || ''} charCount={config.characters.length} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} isSaving={isSaving} />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="text-sm text-gray-500 mb-2">
            <button onClick={() => navigateTo('home')} className="hover:underline">Home</button> / Thiết kế & Mua hàng
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Thiết kế & Mua hàng Khung LEGO</h1>
        <StepIndicator currentStep={step} setStep={setStep} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          <div className="lg:col-span-7" ref={previewContainerParentRef}>
            <div className="lg:sticky lg:top-24">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">ẢNH XEM TRƯỚC</h3>
                <div className="bg-gray-100 rounded-lg flex items-center justify-center aspect-square overflow-hidden p-4">
                    <FramePreview 
                        ref={frameCaptureRef}
                        config={config} 
                        containerWidth={previewWidth - 32} // Account for padding
                        onItemTransform={handleItemTransform} 
                        onTextUpdate={handleTextUpdate}
                        className="w-full h-full"
                        selectedItemId={selectedItemId}
                        setSelectedItemId={setSelectedItemId}
                    />
                </div>
                <div className="h-10 mt-4"></div>
            </div>
          </div>

          <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                  {selectedText ? (
                      <TextEditor 
                          activeText={selectedText}
                          setConfig={setConfig}
                          selectedTextId={selectedText.id}
                          deselect={() => setSelectedItemId(null)}
                      />
                  ) : (
                      <>
                          <div className="min-h-[400px]">
                              {renderStepContent()}
                          </div>
                      </>
                  )}
              </div>
              
              {!selectedText && (
                <>
                  <div className="mt-4 text-right font-bold text-lg text-gray-800">
                    Giá tạm tính: <span className="text-luvin-pink">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="mt-2 hidden lg:flex items-center gap-4">
                      <button
                          onClick={() => setStep(s => Math.max(1, s - 1))}
                          disabled={step === 1}
                          className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors"
                      >
                          &larr; Quay lại
                      </button>
                      <button
                          onClick={() => setStep(s => Math.min(4, s + 1))}
                          disabled={step === 4}
                          className="w-full bg-luvin-pink text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors"
                      >
                          Tiếp theo
                      </button>
                  </div>
                </>
              )}
               <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-top p-4 z-30 transition-transform duration-300 ease-in-out ${isBottomBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                     <div className="text-right font-bold text-base text-gray-800 mb-2">
                        Giá tạm tính: <span className="text-luvin-pink">{formatCurrency(totalPrice)}</span>
                      </div>
                     <div className="flex items-center gap-4">
                       <button
                          onClick={() => setStep(s => Math.max(1, s - 1))}
                          disabled={step === 1}
                          className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors"
                      >
                          Quay lại
                      </button>
                      <button
                          onClick={() => setStep(s => Math.min(4, s + 1))}
                          disabled={step === 4}
                          className="w-full bg-luvin-pink text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors"
                      >
                          Tiếp theo
                      </button>
                     </div>
                </div>
               <div className="lg:hidden h-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectionPage: React.FC<{ navigateTo: (page: Page) => void, setConfig: React.Dispatch<React.SetStateAction<FrameConfig>> }> = ({ navigateTo, setConfig }) => {
    const handleCustomize = (config: FrameConfig) => { setConfig(config); navigateTo('builder'); };
    return ( <div className="container mx-auto px-6 py-8"><h1 className="text-5xl font-heading text-center text-luvin-pink mb-8">Bộ sưu tập The Luvin</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{COLLECTION_TEMPLATES.map((template, index) => ( <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden group"><div className="relative"><img src={template.imageUrl} alt={template.name} className="w-full h-72 object-cover" /><div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center"><button onClick={() => handleCustomize(template.config)} className="bg-white/80 text-luvin-pink font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-body">Tùy chỉnh mẫu này</button></div></div><div className="p-6"><h3 className="text-2xl font-bold font-body text-luvin-pink">{template.name}</h3></div></div> ))}</div></div> );
}

const CartPage: React.FC<{ cartItems: FrameConfig[]; onRemoveItem: (index: number) => void; allParts: Record<string, LegoPart>; navigateTo: (page: Page) => void;}> = ({ cartItems, onRemoveItem, allParts, navigateTo }) => {
    const totalCartPrice = cartItems.reduce((total, item) => total + calculatePrice(item, allParts).totalPrice, 0);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-5xl font-heading text-center text-luvin-pink mb-8">Giỏ hàng của bạn</h1>
            {cartItems.length === 0 ? (
                <p className="text-center text-gray-600 font-body text-lg">Giỏ hàng của bạn đang trống.</p>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-6">
                        {cartItems.map((item, index) => {
                            const { totalPrice } = calculatePrice(item, allParts);
                            const frame = FRAME_OPTIONS.find(f => f.id === item.frameId) || FRAME_OPTIONS[0];
                            return (
                                <div key={index} className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-40 h-40 flex-shrink-0 bg-gray-100 rounded-md p-2">
                                      {item.previewImageUrl ? (
                                        <img src={item.previewImageUrl} alt="Design Preview" className="w-full h-full object-contain" />
                                      ) : (
                                        <FramePreview config={item} containerWidth={144} onItemTransform={() => {}} onTextUpdate={() => {}} selectedItemId={null} setSelectedItemId={() => {}} isInteractive={false} />
                                      )}
                                    </div>
                                    <div className="flex-grow text-center sm:text-left">
                                        <h3 className="font-bold text-lg font-body text-luvin-pink">Khung tùy chỉnh</h3>
                                        <p className="text-sm text-gray-600">Kích thước: {frame.name}</p>
                                        <p className="text-sm text-gray-600">Số nhân vật: {item.characters.length}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-center sm:text-right">
                                        <p className="font-bold text-lg text-luvin-pink">{formatCurrency(totalPrice)}</p>
                                        <button onClick={() => onRemoveItem(index)} className="text-sm text-red-500 hover:underline mt-1">Xóa</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center text-2xl font-bold font-body text-luvin-pink">
                            <span>Tổng cộng:</span>
                            <span>{formatCurrency(totalCartPrice)}</span>
                        </div>
                        <button onClick={() => navigateTo('checkout')} className="mt-4 w-full bg-luvin-pink text-gray-800 font-bold py-3 rounded-lg text-lg hover:opacity-90 transition-colors">
                            Tiến hành thanh toán
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CartPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cartItems: FrameConfig[];
  onRemoveItem: (index: number) => void;
  allParts: Record<string, LegoPart>;
  navigateTo: (page: Page) => void;
}> = ({ isOpen, onClose, cartItems, onRemoveItem, allParts, navigateTo }) => {
  const subtotal = cartItems.reduce((total, item) => total + calculatePrice(item, allParts).totalPrice, 0);

  const handleCheckout = () => {
    onClose();
    navigateTo('checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigateTo('cart');
  }

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'bg-black/40' : 'bg-transparent pointer-events-none'}`}>
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Giỏ hàng</h2>
          <button onClick={onClose} className="p-1">&times;</button>
        </div>
        {cartItems.length === 0 ? (
          <p className="flex-grow flex items-center justify-center text-gray-500">Giỏ hàng trống.</p>
        ) : (
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {cartItems.map((item, index) => {
              const { totalPrice } = calculatePrice(item, allParts);
              const frame = FRAME_OPTIONS.find(f => f.id === item.frameId) || FRAME_OPTIONS[0];
              return (
                <div key={index} className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded p-1">
                     {item.previewImageUrl ? (
                        <img src={item.previewImageUrl} alt="Design Preview" className="w-full h-full object-contain" />
                      ) : (
                        <FramePreview config={item} containerWidth={72} isInteractive={false} onItemTransform={()=>{}} onTextUpdate={()=>{}} selectedItemId={null} setSelectedItemId={()=>{}} />
                      )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-semibold">Khung LEGO tùy chỉnh</h3>
                    <p className="text-xs text-gray-500">{frame.name}</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(totalPrice)}</p>
                  </div>
                  <button onClick={() => onRemoveItem(index)} className="text-red-500 self-start p-1 text-lg">&times;</button>
                </div>
              );
            })}
          </div>
        )}
        <div className="p-4 border-t space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleViewCart} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded hover:bg-gray-300">View cart</button>
            <button onClick={handleCheckout} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 rounded hover:opacity-90">Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddressAPIResponse {
    name: string;
    code: number;
    division_type: string;
    codename: string;
    province_code?: number;
    districts?: AddressAPIResponse[];
    wards?: AddressAPIResponse[];
}

const CheckoutPage: React.FC<{ cartItems: FrameConfig[]; allParts: Record<string, LegoPart>; onConfirmOrder: (details: OrderDetails) => void; }> = ({ cartItems, allParts, onConfirmOrder }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [desiredDeliveryDate, setDesiredDeliveryDate] = useState('');
    
    const [provinces, setProvinces] = useState<AddressAPIResponse[]>([]);
    const [districts, setDistricts] = useState<AddressAPIResponse[]>([]);
    const [wards, setWards] = useState<AddressAPIResponse[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<{code: number, name: string} | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<{code: number, name: string} | null>(null);
    const [selectedWard, setSelectedWard] = useState<{code: number, name: string} | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<'deposit' | 'full'>('deposit');
    const [isPackagingSelected, setIsPackagingSelected] = useState(false);
    const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'book'>('standard');

    // Fetch provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await fetch('https://provinces.open-api.vn/api/p/');
                const data: AddressAPIResponse[] = await response.json();
                setProvinces(data);
            } catch (error) {
                console.error("Failed to fetch provinces:", error);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch districts when province changes
    useEffect(() => {
        if (selectedProvince?.code) {
            const fetchDistricts = async () => {
                try {
                    const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`);
                    const data: AddressAPIResponse = await response.json();
                    setDistricts(data.districts || []);
                } catch (error) {
                    console.error("Failed to fetch districts:", error);
                }
            };
            fetchDistricts();
        } else {
            setDistricts([]);
        }
    }, [selectedProvince]);

    // Fetch wards when district changes
    useEffect(() => {
        if (selectedDistrict?.code) {
            const fetchWards = async () => {
                try {
                    const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`);
                    const data: AddressAPIResponse = await response.json();
                    setWards(data.wards || []);
                } catch (error) {
                    console.error("Failed to fetch wards:", error);
                }
            };
            fetchWards();
        } else {
            setWards([]);
        }
    }, [selectedDistrict]);
    
    const removeAccents = (str: string) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
    };

    const { subtotal, shippingCost, packagingFee, total, amountToPay } = useMemo(() => {
        const subtotal = cartItems.reduce((total, item) => total + calculatePrice(item, allParts).totalPrice, 0);
        const packagingFee = 30000;
        const shippingCost = shippingMethod === 'standard' ? 25000 : shippingMethod === 'express' ? 45000 : 0;
        const total = subtotal + (isPackagingSelected ? packagingFee : 0) + shippingCost;
        const amountToPay = paymentMethod === 'full' ? total : total * 0.7;
        return { subtotal, shippingCost, packagingFee, total, amountToPay };
    }, [cartItems, allParts, shippingMethod, isPackagingSelected, paymentMethod]);

    const handleProceedToConfirmation = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !desiredDeliveryDate.trim() || !streetAddress.trim() || !selectedProvince || !selectedDistrict || !selectedWard) {
            alert('Vui lòng điền đầy đủ thông tin có dấu (*).');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            alert('Vui lòng nhập một địa chỉ email hợp lệ.');
            return;
        }
        
        const formattedNameNoAccents = removeAccents(customerName.trim()).toUpperCase();
        // Use a more unique Order ID format
        const timestamp = Date.now().toString().slice(-4);
        const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const orderId = `#TL${timestamp}${randomPart}`;

        const fullAddress = `${streetAddress}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;

        const BANK_ID = '970407'; // Techcombank
        const ACCOUNT_NO = '65838666666';
        const ACCOUNT_NAME = 'THE LUVIN'; 
        const QR_TEMPLATE = 'compact2';
        
        const amount = Math.round(amountToPay);
        const description = orderId.replace('#', '');
        const vietQRUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${QR_TEMPLATE}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
        
        const orderDetails: OrderDetails = {
            orderId,
            customer: { name: customerName, phone: customerPhone, email: customerEmail, address: fullAddress },
            items: cartItems,
            pricing: {
                subtotal,
                packagingFee: isPackagingSelected ? packagingFee : 0,
                shippingCost,
                total: total,
                paid: amountToPay,
                remaining: total - amountToPay,
            },
            paymentMethod: paymentMethod === 'deposit' ? 'Cọc 70%' : 'Thanh toán toàn bộ',
            shippingMethod,
            notes: '', // Notes field removed from UI
            vietQRUrl,
            transferContent: description,
            desiredDeliveryDate,
        };

        onConfirmOrder(orderDetails);
    };

    const formInputClasses = "w-full p-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-luvin-pink focus:border-luvin-pink";
    const formSelectClasses = "w-full p-2.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-luvin-pink focus:border-luvin-pink";
    const formLabelClasses = "block text-sm font-medium mb-1 text-gray-700";

    return (
        <div className="bg-gray-50 font-body">
            <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                           <h2 className="text-xl font-bold mb-4">Thông tin thanh toán</h2>
                           <div className="space-y-4">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div>
                                       <label className={formLabelClasses}>Họ và tên <span className="text-red-500">*</span></label>
                                       <input type="text" placeholder="Nhập Họ và tên" className={formInputClasses} required 
                                           value={customerName}
                                           onChange={e => setCustomerName(e.target.value)}
                                       />
                                   </div>
                                   <div>
                                       <label className={formLabelClasses}>Số điện thoại <span className="text-red-500">*</span></label>
                                       <input type="tel" placeholder="Nhập SĐT" className={formInputClasses} required 
                                           value={customerPhone}
                                           onChange={e => setCustomerPhone(e.target.value)}
                                       />
                                   </div>
                               </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <div>
                                       <label className={formLabelClasses}>Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                                       <select 
                                           className={formSelectClasses}
                                           value={selectedProvince?.code || ''}
                                           onChange={(e) => {
                                               const code = parseInt(e.target.value);
                                               const name = provinces.find(p => p.code === code)?.name || '';
                                               setSelectedProvince({code, name});
                                               setSelectedDistrict(null);
                                               setWards([]);
                                               setSelectedWard(null);
                                           }}
                                           required
                                       >
                                           <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                                           {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                       </select>
                                   </div>
                                   <div>
                                       <label className={formLabelClasses}>Quận/Huyện <span className="text-red-500">*</span></label>
                                       <select 
                                           className={formSelectClasses}
                                           value={selectedDistrict?.code || ''}
                                           onChange={(e) => {
                                               const code = parseInt(e.target.value);
                                               const name = districts.find(d => d.code === code)?.name || '';
                                               setSelectedDistrict({code, name});
                                               setWards([]);
                                               setSelectedWard(null);
                                           }}
                                           disabled={!selectedProvince}
                                           required
                                       >
                                           <option value="" disabled>Chọn Quận/Huyện</option>
                                           {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                       </select>
                                   </div>
                               </div>
                               <div>
                                    <label className={formLabelClasses}>Phường/Xã <span className="text-red-500">*</span></label>
                                    <select 
                                       className={formSelectClasses}
                                       value={selectedWard?.code || ''}
                                       onChange={(e) => {
                                           const code = parseInt(e.target.value);
                                           const name = wards.find(w => w.code === code)?.name || '';
                                           setSelectedWard({code, name});
                                       }}
                                       disabled={!selectedDistrict}
                                       required
                                    >
                                       <option value="" disabled>Chọn Phường/Xã</option>
                                       {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                               </div>
                               <div>
                                   <label className={formLabelClasses}>Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                                   <input type="text" placeholder="Số nhà, tên đường..." className={formInputClasses} required 
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                   />
                               </div>
                               <div>
                                   <label className={formLabelClasses}>Địa chỉ Email <span className="text-red-500">*</span></label>
                                   <input type="email" placeholder="Để nhận thông tin đơn hàng" className={formInputClasses} required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                               </div>
                               <div>
                                   <label className={formLabelClasses}>Ngày nhận hàng mong muốn <span className="text-red-500">*</span></label>
                                   <input 
                                    type="date" 
                                    className={formInputClasses} 
                                    value={desiredDeliveryDate}
                                    onChange={(e) => setDesiredDeliveryDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                   />
                               </div>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                           <h3 className="text-lg font-semibold mb-3">Phương thức vận chuyển</h3>
                           <div className="space-y-3">
                             <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="w-4 h-4 text-luvin-pink focus:ring-luvin-pink" />
                               <div className="flex-grow">
                                 <p className="font-medium text-sm">Giao hàng thường</p>
                                 <p className="text-xs text-gray-500">Nhận hàng sau 2-4 ngày</p>
                               </div>
                               <p className="text-sm font-semibold">{formatCurrency(25000)}</p>
                             </label>
                             <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="w-4 h-4 text-luvin-pink focus:ring-luvin-pink" />
                               <div className="flex-grow">
                                 <p className="font-medium text-sm">Giao hàng nhanh</p>
                                 <p className="text-xs text-gray-500">Nhận hàng trong ngày (nội thành)</p>
                               </div>
                               <p className="text-sm font-semibold">{formatCurrency(45000)}</p>
                             </label>
                             <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="shipping" checked={shippingMethod === 'book'} onChange={() => setShippingMethod('book')} className="w-4 h-4 text-luvin-pink focus:ring-luvin-pink" />
                               <div className="flex-grow">
                                 <p className="font-medium text-sm">Book ship (Grab/Ahamove)</p>
                                 <p className="text-xs text-gray-500">Vui lòng liên hệ shop để được hỗ trợ</p>
                               </div>
                               <p className="text-sm font-semibold">Tự thỏa thuận</p>
                             </label>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                           <h3 className="text-lg font-semibold mb-3">Hộp quà tặng</h3>
                           <div className="bg-gray-50 p-3 flex items-center justify-between rounded-md border">
                               <div className="flex items-center gap-3">
                                   <img src={GENERAL_ASSETS.giftbox} alt="gift box" className="w-16 h-16 rounded object-cover"/>
                                   <div>
                                       <p className="font-semibold text-sm">Gói quà chuyên nghiệp</p>
                                       <p className="text-xs text-gray-500">Bao gồm hộp, nơ, và thiệp</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <p className="font-semibold text-sm">{formatCurrency(30000)}</p>
                                  <input 
                                    type="checkbox" 
                                    className="h-5 w-5 rounded text-luvin-pink focus:ring-luvin-pink"
                                    checked={isPackagingSelected}
                                    onChange={(e) => setIsPackagingSelected(e.target.checked)}
                                   />
                               </div>
                           </div>
                        </div>
                    </div>
                    
                    {/* Right Column: Summary */}
                    <div className="lg:col-span-5">
                       <div className="lg:sticky lg:top-24 bg-white p-6 rounded-lg border border-gray-200">
                          <h2 className="text-xl font-bold mb-4 border-b pb-3">Đơn hàng của bạn</h2>
                          
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
                              {cartItems.map((item, index) => {
                                  const frame = FRAME_OPTIONS.find(f => f.id === item.frameId) || FRAME_OPTIONS[0];
                                  return (
                                      <div key={index} className="flex justify-between items-center text-sm">
                                          <div className="flex items-center gap-3">
                                              {item.previewImageUrl && <img src={item.previewImageUrl} alt="Preview" className="w-12 h-12 rounded object-contain bg-gray-100 p-0.5" />}
                                              <p>Khung tùy chỉnh x 1</p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          <div className="space-y-2 py-4 border-t">
                             <div className="flex justify-between text-sm"><p>Tạm tính:</p><p className="font-medium">{formatCurrency(subtotal)}</p></div>
                             {isPackagingSelected && <div className="flex justify-between text-sm"><p>Hộp quà:</p><p className="font-medium">{formatCurrency(packagingFee)}</p></div>}
                             <div className="flex justify-between text-sm"><p>Phí vận chuyển:</p><p className="font-medium">{shippingMethod === 'book' ? 'Tự thỏa thuận' : formatCurrency(shippingCost)}</p></div>
                          </div>

                          <div className="py-4 border-t">
                             <h4 className="font-semibold mb-3">Phương thức thanh toán</h4>
                             <div className="space-y-3">
                                 <label className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${paymentMethod === 'deposit' ? 'bg-pink-50 border-luvin-pink' : ''}`}>
                                     <input type="radio" name="payment" checked={paymentMethod === 'deposit'} onChange={() => setPaymentMethod('deposit')} className="w-4 h-4 text-luvin-pink focus:ring-luvin-pink" />
                                     <p className="font-medium text-sm">Chuyển khoản cọc 70%</p>
                                 </label>
                                 <label className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${paymentMethod === 'full' ? 'bg-pink-50 border-luvin-pink' : ''}`}>
                                     <input type="radio" name="payment" checked={paymentMethod === 'full'} onChange={() => setPaymentMethod('full')} className="w-4 h-4 text-luvin-pink focus:ring-luvin-pink"/>
                                     <p className="font-medium text-sm">Chuyển khoản toàn bộ</p>
                                 </label>
                             </div>
                          </div>

                          <div className="border-t mt-4 pt-4 space-y-2">
                            <div className="flex justify-between text-base font-semibold">
                                <p>Tổng cộng:</p>
                                <p>{formatCurrency(total)}</p>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-luvin-pink items-center">
                                <p>Cần thanh toán:</p>
                                <p className="text-xl">{formatCurrency(amountToPay)}</p>
                            </div>
                          </div>

                           <button onClick={handleProceedToConfirmation} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 rounded-md mt-4 hover:opacity-90 uppercase tracking-wider text-base">
                               Đặt hàng
                           </button>
                       </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

const OrderConfirmationPage: React.FC<{ details: OrderDetails; allParts: Record<string, LegoPart>; }> = ({ details, allParts }) => {

    useEffect(() => {
        const sendEmail = async () => {
            console.log("Attempting to send order confirmation email...");
            try {
                console.log("===== DEVELOPMENT: SIMULATING EMAIL PAYLOAD =====");
                console.log("This data WOULD BE SENT to your backend at /api/send-email:");
                console.log(JSON.stringify(details, null, 2));
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log("Simulation complete. In a real app, the email would now be sent.");
            } catch (error) {
                console.error("Failed to send order confirmation email:", error);
            }
        };

        if (details.customer.email) {
          sendEmail();
        }
    }, [details]);
    
    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 py-8">
                <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg border text-center">
                    <h1 className="text-3xl font-bold text-luvin-pink mb-2">Đơn hàng của bạn đã được ghi nhận!</h1>
                    <p className="text-gray-600 mb-4">Cảm ơn bạn đã đặt hàng. Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng của bạn.</p>
                    <p className="font-semibold">Mã đơn hàng của bạn là: <span className="font-bold text-luvin-pink font-mono">{details.orderId}</span></p>

                    <div className="mt-6 border rounded-md p-4 text-center">
                        <p className="font-semibold text-sm">Quét mã QR để thanh toán</p>
                        <img src={details.vietQRUrl} alt="VietQR Code for payment" className="mx-auto my-2 w-64 h-64" />
                        <div className="bg-gray-100 p-2 rounded-md text-xs">
                            <p className="font-semibold">Nội dung chuyển khoản:</p>
                            <p className="font-mono break-all font-bold text-base">{details.transferContent}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t pt-6 text-left space-y-4">
                        <h2 className="text-xl font-bold mb-3">Tóm tắt đơn hàng</h2>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-b pb-4">
                             {details.items.map((item, index) => {
                                const { totalPrice } = calculatePrice(item, allParts);
                                return (
                                     <div key={index} className="flex justify-between items-center text-sm">
                                         <div className="flex items-center gap-3">
                                             {item.previewImageUrl && <img src={item.previewImageUrl} alt="Preview" className="w-12 h-12 rounded object-contain bg-gray-100 p-0.5" />}
                                             <p>{`Khung tùy chỉnh`} <span className="text-gray-500">&times; 1</span></p>
                                         </div>
                                         <p className="font-medium flex-shrink-0 ml-2">{formatCurrency(totalPrice)}</p>
                                     </div>
                                 );
                             })}
                        </div>

                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between"><p>Tạm tính:</p><p className="font-medium">{formatCurrency(details.pricing.subtotal)}</p></div>
                           {details.pricing.packagingFee > 0 && <div className="flex justify-between"><p>Hộp quà:</p><p className="font-medium">{formatCurrency(details.pricing.packagingFee)}</p></div>}
                           <div className="flex justify-between"><p>Phí vận chuyển:</p><p className="font-medium">{details.shippingMethod === 'book' ? 'Tự thỏa thuận' : formatCurrency(details.pricing.shippingCost)}</p></div>
                        </div>

                        <div className="border-t mt-4 pt-4 space-y-2">
                          <div className="flex justify-between text-base font-bold text-gray-800">
                              <p>Tổng cộng:</p>
                              <p>{formatCurrency(details.pricing.total)}</p>
                          </div>
                          <div className="flex justify-between text-xl font-bold text-luvin-pink">
                              <p>Cần thanh toán:</p>
                              <p>{formatCurrency(details.pricing.paid)}</p>
                          </div>
                          {details.pricing.remaining > 0 && 
                            <div className="flex justify-between text-sm text-gray-600">
                                <p>Còn lại (thanh toán khi nhận hàng):</p>
                                <p className="font-medium">{formatCurrency(details.pricing.remaining)}</p>
                            </div>
                          }
                        </div>
                        
                        <div className="border-t mt-4 pt-4 text-sm space-y-1 text-gray-700">
                            <p><strong>Giao đến:</strong> {details.customer.name}</p>
                            <p><strong>Địa chỉ:</strong> {details.customer.address}</p>
                            <p><strong>SĐT:</strong> {details.customer.phone}</p>
                            {details.desiredDeliveryDate && (
                                <p><strong>Ngày nhận mong muốn:</strong> {new Date(details.desiredDeliveryDate).toLocaleDateString('vi-VN')}</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

const OrderLookupPage: React.FC<{ allOrders: Record<string, StoredOrder> }> = ({ allOrders }) => {
    const [orderId, setOrderId] = useState('');
    const [result, setResult] = useState<StoredOrder | null | string>(null);

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const foundOrder = allOrders[orderId];
        if (foundOrder) {
            setResult(foundOrder);
        } else {
            setResult('Không tìm thấy đơn hàng với mã này.');
        }
    };

    const StatusTimeline: React.FC<{ currentStatus: OrderStatus }> = ({ currentStatus }) => {
        const statuses: OrderStatus[] = ['Chờ thanh toán', 'Đã xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao hàng'];
        const currentIndex = statuses.indexOf(currentStatus);

        return (
            <div className="flex items-center justify-between text-xs text-center my-8">
                {statuses.map((status, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    return (
                        <React.Fragment key={status}>
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                    isActive ? 'border-luvin-pink bg-pink-100' : 'border-gray-300 bg-gray-100'
                                }`}>
                                    {isCompleted ? '✓' : isActive ? <div className="w-3 h-3 bg-luvin-pink rounded-full animate-pulse"></div> : '...'}
                                </div>
                                <p className={`mt-2 font-semibold ${isActive ? 'text-luvin-pink' : 'text-gray-500'}`}>{status}</p>
                            </div>
                            {index < statuses.length - 1 && <div className={`flex-grow h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-6 py-8 max-w-3xl font-body">
            <h1 className="text-5xl font-heading text-center text-luvin-pink mb-8">Tra cứu đơn hàng</h1>
            <form onSubmit={handleLookup} className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="Nhập mã đơn hàng (vd: #TL1234)"
                    className="flex-grow p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-luvin-pink"
                />
                <button type="submit" className="bg-luvin-pink text-gray-800 font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-colors">
                    Tra cứu
                </button>
            </form>

            {result && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    {typeof result === 'string' ? (
                        <p className="text-center text-red-700">{result}</p>
                    ) : (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-luvin-pink">Chi tiết đơn hàng</h2>
                                    <p className="font-mono text-gray-700">{result.details.orderId}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-semibold bg-pink-100 text-luvin-pink">
                                    {result.status}
                                </div>
                            </div>

                            <StatusTimeline currentStatus={result.status} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Thông tin giao hàng</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Họ tên:</strong> {result.details.customer.name}</p>
                                        <p><strong>SĐT:</strong> {result.details.customer.phone}</p>
                                        <p><strong>Địa chỉ:</strong> {result.details.customer.address}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Tóm tắt thanh toán</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Tổng cộng:</strong> {formatCurrency(result.details.pricing.total)}</p>
                                        <p><strong>Đã thanh toán:</strong> {formatCurrency(result.details.pricing.paid)}</p>
                                        <p><strong>Còn lại:</strong> {formatCurrency(result.details.pricing.remaining)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 border-t pt-4">
                                <h3 className="font-semibold text-gray-800 mb-3">Sản phẩm</h3>
                                {result.details.items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                                        <div className="w-24 h-24 flex-shrink-0 bg-white rounded p-1 border">
                                            <img src={item.previewImageUrl} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Khung LEGO tùy chỉnh</p>
                                            <p className="text-xs text-gray-500">Kích thước: {FRAME_OPTIONS.find(f => f.id === item.frameId)?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const ContactPage: React.FC = () => {
    return ( <div className="container mx-auto px-6 py-8"><h1 className="text-5xl font-heading text-center text-luvin-pink mb-8">Liên hệ The Luvin</h1><div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl mx-auto text-center font-body"><p className="text-lg text-gray-700 mb-6">Chúng tôi luôn sẵn lòng lắng nghe và hỗ trợ bạn. Đừng ngần ngại liên hệ với The Luvin qua các kênh dưới đây.</p><div className="space-y-4 text-left inline-block text-base sm:text-lg"><p className="flex items-center"><span className="font-bold w-24">Địa chỉ:</span> 123 Phố Hàng Bông, Hoàn Kiếm, Hà Nội</p><p className="flex items-center"><span className="font-bold w-24">Hotline:</span> 0987 654 321</p><p className="flex items-center"><span className="font-bold w-24">Email:</span> hello@theluvin.com</p></div><div className="flex justify-center space-x-4 sm:space-x-6 mt-8"><a href="#" className="bg-blue-500 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg hover:bg-blue-600 transition-colors">Zalo</a><a href="#" className="bg-purple-500 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg hover:bg-purple-600 transition-colors">Messenger</a><a href="#" className="bg-pink-500 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg hover:bg-pink-600 transition-colors">Instagram</a></div></div></div> );
}

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-5 right-5 z-[100] px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {message}
        </div>
    );
};


const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [frameConfig, setFrameConfig] = useState<FrameConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('luvinFrameConfig');
      return savedConfig ? JSON.parse(savedConfig) : INITIAL_FRAME_CONFIG;
    } catch (error) {
      console.error("Failed to parse frameConfig from localStorage", error);
      return INITIAL_FRAME_CONFIG;
    }
  });

  const [cartItems, setCartItems] = useState<FrameConfig[]>(() => {
    try {
      const savedCart = localStorage.getItem('luvinCartItems');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cartItems from localStorage", error);
      return [];
    }
  });

  const [allOrders, setAllOrders] = useState<Record<string, StoredOrder>>({});
  // FIX: Add state for all products for the admin panel.
  const [allProducts, setAllProducts] = useState<AllProducts | null>(null);
  const [allBackgrounds, setAllBackgrounds] = useState<AllBackgrounds | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
  };
  
  // FIX: Add function to fetch all products for the admin panel.
  const fetchAllProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
      showToast("Could not load product data.", "error");
    }
  }, []);
  
  const fetchAllBackgrounds = useCallback(async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/backgrounds`);
        if (!response.ok) throw new Error('Failed to fetch backgrounds');
        const data = await response.json();
        setAllBackgrounds(data);
    } catch (error) {
        console.error("Failed to fetch backgrounds", error);
        showToast("Could not load background data.", "error");
    }
  }, []);

  useEffect(() => {
    fetchAllProducts();
    fetchAllBackgrounds();
  }, [fetchAllProducts, fetchAllBackgrounds]);


  useEffect(() => {
    try {
        const savedOrders = localStorage.getItem('luvinAllOrders');
        if (savedOrders) {
            setAllOrders(JSON.parse(savedOrders));
        }
    } catch (error) {
        console.error("Failed to load orders from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        // Don't save preview image to localStorage as it can be large
        const { previewImageUrl, ...configToSave } = frameConfig;
        localStorage.setItem('luvinFrameConfig', JSON.stringify(configToSave));
    } catch (error) {
        console.error("Failed to save frameConfig to localStorage", error);
    }
  }, [frameConfig]);

  useEffect(() => {
    try {
        localStorage.setItem('luvinCartItems', JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cartItems to localStorage", error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
        if (Object.keys(allOrders).length > 0) {
            localStorage.setItem('luvinAllOrders', JSON.stringify(allOrders));
        }
    } catch (error) {
        console.error("Failed to save orders to localStorage", error);
    }
  }, [allOrders]);

  // FIX: Correctly type and memoize the allParts object.
  const allParts = useMemo(() => Object.values(LEGO_PARTS).flat().reduce((acc: Record<string, LegoPart>, part: LegoPart) => {
    acc[part.id] = part;
    return acc;
  }, {}), []);

  const handleAddToCart = (config: FrameConfig) => {
      setCartItems(prev => [...prev, config]);
      showToast('Đã thêm vào giỏ hàng!');
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
      setCartItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const navigateTo = useCallback((newPage: Page) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleConfirmOrder = (details: OrderDetails) => {
      const newOrder: StoredOrder = {
        status: 'Chờ thanh toán',
        details: details,
      };
      setAllOrders(prev => ({
        ...prev,
        [details.orderId]: newOrder,
      }));

      setOrderDetails(details);
      // Clear cart after order is placed
      setCartItems([]);
      navigateTo('order-confirmation');
  };
  
  const renderCurrentPage = () => {
    switch (page) {
      case 'home': return <HomePage navigateTo={navigateTo} />;
      case 'builder': return <BuilderPage config={frameConfig} setConfig={setFrameConfig} navigateTo={navigateTo} onAddToCart={handleAddToCart} showToast={showToast} allBackgrounds={allBackgrounds} />;
      case 'collection': return <CollectionPage navigateTo={navigateTo} setConfig={setFrameConfig} />;
      case 'cart': return <CartPage cartItems={cartItems} onRemoveItem={handleRemoveFromCart} allParts={allParts} navigateTo={navigateTo} />;
      case 'checkout': return <CheckoutPage cartItems={cartItems} allParts={allParts} onConfirmOrder={handleConfirmOrder} />;
      case 'order-confirmation': return orderDetails ? <OrderConfirmationPage details={orderDetails} allParts={allParts} /> : <CheckoutPage cartItems={cartItems} allParts={allParts} onConfirmOrder={handleConfirmOrder} />;
      case 'order-lookup': return <OrderLookupPage allOrders={allOrders} />;
      case 'contact': return <ContactPage />;
      // FIX: Add routes for admin pages
      case 'login': return <LoginPage navigateTo={navigateTo} showToast={showToast} />;
      case 'admin-dashboard': return <AdminLayout navigateTo={navigateTo} page={page}><DashboardPage showToast={showToast} /></AdminLayout>;
      case 'admin-orders': return <AdminLayout navigateTo={navigateTo} page={page}><AdminPage showToast={showToast} /></AdminLayout>;
      case 'admin-products': return <AdminLayout navigateTo={navigateTo} page={page}><ProductManagementPage allProducts={allProducts} onProductUpdate={fetchAllProducts} showToast={showToast} /></AdminLayout>;
      case 'admin-backgrounds': return <AdminLayout navigateTo={navigateTo} page={page}><AdminBackgroundsPage allBackgrounds={allBackgrounds} onUpdate={fetchAllBackgrounds} showToast={showToast} /></AdminLayout>;
      default: return <HomePage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col text-gray-800 bg-white`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header navigateTo={navigateTo} cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} />
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        allParts={allParts}
        navigateTo={navigateTo}
      />
      <main className="flex-grow">
        {renderCurrentPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;