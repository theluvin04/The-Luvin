// FIX: Removed import of FrameConfig from './App' as it caused a circular dependency and is defined within this file.

// Fix: Define the Page type directly to resolve a circular dependency.
export type Page = 'home' | 'builder' | 'collection' | 'feedback' | 'order-lookup' | 'contact' | 'cart' | 'checkout' | 'order-confirmation';

export interface FrameOption {
  id: string;
  name: string;
  frameWidthCm: number;
  frameHeightCm: number;
  backgroundWidthCm: number;
  backgroundHeightCm: number;
  price: number;
  imageUrl: string;
  description: string;
}

export interface OutfitColor {
  name: string;
  hex: string;
  imageUrl: string;
  price: number; // Additional price for this color
}

export interface LegoPart {
  id: string;
  name: string;
  price: number; // Base price (for default color)
  imageUrl: string;
  type: 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'pet' | 'hat';
  widthCm?: number;
  heightCm?: number;
  colors?: OutfitColor[];
}

export interface LegoCharacterConfig {
  id: number;
  hair?: LegoPart;
  face?: LegoPart;
  shirt?: LegoPart;
  pants?: LegoPart;
  hat?: LegoPart;
  selectedShirtColor?: OutfitColor; 
  selectedPantsColor?: OutfitColor;
  customPrintPrice?: number;
  x: number; // percentage from left
  y: number; // percentage from top
  rotation: number; // degrees
  scale: number; // multiplier
}

export interface TextConfig {
  id: number;
  content: string;
  font: string;
  size: number; // Now a relative size, e.g., 1-100
  color: string;
  x: number; // percentage from left
  y: number; // percentage from top
  rotation: number; // degrees
  scale: number; // multiplier
  background: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

export interface DraggableItem {
    id: number;
    partId: string; // For accessories/pets, it's the LegoPart ID. For charms, it's the data URL.
    type: 'accessory' | 'pet' | 'charm';
    x: number; // percentage from left
    y: number; // percentage from top
    rotation: number; // degrees
    scale: number; // multiplier
}

// FIX: Define the missing BackgroundConfig interface.
export interface BackgroundConfig {
  type: 'color' | 'image' | 'upload';
  value: string;
}

export interface FrameConfig {
  frameId: string;
  background: BackgroundConfig;
  characters: LegoCharacterConfig[];
  texts: TextConfig[];
  draggableItems: DraggableItem[];
  previewImageUrl?: string;
}

export interface OrderDetails {
    orderId: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    items: FrameConfig[];
    pricing: {
        subtotal: number;
        packagingFee: number;
        shippingCost: number;
        total: number;
        paid: number;
        remaining: number;
    };
    paymentMethod: string;
    shippingMethod: string;
    notes: string;
    vietQRUrl: string;
    transferContent: string;
    desiredDeliveryDate?: string;
}

export type OrderStatus = 'Chờ thanh toán' | 'Đã xác nhận' | 'Đang xử lý' | 'Đang giao hàng' | 'Đã giao hàng' | 'Đã hủy';

export interface StoredOrder {
  status: OrderStatus;
  details: OrderDetails;
}