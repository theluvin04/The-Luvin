
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Page, FrameConfig, LegoPart, DraggableItem, TextConfig, LegoCharacterConfig, OutfitColor, OrderDetails, StoredOrder, OrderStatus, AllProducts, FrameOption } from './types';
import { 
    INITIAL_FRAME_CONFIG, 
    FEEDBACK_ITEMS, 
    PRESET_BACKGROUNDS_SQUARE, 
    PRESET_BACKGROUNDS_RECTANGLE, 
    PRODUCT_HIGHLIGHTS,
    GENERAL_ASSETS,
} from './constants';
import FramePreview from './components/FramePreview';
import { AuthProvider, useAuth } from './AuthContext';

import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './components/DashboardPage';
import OrderManagementPage from './components/OrderManagementPage';
import ProductManagementPage from './components/ProductManagementPage';


export const API_BASE_URL = ''; 

const formatCurrency = (amount: number) => {
  if (amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CHARACTER_BASE_PRICE = 10000;

const calculatePrice = (config: FrameConfig, allParts: Record<string, LegoPart>, frameOptions: FrameOption[]) => {
    const breakdown: {label: string, value: number}[] = [];
    const frame = frameOptions.find(f => f.id === config.frameId) || frameOptions[0];
    if (!frame) return { totalPrice: 0, priceBreakdown: [] };

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


type Transform = { x: number; y: number; rotation: number; scale: number; };

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

const Step1Frame: React.FC<{ config: FrameConfig; setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>; frameOptions: FrameOption[] }> = ({ config, setConfig, frameOptions }) => {
  const selectedFrame = frameOptions.find(f => f.id === config.frameId) || frameOptions[0];
  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">CHỌN KÍCH THƯỚC</h4>
        <div className="grid grid-cols-3 gap-3">
          {frameOptions.map(frame => (
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
    if (match) { line1 = match[1]; line2 = match[2].trim(); } 
    else { const parts = bg.name.split(' '); if (parts.length > 1) { line1 = parts[0]; line2 = parts.slice(1).join(' '); } }
    return (
        <button onClick={onClick} className={`border-2 rounded-xl p-1.5 flex flex-col items-center justify-start gap-1.5 transition-all text-center w-full ${ isSelected ? 'border-luvin-pink bg-pink-50' : 'border-gray-200 bg-white hover:border-gray-300' }`}>
            <div className="w-full aspect-[4/5] rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
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
}> = ({ config, setConfig, addText, addCharm }) => {
  const bgUploadRef = useRef<HTMLInputElement>(null);
  const charmUploadRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const availableBackgrounds = useMemo(() => {
    const isSquare = config.frameId === 'sm' || config.frameId === 'lg';
    return isSquare ? PRESET_BACKGROUNDS_SQUARE : PRESET_BACKGROUNDS_RECTANGLE;
  }, [config.frameId]);

  const categories = useMemo(() => ['Tất cả', ...Array.from(new Set(availableBackgrounds.map(bg => bg.category)))], [availableBackgrounds]);
  const filteredBackgrounds = useMemo(() => selectedCategory === 'Tất cả' ? availableBackgrounds : availableBackgrounds.filter(bg => bg.category === selectedCategory), [selectedCategory, availableBackgrounds]);

  useEffect(() => { if (!categories.includes(selectedCategory)) { setSelectedCategory('Tất cả'); } }, [categories, selectedCategory]);

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => { if (event.target && typeof event.target.result === 'string') { setConfig((prev) => ({ ...prev, background: { type: 'upload', value: event.target.result as string } })); } };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCharmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => { if (event.target && typeof event.target.result === 'string') { addCharm(event.target.result as string); } };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">A. CHỌN MẪU NỀN CÓ SẴN</h4>
        <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {categories.map(category => ( <button key={category} onClick={() => setSelectedCategory(category)} className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${ selectedCategory === category ? 'bg-luvin-pink text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}>{category}</button>))}
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 min-h-[150px]">
          {filteredBackgrounds.length > 0 ? ( filteredBackgrounds.map((bg) => (<PresetBackgroundButton key={bg.name} bg={bg} isSelected={config.background.value === bg.url} onClick={() => setConfig((prev) => ({ ...prev, background: { type: 'image', value: bg.url } }))}/>))) : (<p className="col-span-3 text-center text-sm text-gray-500 py-10">Không có mẫu nào phù hợp.</p>)}
        </div>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-3">B. HOẶC TẢI ẢNH CỦA BẠN</h4>
        <button onClick={() => bgUploadRef.current?.click()} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">Tải ảnh nền</button>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-bold text-gray-800 mb-2">C. THÊM CHỮ & TRANG TRÍ</h4>
        <p className="text-sm text-gray-600 mb-3">Chỉnh sửa trực tiếp trên khung xem trước.</p>
        <div className="flex gap-2">
            <button onClick={addText} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">+ Thêm chữ mới</button>
            <button onClick={() => charmUploadRef.current?.click()} className="w-full font-semibold bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg hover:bg-gray-300">Tải ảnh nhỏ</button>
        </div>
      </div>
      <input type="file" ref={bgUploadRef} accept="image/*" onChange={handleBgFileUpload} className="hidden" />
      <input type="file" ref={charmUploadRef} accept="image/*" onChange={handleCharmFileUpload} className="hidden" />
    </div>
  );
};

const PartButton: React.FC<{ part: LegoPart; isSelected: boolean; onClick: () => void; }> = ({ part, isSelected, onClick }) => {
    return (
        <button onClick={onClick} className={`border rounded-lg p-1.5 flex flex-col items-center justify-start gap-1 transition-all text-center w-full ${ isSelected ? 'border-luvin-pink bg-pink-50' : 'border-gray-200 bg-white hover:border-gray-300' }`}>
            <div className="w-full aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center"><img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain" /></div>
            <div className="flex flex-col justify-center items-center flex-shrink-0 h-10 leading-tight">
                <span className="text-[11px] font-semibold text-gray-800">{part.name}</span>
                <span className="text-[11px] font-bold text-luvin-pink">{formatCurrency(part.price)}</span>
            </div>
        </button>
    );
};


const Step3Characters: React.FC<{ config: FrameConfig; setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>; allLegoParts: AllProducts['lego_parts'] }> = ({ config, setConfig, allLegoParts }) => {
    const [activeCharId, setActiveCharId] = useState<number | null>(config.characters[0]?.id || null);
    const [activePartType, setActivePartType] = useState<'shirt' | 'pants' | 'face' | 'hair' | 'hat'>('shirt');
    const activeCharacter = config.characters.find(c => c.id === activeCharId);
    const [printDialogCharId, setPrintDialogCharId] = useState<number | null>(null);

     useEffect(() => {
        if (!config.characters.find(c => c.id === activeCharId)) { setActiveCharId(config.characters[config.characters.length - 1]?.id || null); }
     }, [config.characters, activeCharId]);

    const handleAddChar = () => {
        const newId = Date.now();
        const defaultShirt = allLegoParts.shirt[0];
        const defaultPants = allLegoParts.pants[0];
        const defaultFace = allLegoParts.face[0];

        const newCharacter: LegoCharacterConfig = {
            id: newId, 
            shirt: defaultShirt,
            pants: defaultPants,
            face: defaultFace,
            hair: undefined,
            x: 30 + (config.characters.length % 3) * 20, y: 75, rotation: 0, scale: 1,
            selectedShirtColor: defaultShirt.colors?.[0],
            selectedPantsColor: defaultPants.colors?.[0],
        };
        setConfig(prev => ({ ...prev, characters: [...prev.characters, newCharacter] }));
        setActiveCharId(newId);
    };
    
    const handleRemoveChar = (id: number) => { setConfig(prev => ({...prev, characters: prev.characters.filter(c => c.id !== id)})); };
    
    const handlePartSelect = (part: LegoPart | undefined) => {
        if (!activeCharId || !part) return;
        setConfig(prev => ({ ...prev, characters: prev.characters.map(c => {
            if (c.id === activeCharId) {
                const newChar = { ...c, [part.type]: part };
                if (part.type === 'shirt') newChar.selectedShirtColor = part.colors?.[0];
                if (part.type === 'pants') newChar.selectedPantsColor = part.colors?.[0];
                if (part.type === 'hair') newChar.hat = undefined;
                if (part.type === 'hat') newChar.hair = undefined;
                return newChar;
            }
            return c;
        })}));
    };

    const handlePartDeselect = (partType: 'hair' | 'hat') => {
      if (!activeCharId) return;
      setConfig(prev => ({ ...prev, characters: prev.characters.map(c => c.id === activeCharId ? { ...c, [partType]: undefined } : c) }));
    }
    
    const addDraggableItem = (part: LegoPart) => {
        if (part.type !== 'accessory' && part.type !== 'pet') return;
        const newItem: DraggableItem = { id: Date.now(), partId: part.id, type: part.type, x: 50 + (Math.random() - 0.5) * 20, y: 50 + (Math.random() - 0.5) * 20, rotation: 0, scale: 1, };
        setConfig(prev => ({...prev, draggableItems: [...prev.draggableItems, newItem]}));
    }

    const handleCustomPrintSelect = (price: number) => {
      if (!printDialogCharId) return;
      setConfig(prev => ({ ...prev, characters: prev.characters.map(c => c.id === printDialogCharId ? { ...c, customPrintPrice: price } : c) }));
      setPrintDialogCharId(null);
    };

    const handleColorSelect = (partType: 'shirt' | 'pants', color: OutfitColor) => {
        if (!activeCharId) return;
        const key = partType === 'shirt' ? 'selectedShirtColor' : 'selectedPantsColor';
        setConfig(prev => ({...prev, characters: prev.characters.map(c => c.id === activeCharId ? { ...c, [key]: color } : c)}));
    }
    
    const partTypes: { key: 'shirt' | 'pants' | 'face' | 'hair' | 'hat', label: string }[] = [ { key: 'shirt', label: 'Áo' }, { key: 'pants', label: 'Quần' }, { key: 'face', label: 'Mặt' }, { key: 'hair', label: 'Tóc' }, { key: 'hat', label: 'Mũ' }, ];
    const currentPartList = allLegoParts[activePartType] || [];

    return (
        <div className="space-y-4">
            {printDialogCharId && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                  <h3 className="font-bold text-lg mb-2">Chọn chất lượng in</h3>
                  <p className="text-sm text-gray-600 mb-4">In theo yêu cầu sẽ có chi phí cao hơn.</p>
                  <div className="space-y-2">
                    <button onClick={() => handleCustomPrintSelect(150000)} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300">In thường - {formatCurrency(150000)}</button>
                    <button onClick={() => handleCustomPrintSelect(300000)} className="w-full bg-luvin-pink text-gray-800 font-semibold py-2 rounded-lg hover:opacity-90">In cao cấp - {formatCurrency(300000)}</button>
                    {config.characters.find(c => c.id === printDialogCharId)?.customPrintPrice && <button onClick={() => handleCustomPrintSelect(0)} className="w-full bg-red-100 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-200">Bỏ in yêu cầu</button>}
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
                            <button onClick={() => setActiveCharId(char.id)} className={`px-4 py-2 text-sm rounded-lg font-medium ${activeCharId === char.id ? 'bg-pink-100 text-luvin-pink border border-luvin-pink' : 'bg-gray-200 text-gray-800'}`}>NV {index + 1}</button>
                            <button onClick={() => handleRemoveChar(char.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">&times;</button>
                        </div>
                    ))}
                    <button onClick={handleAddChar} className="bg-green-500 text-white text-sm px-4 py-2 rounded-lg font-medium">+ Thêm ({formatCurrency(CHARACTER_BASE_PRICE)})</button>
                </div>
                {activeCharacter && <div className="mt-4 pt-4 border-t"><button onClick={() => setPrintDialogCharId(activeCharacter.id)} className="text-sm text-blue-600 hover:underline font-semibold">{activeCharacter.customPrintPrice ? `Đang chọn in yêu cầu (${formatCurrency(activeCharacter.customPrintPrice)}) - Thay đổi?` : 'Thêm tuỳ chọn in theo yêu cầu?'}</button></div>}
                {config.characters.length > 0 && !activeCharacter && <p className="text-sm text-center text-gray-500 mt-2">Hãy chọn một nhân vật để thiết kế.</p>}
                {config.characters.length === 0 && <p className="text-sm text-center text-gray-500 mt-2">Chưa có nhân vật nào. Hãy thêm!</p>}
            </div>

            {activeCharacter && (
                <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4">
                        {partTypes.map(pt => (<button key={pt.key} onClick={() => setActivePartType(pt.key)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${activePartType === pt.key ? 'bg-luvin-pink text-white' : 'bg-gray-200 text-gray-800'}`}>{pt.label}</button>))}
                    </div>
                     <div className="grid grid-cols-4 gap-2">
                         {(activePartType === 'hair' || activePartType === 'hat') && (<button onClick={() => handlePartDeselect(activePartType as 'hair' | 'hat')} className="border-2 border-dashed border-gray-300 rounded-lg p-1.5 flex flex-col items-center justify-center gap-1 transition-colors text-center w-full h-full min-h-[100px] text-gray-500 hover:bg-gray-100 hover:border-gray-400"><span className="text-2xl font-bold">&times;</span><span className="text-[11px] font-semibold">Không chọn</span></button>)}
                        {currentPartList.map(part => (<PartButton key={part.id} part={part} isSelected={activeCharacter[activePartType]?.id === part.id} onClick={() => handlePartSelect(part)} />))}
                    </div>
                    {(activePartType === 'shirt' && activeCharacter.shirt?.colors) && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-bold text-gray-600 block mb-2">Chỉnh màu áo</label>
                         <div className="flex flex-wrap gap-2">
                           {activeCharacter.shirt.colors.map(color => (<button key={color.name} onClick={() => handleColorSelect('shirt', color)} className={`w-8 h-8 rounded-full border-2 transition-all ${activeCharacter.selectedShirtColor?.imageUrl === color.imageUrl ? 'border-luvin-pink scale-110' : 'border-white'}`} style={{ backgroundColor: color.hex }} title={`${color.name} (${formatCurrency(color.price)})`} />))}
                         </div>
                      </div>
                    )}
                    {(activePartType === 'pants' && activeCharacter.pants?.colors) && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-bold text-gray-600 block mb-2">Chỉnh màu quần</label>
                         <div className="flex flex-wrap gap-2">
                           {activeCharacter.pants.colors.map(color => (<button key={color.name} onClick={() => handleColorSelect('pants', color)} className={`w-8 h-8 rounded-full border-2 transition-all ${activeCharacter.selectedPantsColor?.imageUrl === color.imageUrl ? 'border-luvin-pink scale-110' : 'border-white'}`} style={{ backgroundColor: color.hex }} title={`${color.name} (${formatCurrency(color.price)})`} />))}
                         </div>
                      </div>
                    )}
                </div>
            )}
            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">THÊM PHỤ KIỆN</h4>
                <div className="grid grid-cols-4 gap-2">{allLegoParts.accessory.map(part => (<PartButton key={part.id} part={part} isSelected={false} onClick={() => addDraggableItem(part)} />))}</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">THÊM THÚ CƯNG</h4>
                <div className="grid grid-cols-4 gap-2">{allLegoParts.pet.map(part => (<PartButton key={part.id} part={part} isSelected={false} onClick={() => addDraggableItem(part)} />))}</div>
            </div>
        </div>
    );
};

const Step4Summary: React.FC<{ totalPrice: number; priceBreakdown: {label: string, value: number}[]; frameName: string; charCount: number; onAddToCart: () => void; onBuyNow: () => void; isSaving: boolean; }> = ({ totalPrice, priceBreakdown, frameName, charCount, onAddToCart, onBuyNow, isSaving }) => {
  return (
    <div>
        <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">THÔNG TIN KHUNG</h4>
            <div className="space-y-1 text-sm text-gray-700 mb-4"><p><strong>Kích thước:</strong> {frameName}</p><p><strong>Số nhân vật:</strong> {charCount}</p></div>
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">GIÁ DỰ KIẾN</h4>
            <div className="space-y-1 text-sm text-gray-700">
                {priceBreakdown.map((item, index) => (<div key={index} className="flex justify-between"><span>{item.label}</span><span className="font-medium">{item.value > 0 ? formatCurrency(item.value) : 'Miễn phí'}</span></div>))}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between text-base font-bold text-gray-800"><span>Tổng cộng</span><span>{formatCurrency(totalPrice)}</span></div>
            </div>
        </div>
        <div className="mt-4 space-y-3">
            <button onClick={onAddToCart} disabled={isSaving} className="w-full bg-pink-100 text-luvin-pink border border-luvin-pink font-bold py-3 rounded-lg text-base hover:bg-pink-200 transition-colors disabled:opacity-50 disabled:cursor-wait">{isSaving ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}</button>
            <button onClick={onBuyNow} disabled={isSaving} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 rounded-lg text-base hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-wait">{isSaving ? 'Đang xử lý...' : 'Mua ngay & Thanh toán'}</button>
        </div>
    </div>
  );
};

const Header: React.FC<{ navigateTo: (page: Page) => void; cartCount: number; onCartClick: () => void; isAuthenticated: boolean; }> = ({ navigateTo, cartCount, onCartClick, isAuthenticated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'auto'; }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMenuOpen]);
  
  const navItems: { label: string; page: Page }[] = [ { label: 'Trang chủ', page: 'home' }, { label: 'Thiết kế', page: 'builder' }, { label: 'Bộ sưu tập', page: 'collection' }, { label: 'Tra cứu', page: 'order-lookup' }, ...(isAuthenticated ? [{ label: 'Admin', page: 'admin-dashboard' as Page }] : []) ];
  
  const handleNav = (page: Page) => { navigateTo(page); setIsMenuOpen(false); }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-4xl font-heading text-luvin-pink cursor-pointer" onClick={() => handleNav('home')}>The Luvin</div>
          <div className="hidden md:flex items-center space-x-6 font-body">
            {navItems.map(item => (<button key={item.page} onClick={() => handleNav(item.page)} className="text-gray-800 hover:text-luvin-pink transition-colors font-semibold text-sm">{item.label}</button>))}
            <button onClick={onCartClick} className="relative text-gray-800 hover:text-luvin-pink transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>{cartCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}</button>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button onClick={onCartClick} className="relative text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>{cartCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>}</button>
            <button onClick={() => setIsMenuOpen(true)} className="text-gray-800 focus:outline-none"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button>
          </div>
        </nav>
      </header>
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden={!isMenuOpen}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-4/5 max-w-xs bg-white transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              <div className="p-5 flex justify-end"><button onClick={() => setIsMenuOpen(false)} className="text-gray-800"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
              <div className="flex flex-col items-start space-y-6 p-8 font-body">{navItems.map(item => ( <button key={item.page} onClick={() => handleNav(item.page)} className="text-gray-800 hover:text-luvin-pink text-xl font-semibold">{item.label}</button>))}</div>
            </div>
        </div>
      </div>
    </>
  );
};

const Footer: React.FC = () => (
    <footer className="bg-white text-gray-800 mt-auto font-body text-sm border-t"><div className="container mx-auto px-6 py-4 text-center text-xs text-gray-500"><p>Copyright © {new Date().getFullYear()} The Luvin. All Rights Reserved.</p></div></footer>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (<div className={`fixed top-5 right-5 z-[100] px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{message}</div>);
};

// ... ALL PAGE COMPONENTS WILL GO HERE ...
// For brevity, I'll define them inside AppContent's render method or right before it.
// In a real app, each would be a separate file.

const AppContent: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [allProducts, setAllProducts] = useState<AllProducts | null>(null);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const { isAuthenticated } = useAuth();
    
    // Most state from old App.tsx
    const [frameConfig, setFrameConfig] = useState<FrameConfig>(() => { try { const saved = localStorage.getItem('luvinFrameConfig'); return saved ? JSON.parse(saved) : INITIAL_FRAME_CONFIG; } catch { return INITIAL_FRAME_CONFIG; } });
    const [cartItems, setCartItems] = useState<FrameConfig[]>(() => { try { const saved = localStorage.getItem('luvinCartItems'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
    const [allOrders, setAllOrders] = useState<Record<string, StoredOrder>>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

    // Save/load logic
    useEffect(() => { try { const saved = localStorage.getItem('luvinAllOrders'); if(saved) setAllOrders(JSON.parse(saved)); } catch {} }, []);
    useEffect(() => { try { const { previewImageUrl, ...configToSave } = frameConfig; localStorage.setItem('luvinFrameConfig', JSON.stringify(configToSave)); } catch {} }, [frameConfig]);
    useEffect(() => { try { localStorage.setItem('luvinCartItems', JSON.stringify(cartItems)); } catch {} }, [cartItems]);
    useEffect(() => { try { if (Object.keys(allOrders).length > 0) localStorage.setItem('luvinAllOrders', JSON.stringify(allOrders)); } catch {} }, [allOrders]);
    
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); }, []);
    
    // Routing
    const navigateTo = useCallback((newPage: Page) => { window.location.hash = `/${newPage}`; }, []);
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#/', '').split('?')[0] || 'home';
            setPage(hash as Page);
            window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial load
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Product fetching
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data: AllProducts = await response.json();
                setAllProducts(data);
            } catch (error) {
                showToast("Không thể tải dữ liệu sản phẩm", "error");
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [showToast]);

    // Handlers from old App.tsx
    const handleAddToCart = (config: FrameConfig) => { setCartItems(prev => [...prev, config]); showToast('Đã thêm vào giỏ hàng!'); };
    const handleRemoveFromCart = (indexToRemove: number) => { setCartItems(prev => prev.filter((_, index) => index !== indexToRemove)); };
    const handleConfirmOrder = async (details: OrderDetails) => {
        const newOrder: StoredOrder = { status: 'Chờ thanh toán', details };
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details), });
            if (!response.ok) throw new Error('Failed to create order');
            const createdOrder = await response.json();
            setAllOrders(prev => ({ ...prev, [createdOrder.details.orderId]: createdOrder, }));
            setOrderDetails(details);
            setCartItems([]);
            navigateTo('order-confirmation');
        } catch (error) {
            showToast("Đã có lỗi xảy ra khi đặt hàng", "error");
        }
    };
  
    const renderCurrentPage = () => {
        if (isLoadingProducts || !allProducts) {
            return <div className="p-8 text-center">Đang tải dữ liệu cửa hàng...</div>
        }

        // For brevity, defining pages here. In a real app, they would be imported.
        const HomePage = () => <div className="p-8 text-center"><h1>Welcome to The Luvin</h1><p>Customer content goes here.</p></div>;
        const CollectionPage = () => <div className="p-8 text-center"><h1>Collections</h1><p>Customer content goes here.</p></div>;

        switch (page) {
            case 'home': return <HomePage />;
            case 'builder': return <BuilderPage config={frameConfig} setConfig={setFrameConfig} navigateTo={navigateTo} onAddToCart={handleAddToCart} showToast={showToast} allProducts={allProducts} />;
            case 'collection': return <CollectionPage />;
            // ... more pages here
            
            // Admin Pages
            case 'login': return <LoginPage navigateTo={navigateTo} showToast={showToast} />;
            case 'admin-dashboard':
            case 'admin-orders':
            case 'admin-products':
              return (
                <AdminLayout navigateTo={navigateTo} page={page}>
                  {page === 'admin-dashboard' && <DashboardPage showToast={showToast} />}
                  {page === 'admin-orders' && <OrderManagementPage showToast={showToast} />}
                  {page === 'admin-products' && <ProductManagementPage allProducts={allProducts} showToast={showToast} onProductUpdate={() => { /* re-fetch */}} />}
                </AdminLayout>
              );

            default: return <HomePage />;
        }
    };

    return (
        <div className={`min-h-screen flex flex-col text-gray-800 bg-white`}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <Header navigateTo={navigateTo} cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} isAuthenticated={isAuthenticated} />
            {/* CartPanel needs to be implemented and added here if desired */}
            <main className="flex-grow">
                {renderCurrentPage()}
            </main>
            <Footer />
        </div>
    );
};

const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

const TextEditor: React.FC<{
    activeText: TextConfig;
    setConfig: React.Dispatch<React.SetStateAction<FrameConfig>>;
    selectedTextId: number;
    deselect: () => void;
}> = ({ activeText, setConfig, selectedTextId, deselect }) => {
    const updateActiveText = (updates: Partial<TextConfig>) => { setConfig(prev => ({ ...prev, texts: prev.texts.map((t) => t.id === selectedTextId ? { ...t, ...updates } : t) })); }
    return (
        <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">CHỈNH SỬA CHỮ</h3><button onClick={deselect} className="text-sm font-body bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300">Xong</button></div>
            <div className="space-y-4">
                <div><label className="text-sm font-bold text-gray-600 block mb-1">Nội dung</label><textarea value={activeText.content} onChange={e => updateActiveText({ content: e.target.value })} rows={3} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Nhập nội dung..."/></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-bold text-gray-600 block mb-1">Font chữ</label><select value={activeText.font} onChange={e => updateActiveText({font: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="Playfair Display">Font Playfair</option><option value="Montserrat">Font Montserrat</option><option value="Serif">Font Serif</option></select></div>
                     <div><label className="text-sm font-bold text-gray-600 block mb-1">Màu chữ</label><input type="color" value={activeText.color} onChange={e => updateActiveText({color: e.target.value})} className="h-10 w-full p-0.5 bg-white rounded-lg border border-gray-300"/></div>
                </div>
                <div><label className="text-sm font-bold text-gray-600 block mb-1">Cỡ chữ</label><input type="number" min="10" max="120" value={activeText.size} onChange={e => updateActiveText({ size: parseInt(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"/></div>
                <div className="flex items-center justify-between gap-2">
                    <button onClick={() => updateActiveText({background: !activeText.background})} className={`text-sm px-3 py-2 rounded-lg ${activeText.background ? 'bg-luvin-pink text-gray-800' : 'bg-gray-200 text-gray-800'}`}>{activeText.background ? 'Bỏ nền mờ' : 'Thêm nền mờ'}</button>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">{(['left', 'center', 'right'] as const).map(align => ( <button key={align} onClick={() => updateActiveText({ textAlign: align })} className={`px-3 py-1 text-sm ${activeText.textAlign === align ? 'bg-luvin-pink text-gray-800' : 'bg-white text-gray-800'}`}>{align.charAt(0).toUpperCase()}</button>))}</div>
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
    allProducts: AllProducts;
}> = ({ config, setConfig, navigateTo, onAddToCart, showToast, allProducts }) => {
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
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
      if (window.scrollY > scrollYRef.current && window.scrollY > 150 && !isAtBottom) { setIsBottomBarVisible(false); } 
      else { setIsBottomBarVisible(true); }
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => { if (entries[0]) { const { width } = entries[0].contentRect; setPreviewWidth(width > 520 ? 520 : width); } });
    if (previewContainerParentRef.current) { observer.observe(previewContainerParentRef.current); }
    return () => { if (previewContainerParentRef.current) { observer.unobserve(previewContainerParentRef.current); } };
  }, []);
  
  const allParts = useMemo(() => Object.values(allProducts.lego_parts).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {} as Record<string, LegoPart>), [allProducts]);
  const { totalPrice, priceBreakdown } = useMemo(() => calculatePrice(config, allParts, allProducts.frames), [config, allParts, allProducts.frames]);
  
  const selectedText = useMemo(() => {
    if (selectedItemId?.startsWith('text-')) { const id = parseInt(selectedItemId.split('-')[1], 10); return config.texts.find(t => t.id === id) || null; }
    return null;
  }, [selectedItemId, config.texts]);

  const handleItemTransform = useCallback((id: string, newTransform: Transform) => {
      const [type, ...rest] = id.split('-');
      const rawId = rest.join('-');
      setConfig(prev => {
          if (type === 'text') { const idToUpdate = parseInt(rawId); return { ...prev, texts: prev.texts.map(item => item.id === idToUpdate ? { ...item, ...newTransform } : item) }; }
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
        if (type === 'text') { const idToDelete = parseInt(rawId); return { ...prev, texts: prev.texts.filter(t => t.id !== idToDelete) }; }
        const itemId = parseInt(rawId);
        if (type === 'character') return { ...prev, characters: prev.characters.filter(item => item.id !== itemId) };
        if (type === 'item') return { ...prev, draggableItems: prev.draggableItems.filter(item => item.id !== itemId) };
        return prev;
    });
  }, [setConfig]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) { handleItemDelete(selectedItemId); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleItemDelete]);

  const handleTextUpdate = useCallback((id: number, updates: Partial<TextConfig>) => { setConfig(prev => ({ ...prev, texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t) })); }, [setConfig]);
  
  const addText = () => {
      const newId = Date.now();
      const newText: TextConfig = { id: newId, content: 'Nhập chữ...', font: 'Montserrat', size: 13, color: '#333333', x: 50, y: 50, rotation: 0, scale: 1, background: true, textAlign: 'center', width: 200 };
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
      setSelectedItemId(null);
      setTimeout(async () => {
        const element = frameCaptureRef.current;
        if (element && typeof (window as any).html2canvas !== 'undefined') {
          try {
            const canvas = await (window as any).html2canvas(element, { backgroundColor: null, logging: false, useCORS: true, ignoreElements: (el:any) => el.classList.contains('transform-handle'), });
            resolve(canvas.toDataURL('image/png'));
          } catch (error) { resolve(''); } finally { setSelectedItemId(originalSelectedId); }
        } else { resolve(''); setSelectedItemId(originalSelectedId); }
      }, 50);
    });
  };

  const handleAddToCart = async () => {
      setIsSaving(true);
      const imageUrl = await captureFrameAsImage();
      setIsSaving(false);
      if(imageUrl) { onAddToCart({ ...config, previewImageUrl: imageUrl }); } 
      else { showToast('Lỗi khi thêm vào giỏ hàng.', 'error'); }
  };

  const handleBuyNow = async () => {
    setIsSaving(true);
    const imageUrl = await captureFrameAsImage();
    setIsSaving(false);
    if(imageUrl) { onAddToCart({ ...config, previewImageUrl: imageUrl }); navigateTo('checkout'); } 
    else { showToast('Đã có lỗi xảy ra.', 'error'); }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return <Step1Frame config={config} setConfig={setConfig} frameOptions={allProducts.frames} />;
      case 2: return <Step2BackgroundAndDecorations config={config} setConfig={setConfig} addText={addText} addCharm={addCharm} />;
      case 3: return <Step3Characters config={config} setConfig={setConfig} allLegoParts={allProducts.lego_parts} />;
      case 4: return <Step4Summary totalPrice={totalPrice} priceBreakdown={priceBreakdown} frameName={allProducts.frames.find(f => f.id === config.frameId)?.name || ''} charCount={config.characters.length} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} isSaving={isSaving} />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="text-sm text-gray-500 mb-2"><button onClick={() => navigateTo('home')} className="hover:underline">Home</button> / Thiết kế & Mua hàng</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Thiết kế & Mua hàng Khung LEGO</h1>
        <StepIndicator currentStep={step} setStep={setStep} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          <div className="lg:col-span-7" ref={previewContainerParentRef}>
            <div className="lg:sticky lg:top-24">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">ẢNH XEM TRƯỚC</h3>
                <div className="bg-gray-100 rounded-lg flex items-center justify-center aspect-square overflow-hidden p-4">
                    <FramePreview ref={frameCaptureRef} config={config} allProducts={allProducts} containerWidth={previewWidth - 32} onItemTransform={handleItemTransform} onTextUpdate={handleTextUpdate} className="w-full h-full" selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId}/>
                </div>
                <div className="h-10 mt-4"></div>
            </div>
          </div>
          <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                  {selectedText ? ( <TextEditor activeText={selectedText} setConfig={setConfig} selectedTextId={selectedText.id} deselect={() => setSelectedItemId(null)}/> ) : ( <div className="min-h-[400px]">{renderStepContent()}</div> )}
              </div>
              {!selectedText && (
                <>
                  <div className="mt-4 text-right font-bold text-lg text-gray-800">Giá tạm tính: <span className="text-luvin-pink">{formatCurrency(totalPrice)}</span></div>
                  <div className="mt-2 hidden lg:flex items-center gap-4">
                      <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors">&larr; Quay lại</button>
                      <button onClick={() => setStep(s => Math.min(4, s + 1))} disabled={step === 4} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors">Tiếp theo</button>
                  </div>
                </>
              )}
               <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-top p-4 z-30 transition-transform duration-300 ease-in-out ${isBottomBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                     <div className="text-right font-bold text-base text-gray-800 mb-2">Giá tạm tính: <span className="text-luvin-pink">{formatCurrency(totalPrice)}</span></div>
                     <div className="flex items-center gap-4">
                       <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors">Quay lại</button>
                       <button onClick={() => setStep(s => Math.min(4, s + 1))} disabled={step === 4} className="w-full bg-luvin-pink text-gray-800 font-bold py-3 px-8 rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors">Tiếp theo</button>
                     </div>
                </div>
               <div className="lg:hidden h-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;