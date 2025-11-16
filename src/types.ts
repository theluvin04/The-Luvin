// FIX: Updated Page type to include admin and login pages.
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
  // FIX: Add properties for backend integration
  stock?: number;
  isVisible?: boolean;
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
  // FIX: Add properties for backend integration
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
  // FIX: Add property for text width resizing
  width?: number;
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

// Transient type for checkout form data before it's processed and saved
// FIX: Add CheckoutFormDetails for handling order creation form data.
export interface CheckoutFormDetails {
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

// Represents the `orders` table structure
// FIX: Add Order type for database interaction.
export interface Order {
  id: string; // UUID from DB
  order_id_str: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  desired_delivery_date?: string;
  created_at: string;
  // Include all other columns from the 'orders' table
  customer_email?: string;
  shipping_method?: string;
  shipping_cost?: number;
  packaging_fee?: number;
  amount_paid?: number;
  amount_remaining?: number;
  payment_method?: string;
  notes?: string;
}

// Represents the `order_items` table structure
// FIX: Add OrderItem type for database interaction.
export interface OrderItem {
    id: string; // UUID from DB
    order_id: string;
    frame_config: FrameConfig;
    preview_image_url?: string;
    price: number;
}

// FIX: Add User type for authentication.
export interface User {
    username: string;
    role: 'admin' | 'staff';
}

// FIX: Add Product union type for managing all products.
export type Product = (LegoPart | FrameOption) & { type: 'frame' | LegoPart['type'] };

// FIX: Add AllProducts type for fetching all product data.
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

// FIX: Add BackgroundOption type for database interaction.
export interface BackgroundOption {
    id: string;
    name: string;
    url: string;
    category: string;
    isVisible: boolean;
    type: 'square' | 'rectangle';
}

// FIX: Add AllBackgrounds type for fetching all background data.
export interface AllBackgrounds {
    square: BackgroundOption[];
    rectangle: BackgroundOption[];
}

// FIX: Updated StoredOrder to use CheckoutFormDetails.
export interface StoredOrder {
  status: OrderStatus;
  details: CheckoutFormDetails;
}
