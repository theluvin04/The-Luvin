export type Page = 'home' | 'builder' | 'collection' | 'feedback' | 'order-lookup' | 'contact' | 'cart' | 'checkout' | 'order-confirmation' | 'login' | 'admin-dashboard' | 'admin-orders' | 'admin-products' | 'admin-backgrounds';

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
  stock?: number;
  isVisible?: boolean;
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
  stock?: number;
  isVisible?: boolean;
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
  size: number;
  color: string;
  x: number; // percentage from left
  y: number; // percentage from top
  rotation: number; // degrees
  scale: number; // multiplier
  background: boolean;
  textAlign?: 'left' | 'center' | 'right';
  width?: number; // Optional width for the text box in pixels
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
    createdAt?: string;
}

export type OrderStatus = 'Chờ thanh toán' | 'Đã xác nhận' | 'Đang xử lý' | 'Đang giao hàng' | 'Đã giao hàng' | 'Đã hủy';

export interface StoredOrder {
  status: OrderStatus;
  details: OrderDetails;
}

export interface User {
    username: string;
    role: 'admin' | 'staff';
}

export type Product = (LegoPart | FrameOption) & { type: 'frame' | LegoPart['type'] };

export interface AllProducts {
  frames: FrameOption[];
  lego_parts: {
    [key: string]: LegoPart[];
    hair: LegoPart[];
    face: LegoPart[];
    shirt: LegoPart[];
    pants: LegoPart[];
    hat: LegoPart[];
    accessory: LegoPart[];
    pet: LegoPart[];
  };
}

export interface BackgroundOption {
    id: string;
    name: string;
    url: string;
    category: string;
    isVisible: boolean;
    type: 'square' | 'rectangle';
}

export interface AllBackgrounds {
    square: BackgroundOption[];
    rectangle: BackgroundOption[];
}