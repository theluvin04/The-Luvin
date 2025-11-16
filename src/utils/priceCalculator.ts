import type { FrameConfig, AllProducts, LegoPart } from '@/types';

export const CHARACTER_BASE_PRICE = 10000;

export const formatCurrency = (amount: number | null | undefined) => {
  if (!amount || amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const calculatePrice = (config: FrameConfig, allProducts: AllProducts | null) => {
    if (!allProducts) return { totalPrice: 0, priceBreakdown: [] };

    const allParts = Object.values(allProducts.lego_parts).flat().reduce((acc: Record<string, LegoPart>, part) => {
        acc[part.id] = part;
        return acc;
    }, {});

    const breakdown: {label: string, value: number}[] = [];
    const frame = allProducts.frames.find(f => f.id === config.frameId);
    if (!frame) return { totalPrice: 0, priceBreakdown: [] };

    let total = frame.price;
    breakdown.push({ label: `Khung ${frame.name}`, value: frame.price });

    if(config.characters.length > 0) { 
        const val = config.characters.length * CHARACTER_BASE_PRICE; 
        total += val; 
        breakdown.push({ label: `${config.characters.length} nhân vật`, value: val}); 
    }
    
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
