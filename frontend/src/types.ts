
export type Page = 
    'home' | 'builder' | 'collection' | 'feedback' | 
    'order-lookup' | 'contact' | 'cart' | 'checkout' | 
    'order-confirmation' | 'login' | 'admin-dashboard' |
    'admin-orders' | 'admin-products';

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
  stock: number;
  isVisible: boolean;
}

export interface OutfitColor {
  name: string;
  hex: string;
  imageUrl: string;
  price: number;
}

export interface LegoPart {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  type: 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'pet' | 'hat';
  widthCm?: number;
  heightCm?: number;
  colors?: OutfitColor[];
  stock: number;
  isVisible: boolean;
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
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface TextConfig {
  id: number;
  content: string;
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  background: boolean;
  textAlign?: 'left' | 'center' | 'right';
  width?: number; // Add width property for text alignment box
}

export interface DraggableItem {
    id: number;
    partId: string;
    type: 'accessory' | 'pet' | 'charm';
    x: number;
    y: number;
    rotation: number;
    scale: number;
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
    createdAt: string;
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

export interface AllProducts {
    frames: FrameOption[];
    lego_parts: {
        hair: LegoPart[];
        face: LegoPart[];
        shirt: LegoPart[];
        pants: LegoPart[];
        hat: LegoPart[];
        accessory: LegoPart[];
        pet: LegoPart[];
    };
}