

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

declare var html2canvas: any;

// === Inlined from types.ts ===
type Page = 'home' | 'builder' | 'collection' | 'feedback' | 'order-lookup' | 'contact' | 'cart' | 'checkout' | 'order-confirmation';

interface FrameOption {
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

interface OutfitColor {
  name: string;
  hex: string;
  imageUrl: string;
  price: number; // Additional price for this color
}

interface LegoPart {
  id: string;
  name: string;
  price: number; // Base price (for default color)
  imageUrl: string;
  type: 'hair' | 'face' | 'shirt' | 'pants' | 'accessory' | 'pet' | 'hat';
  widthCm?: number;
  heightCm?: number;
  colors?: OutfitColor[];
}

interface LegoCharacterConfig {
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

interface TextConfig {
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

interface DraggableItem {
    id: number;
    partId: string; // For accessories/pets, it's the LegoPart ID. For charms, it's the data URL.
    type: 'accessory' | 'pet' | 'charm';
    x: number; // percentage from left
    y: number; // percentage from top
    rotation: number; // degrees
    scale: number; // multiplier
}

interface BackgroundConfig {
  type: 'color' | 'image' | 'upload';
  value: string;
}

interface FrameConfig {
  frameId: string;
  background: BackgroundConfig;
  characters: LegoCharacterConfig[];
  texts: TextConfig[];
  draggableItems: DraggableItem[];
  previewImageUrl?: string;
}

interface OrderDetails {
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

type OrderStatus = 'Chờ thanh toán' | 'Đã xác nhận' | 'Đang xử lý' | 'Đang giao hàng' | 'Đã giao hàng' | 'Đã hủy';

interface StoredOrder {
  status: OrderStatus;
  details: OrderDetails;
}

// === Inlined from assets.ts ===
const IMAGE_ASSETS = {
  frameOptions: {
    sm: 'https://i.imgur.com/O1x9h2j.jpg',
    md: 'https://i.imgur.com/p3QZgff.jpg',
    lg: 'https://i.imgur.com/fL39v3o.jpg',
  },
  legoParts: {
    hair: {
      hair1: 'https://lh3.googleusercontent.com/pw/AP1GczPCPpvDr-CQgRqa-w3G1jvJG2pX5oytXcg2X94eCfbQ40ugBPz6o9ZpMybJU8AffRZci6joKyD3lX0iXpcGo7YP-uaHwATVtZq0mziKnIiK6nENRrsLUkSTaHiNqU6KP9YuBESqLV8VtCeF68434gJp=w295-h472-s-no-gm?authuser=0',
      hair2: 'https://i.imgur.com/2aLDUY1.png',
      hair3: 'https://i.imgur.com/8SLnM32.png',
      hair4: 'https://i.imgur.com/N2sDbvV.png',
      hair5: 'https://i.imgur.com/L13p78E.png',
    },
    face: {
      face1: 'https://lh3.googleusercontent.com/pw/AP1GczO06-xgcPdmnVF7c4hWm6N-DG59zpDg89AtodzS9BDbf5VMc5vnV5l8xSHybBeRorRf4nxADzRbVLcZ2IoFzkxC6ypL7O3yMkRNVl6XGDpfDe4zA1lGbSMTG9z07of7w2unrLqeabCrgMaz6f4c8pHO=w295-h472-s-no-gm?authuser=0',
      face2: 'https://i.imgur.com/hgzcT7A.png',
      face3: 'https://i.imgur.com/lsmh2J8.png',
      face4: 'https://i.imgur.com/9nQlqnM.png',
      face5: 'https://i.imgur.com/AEf47k0.png',
    },
    shirt: {
      shirt1_white: 'https://lh3.googleusercontent.com/pw/AP1GczOVLrstztihrJqNhJzCC-d8TpHh0Bir1z82KMOOpuq3GOwWu6K9T6JDAyjgIBq8dj3jQaLWA9zAlZjGg2raYeER8dIVtBwMPUw6c-NbcsSlMvgYqbag39RYLuxKFZJ7Y4CkIpD3tDLQf4YkbTsrF6nT=w295-h472-s-no-gm?authuser=0',
      shirt1_red: 'https://lh3.googleusercontent.com/pw/AP1GczNe9ZxuP5uYenmJ2OkBjYnoygoVshgZ2TDD8YKieOfsRQ-VLXe-lxNMIwn71vsmW7yNXS8RPo8ynHrj74ZawXVU6kwr5qbeqpDgzEBD0Zs_OiVXE-LojwwEsCVGDb6fG6DNDzDMcnIiN74tMHe9SDt9=w295-h154-s-no-gm?authuser=0',
      shirt1_blue: 'https://i.imgur.com/YAnk5Fv.png',
      shirt2: 'https://i.imgur.com/sKTB6aF.png',
      shirt3: 'https://i.imgur.com/2uIJT8n.png',
      shirt4: 'https://i.imgur.com/dKGAi2f.png',
      shirt5: 'https://i.imgur.com/yLohj2r.png',
    },
    pants: {
      pants1_black: 'https://lh3.googleusercontent.com/pw/AP1GczPc3y3ZtsrHwqrhSrem6tH0Sb2jTukrs6IqM3ZcNWruncnNtpL7ysCpSNtTna2ZXX57U0imYog1TnHiBcE8P_286llBYKGzl_L0z9stZ7jhCwEYZf4BPSCsnKscwR5hqKydGhZvt6XY60yk3luu3CXi=w295-h472-s-no-gm?authuser=0',
      pants1_beige: 'https://lh3.googleusercontent.com/pw/AP1GczNcsJgRKdG0ms5JKkz8Ka8pBJsocsiYcXh7fli0HGxzyNpQTaGvOWg3x-_Qh3Y1ZI6tRdLjAFvrt6ANJzk43UYJedjTpEJFit_UBDs_TkKMcSfPYHtvJgKFrS9iOvSXEKdjMpL-i_IfrgxVcYpZyyrC=w295-h154-s-no-gm?authuser=0',
      pants1_gray: 'https://i.imgur.com/J4p3pAv.png',
      pants2: 'https://i.imgur.com/xQy2S8U.png',
      pants3: 'https://i.imgur.com/L79Qn5V.png',
      pants4: 'https://i.imgur.com/MhQZJ3n.png',
      pants5: 'https://i.imgur.com/XGsaM1v.png',
    },
    hat: {
      hat1: 'https://lh3.googleusercontent.com/pw/AP1GczPCPpvDr-CQgRqa-w3G1jvJG2pX5oytXcg2X94eCfbQ40ugBPz6o9ZpMybJU8AffRZci6joKyD3lX0iXpcGo7YP-uaHwATVtZq0mziKnIiK6nENRrsLUkSTaHiNqU6KP9YuBESqLV8VtCeF68434gJp=w295-h472-s-no-gm?authuser=0',
      hat2: 'https://i.imgur.com/iJEuYwH.png',
      hat3: 'https://i.imgur.com/4q4g16H.png',
    },
    accessory: {
      accessory1: 'https://i.imgur.com/g0S9eYT.png',
      accessory2: 'https://i.imgur.com/u3gLV0t.png',
      accessory3: 'https://i.imgur.com/5Jz8OxC.png',
      accessory4: 'https://i.imgur.com/bUnGPfW.png',
      accessory5: 'https://i.imgur.com/1nQjJ7W.png',
    },
    pet: {
      pet1: 'https://i.imgur.com/1v2sJ2b.png',
      pet2: 'https://i.imgur.com/N6LJ2y2.png',
      pet3: 'https://i.imgur.com/e3yGz0d.png',
    },
  },
  presetBackgrounds: {
    square: {
      kyniem1: 'https://lh3.googleusercontent.com/pw/AP1GczM0nRHEo2eAVli4BgIMG_JIeNPoeyxfEPrX1oiK9jA7c4w-bK0kOsD8D9UycqckgTqhq55378s_aHLW6-ZGSrI5RnnzXKX_ojRsW2rNaW1P6ufoVX-HsAg2A51HVC5H6BAq8sJg6UxsEWFnx_d8h_0=w1031-h1034-s-no-gm?authuser=0',
      kyniem3: 'https://lh3.googleusercontent.com/pw/AP1GczNQIZZ5Q51k0rVMcXZchzlDCyjRzuWIrJF7h8EGiVrUNc6hXv86ltXjaN49aJz1u0Jz0Y5rmZSuCaJ_T538jr7sCIfX3Yiphd_UpM_JQLRhbZh2jXAOhhL1HcjEs3bZrI2MCVcxt2jivjC5OzdqGTI=w1138-h1134-s-no-gm?authuser=0',
      kyniem4: 'http://lh3.googleusercontent.com/pw/AP1GczOyTho_e-2YwjZAAxanbpIl_cy91I_gynW4-6KHqTVHHOw8OCx40V9IOH9h8CY2T7yQlhYtwJlg8VZbieJgLGmYpjUxRXJ5QU0MnRRGHVwIBELZJJjL5rz0IjAjBXdNaB42a8_drRxfMlC3I1F1qIg=w1128-h1131-s-no-gm?authuser=0',
      sinh_nhat1: 'https://lh3.googleusercontent.com/pw/AP1GczM-SMSA6DnWoorLbnq6DyDPQ3QN1EUDfZhP47DphHOVt9mEnwohm1awE0t8L4Y5DLW-7M3rvpiG35-6iz8T1kUrvhUUUkXiiv7QTxMXJmD2UqlNXLbUGv5OOGfR8X04jjazCko4cNov9lbM-xAzWek=w1148-h1132-s-no-gm?authuser=0',
      sinh_nhat4: 'https://lh3.googleusercontent.com/pw/AP1GczOAwzsnaFQ8tGobLpeFseXAhtRTaHFiaZgNxQ4GPiS5I1dkvb2dwenM8XJ3QPrbL-ltVQQ6SXuKW1ul3mRmkA30ACqAflpcVA7zM39nlpftxIHAxx94kxXQIi3ASQYsnmoMN9Ia2eLGxTD51VDqOwk=w1128-h1123-s-no-gm?authuser=0',
      sinh_nhat5: 'https://lh3.googleusercontent.com/pw/AP1GczNQQTFoQOmoe9mdqJKUcwpKJm5R8CG_p8SDm0ipY5ERyicBBFCK4bUJ_aVGpiC8K0ARbsPhaTZ8vf1cSzMWElbw-Ze8sSXY2EhLIr6nvlu42UC9qvseXalPlrK9iBPKor5jnB5vc2dBmfwnR1uDbXk=w1130-h1134-s-no-gm?authuser=0',
      tot_nghiep2: 'https://lh3.googleusercontent.com/pw/AP1GczMdnvFOdBp9ClYfoe_8m4twzxTz1IA1YbmTpfBkDIpGxIWOUxRHoOrFYOy18UGnWzhXvD2Cy6kEoGdHnMS_y05PIVQcYGw3J4_cgrKJvh3iNusRIXpfn6tQenwLUHa155LLgl3GhzMpLzyNBnJHZp0=w1271-h1276-s-no-gm?authuser=0',
      valentine: 'https://i.imgur.com/g0Ab5kG.jpg',
      dam_cuoi: 'https://i.imgur.com/w2Y3gbS.jpg',
      spotify: 'https://i.imgur.com/U8I3uY0.png',
      sinh_nhat_bg: 'https://i.imgur.com/0o3bY8U.jpg',
    },
    rectangle: {
      football1: 'https://lh3.googleusercontent.com/pw/AP1GczP0iky6n0xl4zx_yGr1tIcZPQAr8aDG9bT_uo_Ya8hreVOUxtQggqMhotXOealT9yMWllM7nT6NIFT5hqEcPUKUgwzFEYcqbmn6R1hbGjW-0mE9eYtyIyCeRmsCvm6P0gVTJveCYf_u1hTrGCTWu_gU=w515-h733-s-no-gm?authuser=0',
      football2: 'https://lh3.googleusercontent.com/pw/AP1GczMQ5y2_-1hToGCgRoixEhm-cuf1HwT7M41wk_e4G2b9IcRPvgtNueJXVb8kI7aCmxO63J7l_C8tra_rjNSDQnb0i4TdxEVIyY1hIfHuvy2WT0Y61MCrc427TxEwEBf4MAXCHSto0DYVjUfzIww9yXfo=w512-h739-s-no-gm?authuser=0',
      football3: 'https://lh3.googleusercontent.com/pw/AP1GczO7JgLHHBw6mVgTCLLM4UocVFDzSgPJiPH5beQ2x0G0_aGDHB2-CYdny3pk6FIQVJeyqfpkWnm1XsgolB_o8CLgUI_VJrW4yfFPvEniWkFmEbe_L0X6UFgmjea1Ua23GjJjRwIicv_I51N7z6TsRljU=w512-h736-s-no-gm?authuser=0',
      football4: 'https://lh3.googleusercontent.com/pw/AP1GczPhO-fWNQfBVSOPZdN_weLxO-0pE_F42zJWCzAig3Z7iCYwoTMHz-9VhuZPzy1bVtJslvP-hfpm1fTx567j8rEHM8DBTgeWaCun-rU6x41LLulNOnJIkdqnHqls7vocer-aF79LPgt0TX46WacvIIrS=w513-h739-s-no-gm?authuser=0',
      tot_nghiep3: 'https://i.imgur.com/pBf1gV2.jpg',
      album1: 'https://i.imgur.com/qT1qB1k.jpg',
      album2: 'https://i.imgur.com/sC03b30.jpg',
    },
  },
  collectionTemplates: {
    wedding: 'https://i.imgur.com/8aQp57m.jpg',
    graduation: 'https://i.imgur.com/pBf1gV2.jpg',
    birthday: 'https://i.imgur.com/kY8P8eH.jpg',
  },
  feedback: {
    minhAnh: 'https://i.imgur.com/rQ8aY2w.jpg',
    giaDinhBap: 'https://i.imgur.com/sC03b30.jpg',
    hoangLong: 'https://i.imgur.com/w2Y3gbS.jpg',
    thuyChi: 'https://i.imgur.com/pBf1gV2.jpg',
  },
  productHighlights: {
    wedding: 'https://i.imgur.com/8aQp57m.jpg',
    graduation: 'https://i.imgur.com/pBf1gV2.jpg',
    family: 'https://i.imgur.com/sC03b30.jpg',
    birthday: 'https://i.imgur.com/kY8P8eH.jpg',
  },
  general: {
    hero: 'https://i.imgur.com/8mPmG9W.jpg',
    inspire: 'https://i.imgur.com/v8uYwRj.jpg',
    giftbox: 'https://i.imgur.com/7gDkS1Q.png',
    vietqr: 'https://i.imgur.com/pYCb0a9.png',
  },
};

// === Inlined from constants.tsx ===
const FRAME_OPTIONS: FrameOption[] = [
  { id: 'sm', name: '15x15cm', frameWidthCm: 15, frameHeightCm: 15, backgroundWidthCm: 12, backgroundHeightCm: 12, price: 210000, imageUrl: IMAGE_ASSETS.frameOptions.sm, description: 'Nhỏ gọn, tinh tế' },
  { id: 'md', name: '14.8x21cm', frameWidthCm: 14.8, frameHeightCm: 21, backgroundWidthCm: 12, backgroundHeightCm: 17, price: 220000, imageUrl: IMAGE_ASSETS.frameOptions.md, description: 'Thanh lịch, đứng dáng' },
  { id: 'lg', name: '23x23cm', frameWidthCm: 23, frameHeightCm: 23, backgroundWidthCm: 20, backgroundHeightCm: 20, price: 230000, imageUrl: IMAGE_ASSETS.frameOptions.lg, description: 'Sang trọng, ấn tượng' },
];

const defaultShirtColors: OutfitColor[] = [
    { name: 'Trắng', hex: '#F8F8F8', imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt1_white, price: 0 },
    { name: 'Đỏ', hex: '#E53E3E', imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt1_red, price: 10000 },
    { name: 'Xanh', hex: '#3B82F6', imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt1_blue, price: 10000 },
];

const defaultPantsColors: OutfitColor[] = [
    { name: 'Đen', hex: '#1A202C', imageUrl: IMAGE_ASSETS.legoParts.pants.pants1_black, price: 0 },
    { name: 'Be', hex: '#F5F5DC', imageUrl: IMAGE_ASSETS.legoParts.pants.pants1_beige, price: 10000 },
    { name: 'Xám', hex: '#A0AEC0', imageUrl: IMAGE_ASSETS.legoParts.pants.pants1_gray, price: 10000 },
];

const PART_W_CM = 2.5;
const HAIR_H_CM = 0.6;
const FACE_H_CM = 1.0;
const SHIRT_H_CM = 1.3;
const PANTS_H_CM = 1.6;
const HAT_H_CM = 0.8;

const LEGO_PARTS: {
  hair: LegoPart[];
  face: LegoPart[];
  shirt: LegoPart[];
  pants: LegoPart[];
  hat: LegoPart[];
  accessory: LegoPart[];
  pet: LegoPart[];
} = {
  hair: [
    { id: 'hair1', name: 'Tóc 1', price: 25000, imageUrl: IMAGE_ASSETS.legoParts.hair.hair1, type: 'hair', widthCm: PART_W_CM, heightCm: HAIR_H_CM },
    { id: 'hair2', name: 'Tóc 2', price: 25000, imageUrl: IMAGE_ASSETS.legoParts.hair.hair2, type: 'hair', widthCm: PART_W_CM, heightCm: HAIR_H_CM },
    { id: 'hair3', name: 'Tóc 3', price: 25000, imageUrl: IMAGE_ASSETS.legoParts.hair.hair3, type: 'hair', widthCm: PART_W_CM, heightCm: HAIR_H_CM },
    { id: 'hair4', name: 'Tóc 4', price: 25000, imageUrl: IMAGE_ASSETS.legoParts.hair.hair4, type: 'hair', widthCm: PART_W_CM, heightCm: HAIR_H_CM },
    { id: 'hair5', name: 'Tóc 5', price: 25000, imageUrl: IMAGE_ASSETS.legoParts.hair.hair5, type: 'hair', widthCm: PART_W_CM, heightCm: HAIR_H_CM },
  ],
  face: [
    { id: 'face1', name: 'Mặt 1', price: 0, imageUrl: IMAGE_ASSETS.legoParts.face.face1, type: 'face', widthCm: PART_W_CM, heightCm: FACE_H_CM },
    { id: 'face2', name: 'Mặt 2', price: 0, imageUrl: IMAGE_ASSETS.legoParts.face.face2, type: 'face', widthCm: PART_W_CM, heightCm: FACE_H_CM },
    { id: 'face3', name: 'Mặt 3', price: 0, imageUrl: IMAGE_ASSETS.legoParts.face.face3, type: 'face', widthCm: PART_W_CM, heightCm: FACE_H_CM },
    { id: 'face4', name: 'Mặt 4', price: 0, imageUrl: IMAGE_ASSETS.legoParts.face.face4, type: 'face', widthCm: PART_W_CM, heightCm: FACE_H_CM },
    { id: 'face5', name: 'Mặt 5', price: 0, imageUrl: IMAGE_ASSETS.legoParts.face.face5, type: 'face', widthCm: PART_W_CM, heightCm: FACE_H_CM },
  ],
  shirt: [
    { id: 'shirt1', name: 'Áo trơn', price: 0, imageUrl: defaultShirtColors[0].imageUrl, type: 'shirt', widthCm: PART_W_CM, heightCm: SHIRT_H_CM, colors: defaultShirtColors },
    { id: 'shirt2', name: 'Áo 2', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt2, type: 'shirt', widthCm: PART_W_CM, heightCm: SHIRT_H_CM },
    { id: 'shirt3', name: 'Áo 3', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt3, type: 'shirt', widthCm: PART_W_CM, heightCm: SHIRT_H_CM },
    { id: 'shirt4', name: 'Áo 4', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt4, type: 'shirt', widthCm: PART_W_CM, heightCm: SHIRT_H_CM },
    { id: 'shirt5', name: 'Áo 5', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.shirt.shirt5, type: 'shirt', widthCm: PART_W_CM, heightCm: SHIRT_H_CM },
  ],
  pants: [
    { id: 'pants1', name: 'Quần trơn', price: 0, imageUrl: defaultPantsColors[0].imageUrl, type: 'pants', widthCm: PART_W_CM, heightCm: PANTS_H_CM, colors: defaultPantsColors },
    { id: 'pants2', name: 'Quần 2', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pants.pants2, type: 'pants', widthCm: PART_W_CM, heightCm: PANTS_H_CM },
    { id: 'pants3', name: 'Quần 3', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pants.pants3, type: 'pants', widthCm: PART_W_CM, heightCm: PANTS_H_CM },
    { id: 'pants4', name: 'Quần 4', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pants.pants4, type: 'pants', widthCm: PART_W_CM, heightCm: PANTS_H_CM },
    { id: 'pants5', name: 'Quần 5', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pants.pants5, type: 'pants', widthCm: PART_W_CM, heightCm: PANTS_H_CM },
  ],
  hat: [
    { id: 'hat1', name: 'Mũ 1', price: 30000, imageUrl: IMAGE_ASSETS.legoParts.hat.hat1, type: 'hat', widthCm: PART_W_CM, heightCm: HAT_H_CM },
    { id: 'hat2', name: 'Mũ 2', price: 30000, imageUrl: IMAGE_ASSETS.legoParts.hat.hat2, type: 'hat', widthCm: PART_W_CM, heightCm: HAT_H_CM },
    { id: 'hat3', name: 'Mũ 3', price: 30000, imageUrl: IMAGE_ASSETS.legoParts.hat.hat3, type: 'hat', widthCm: PART_W_CM, heightCm: HAT_H_CM },
  ],
  accessory: [
    { id: 'accessory1', name: 'Phụ kiện 1', price: 5000, imageUrl: IMAGE_ASSETS.legoParts.accessory.accessory1, type: 'accessory', widthCm: 0.8, heightCm: 0.8 },
    { id: 'accessory2', name: 'Phụ kiện 2', price: 5000, imageUrl: IMAGE_ASSETS.legoParts.accessory.accessory2, type: 'accessory', widthCm: 0.8, heightCm: 0.8 },
    { id: 'accessory3', name: 'Phụ kiện 3', price: 5000, imageUrl: IMAGE_ASSETS.legoParts.accessory.accessory3, type: 'accessory', widthCm: 0.8, heightCm: 0.8 },
    { id: 'accessory4', name: 'Phụ kiện 4', price: 40000, imageUrl: IMAGE_ASSETS.legoParts.accessory.accessory4, type: 'accessory', widthCm: 1, heightCm: 1 },
    { id: 'accessory5', name: 'Phụ kiện 5', price: 40000, imageUrl: IMAGE_ASSETS.legoParts.accessory.accessory5, type: 'accessory', widthCm: 1, heightCm: 1 },
  ],
  pet: [
    { id: 'pet1', name: 'Thú cưng 1', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pet.pet1, type: 'pet', widthCm: 2, heightCm: 1.8 },
    { id: 'pet2', name: 'Thú cưng 2', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pet.pet2, type: 'pet', widthCm: 2, heightCm: 1.8 },
    { id: 'pet3', name: 'Thú cưng 3', price: 15000, imageUrl: IMAGE_ASSETS.legoParts.pet.pet3, type: 'pet', widthCm: 2, heightCm: 1.8 },
  ],
};

const PRESET_BACKGROUNDS_SQUARE: { name: string; url: string; category: string; }[] = [
    { name: 'Kỷ niệm 1', url: IMAGE_ASSETS.presetBackgrounds.square.kyniem1, category: 'Kỷ niệm' },
    { name: 'Kỷ niệm 3', url: IMAGE_ASSETS.presetBackgrounds.square.kyniem3, category: 'Kỷ niệm' },
    { name: 'Kỷ niệm 4', url: IMAGE_ASSETS.presetBackgrounds.square.kyniem4, category: 'Kỷ niệm' },
    { name: 'Sinh nhật 1', url: IMAGE_ASSETS.presetBackgrounds.square.sinh_nhat1, category: 'Sinh nhật' },
    { name: 'Sinh nhật 4', url: IMAGE_ASSETS.presetBackgrounds.square.sinh_nhat4, category: 'Sinh nhật' },
    { name: 'Sinh nhật 5', url: IMAGE_ASSETS.presetBackgrounds.square.sinh_nhat5, category: 'Sinh nhật' },
    { name: 'Tốt nghiệp 2', url: IMAGE_ASSETS.presetBackgrounds.square.tot_nghiep2, category: 'Tốt nghiệp' },
    { name: 'Valentine', url: IMAGE_ASSETS.presetBackgrounds.square.valentine, category: 'Valentine' },
    { name: 'Đám cưới', url: IMAGE_ASSETS.presetBackgrounds.square.dam_cuoi, category: 'Đám cưới' },
    { name: 'Spotify', url: IMAGE_ASSETS.presetBackgrounds.square.spotify, category: 'Spotify' },
];

const PRESET_BACKGROUNDS_RECTANGLE: { name: string; url: string; category: string; }[] = [
    { name: 'FootBall 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football1, category: 'Kỷ niệm' },
    { name: 'FootBall 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football2, category: 'Sinh nhật' },
    { name: 'FootBall 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football3, category: 'Sinh nhật' },
    { name: 'FootBall 4', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football4, category: 'Tốt nghiệp' },
    { name: 'Tốt nghiệp 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.tot_nghiep3, category: 'Tốt nghiệp' },
    { name: 'Album 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album1, category: 'Album' },
    { name: 'Album 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album2, category: 'Album' },
];

const INITIAL_FRAME_CONFIG: FrameConfig = {
  frameId: 'sm',
  background: { type: 'color', value: '#f4eee8' },
  characters: [],
  texts: [],
  draggableItems: [],
};

const initialTextConfig = {
    id: 1,
    content: 'Our Special Day',
    font: 'Anniversary',
    size: 50,
    color: '#333333',
    x: 50,
    y: 20,
    rotation: -5,
    scale: 1.2,
    background: true,
    textAlign: 'center' as const,
};

const COLLECTION_TEMPLATES: { name: string; imageUrl: string; config: FrameConfig }[] = [
    {
        name: 'Wedding Day',
        imageUrl: IMAGE_ASSETS.collectionTemplates.wedding,
        config: {
            frameId: 'lg',
            background: { type: 'image', value: IMAGE_ASSETS.presetBackgrounds.square.valentine },
            texts: [initialTextConfig],
            characters: [
                { id: 1, shirt: LEGO_PARTS.shirt[1], pants: LEGO_PARTS.pants[1], face: LEGO_PARTS.face[1], hair: LEGO_PARTS.hair[1], x: 40, y: 75, rotation: 0, scale: 1 },
                { id: 2, shirt: LEGO_PARTS.shirt[2], pants: LEGO_PARTS.pants[2], face: LEGO_PARTS.face[2], hair: LEGO_PARTS.hair[2], x: 60, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [],
        }
    },
    {
        name: 'Graduation',
        imageUrl: IMAGE_ASSETS.collectionTemplates.graduation,
        config: {
            frameId: 'md',
            background: { type: 'color', value: '#e0f2fe' },
            texts: [{...initialTextConfig, id: 2, content: 'Class of 2024', y: 10, rotation: 0, scale: 1}],
            characters: [
                { id: 1, shirt: LEGO_PARTS.shirt[3], pants: LEGO_PARTS.pants[3], face: LEGO_PARTS.face[3], hat: LEGO_PARTS.hat[0], x: 50, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [{ id: Date.now(), partId: 'accessory1', type: 'accessory', x: 70, y: 70, rotation: 15, scale: 1 }],
        }
    },
    {
        name: 'Birthday Fun',
        imageUrl: IMAGE_ASSETS.collectionTemplates.birthday,
        config: {
            frameId: 'sm',
            background: { type: 'image', value: IMAGE_ASSETS.presetBackgrounds.square.sinh_nhat_bg },
            texts: [{...initialTextConfig, id: 3, content: 'Happy Birthday!', y: 25, rotation: 0, scale: 1}],
            characters: [
                { id: 1, shirt: LEGO_PARTS.shirt[4], pants: LEGO_PARTS.pants[4], face: LEGO_PARTS.face[4], hair: LEGO_PARTS.hair[4], x: 50, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [{id: Date.now(), partId: 'pet1', type: 'pet', x: 20, y: 80, rotation: -10, scale: 1}],
        }
    }
];

const FEEDBACK_ITEMS = [
    { name: 'Minh & Anh', text: 'Món quà kỷ niệm cưới tuyệt vời, chồng mình rất thích!', imageUrl: IMAGE_ASSETS.feedback.minhAnh },
    { name: 'Gia đình bé Bắp', text: 'Bé nhà mình rất hào hứng khi thấy cả nhà trong khung hình LEGO.', imageUrl: IMAGE_ASSETS.feedback.giaDinhBap },
    { name: 'Hoàng Long', text: 'Shop tư vấn nhiệt tình, giao hàng nhanh. Sẽ ủng hộ lần tới!', imageUrl: IMAGE_ASSETS.feedback.hoangLong },
    { name: 'Thùy Chi', text: 'Chất lượng sản phẩm rất tốt, chi tiết sắc nét.', imageUrl: IMAGE_ASSETS.feedback.thuyChi },
];

const PRODUCT_HIGHLIGHTS = [
    {id: 1, name: 'Khung Kỷ niệm Ngày cưới', collection: 'Bộ sưu tập Tình yêu', imageUrl: IMAGE_ASSETS.productHighlights.wedding },
    {id: 2, name: 'Khung Tốt nghiệp', collection: 'Bộ sưu tập Dấu ấn', imageUrl: IMAGE_ASSETS.productHighlights.graduation },
    {id: 3, name: 'Khung Gia đình', collection: 'Bộ sưu tập Gia đình', imageUrl: IMAGE_ASSETS.productHighlights.family },
    {id: 4, name: 'Khung Sinh nhật Vui vẻ', collection: 'Bộ sưu tập Mừng tuổi mới', imageUrl: IMAGE_ASSETS.productHighlights.birthday },
]

const GENERAL_ASSETS = {
  hero: IMAGE_ASSETS.general.hero,
  inspire: IMAGE_ASSETS.general.inspire,
  giftbox: IMAGE_ASSETS.general.giftbox,
  vietqr: IMAGE_ASSETS.general.vietqr,
}

// === Inlined from components/FramePreview.tsx ===
type Transform = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const FramePreview = React.forwardRef<HTMLDivElement, any>(({ config, containerWidth = 400, onItemTransform, onTextUpdate, className, isInteractive = true, selectedItemId, setSelectedItemId }, ref) => {
  const frameOption = FRAME_OPTIONS.find(f => f.id === config.frameId) || FRAME_OPTIONS[0];
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isCurrentlyEditingText, setIsCurrentlyEditingText] = useState(false);

  const maxDimensionCm = useMemo(() => 
    Math.max(...FRAME_OPTIONS.map(f => Math.max(f.frameWidthCm, f.frameHeightCm)))
  , []);

  const pxPerCm = containerWidth / maxDimensionCm;
  const frameWidth = frameOption.frameWidthCm * pxPerCm;
  const frameHeight = frameOption.frameHeightCm * pxPerCm;
  const backgroundWidth = frameOption.backgroundWidthCm * pxPerCm;
  const backgroundHeight = frameOption.backgroundHeightCm * pxPerCm;

  const backgroundStyle: React.CSSProperties =
    config.background.type === 'color'
      ? { backgroundColor: config.background.value }
      : { backgroundImage: `url(${config.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  
  const allParts: Record<string, LegoPart> = {
      ...Object.values(LEGO_PARTS).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {})
  };
  
  const LegoCharacter: React.FC<{ character: FrameConfig['characters'][0]; scale: number }> = ({ character, scale }) => {
      const charWidth = 2.5 * scale;
      const charHeight = 4.0 * scale;
      const hair = character.hair;
      const hat = character.hat;
      const face = character.face;
      const shirt = character.shirt;
      const pants = character.pants;
      const shirtImageUrl = character.selectedShirtColor?.imageUrl || shirt?.imageUrl;
      const pantsImageUrl = character.selectedPantsColor?.imageUrl || pants?.imageUrl;
      const partStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' };
      return (
        <div className="relative flex-shrink-0" style={{ width: charWidth, height: charHeight }}>
          {pants && pantsImageUrl && <img src={pantsImageUrl} alt="pants" style={partStyle} />}
          {shirt && shirtImageUrl && <img src={shirtImageUrl} alt="shirt" style={partStyle} />}
          {face && <img src={face.imageUrl} alt="face" style={partStyle} />}
          {!hat && hair && <img src={hair.imageUrl} alt="hair" style={partStyle} />}
          {hat && <img src={hat.imageUrl} alt="hat" style={partStyle} />}
        </div>
      );
    };

    const getFontFamily = (fontName: string) => {
        switch (fontName) {
            case 'Anniversary': return '"Dancing Script", cursive';
            case 'Serif': return '"Noto Serif", serif';
            case 'Playfair Display': return '"Playfair Display", serif';
            default: return '"Montserrat", sans-serif';
        }
    };

    const EditableText: React.FC<any> = ({ text, scale, onUpdate, onBeginEditing, onEndEditing }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editedContent, setEditedContent] = useState(text.content);
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        useEffect(() => {
            if (isEditing && textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            }
        }, [isEditing]);

        const handleBlur = () => {
            onUpdate({ content: editedContent });
            setIsEditing(false);
            onEndEditing();
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBlur(); }
            if (e.key === 'Escape') { e.preventDefault(); setEditedContent(text.content); handleBlur(); }
        };

        const textStyle: React.CSSProperties = {
            fontFamily: getFontFamily(text.font),
            fontSize: `${text.size * (scale / 20)}px`,
            color: text.color,
            whiteSpace: 'pre-wrap',
            textAlign: text.textAlign || 'center',
            padding: '10px',
            textShadow: '0 0 5px white, 0 0 5px white',
            ...(text.background && { backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', borderRadius: '5px' })
        };

        if (isEditing) {
            return ( <textarea ref={textareaRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} style={{ ...textStyle, width: '100%', height: 'auto', minWidth: '150px', border: 'none', outline: 'none', resize: 'none', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 0 0 2px #efa3b5', margin: 0, cursor: 'text' }} /> );
        }
        return ( <div style={{minWidth: '50px'}} onDoubleClick={() => { setIsEditing(true); setEditedContent(text.content); onBeginEditing(); }}> <p style={textStyle} >{text.content}</p></div> );
    };

    const Transformable: React.FC<any> = ({ children, id, initialTransform, onTransform, parentRef, isSelected, onSelect, isResizable = true, isRotatable = true, isDraggable = true }) => {
        const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isDraggable) return;
            e.preventDefault(); e.stopPropagation(); onSelect(id);
            const parentRect = parentRef.current?.getBoundingClientRect();
            if (!parentRect) return;
            const startX = e.clientX; const startY = e.clientY;
            const handleMouseMove = (moveEvent: MouseEvent) => {
                const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY;
                const newX = ((initialTransform.x / 100) * parentRect.width + dx) / parentRect.width * 100;
                const newY = ((initialTransform.y / 100) * parentRect.height + dy) / parentRect.height * 100;
                onTransform(id, { ...initialTransform, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)), });
            };
            const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
            window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
        };
        const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation();
            const parentRect = parentRef.current?.getBoundingClientRect(); if (!parentRect) return;
            const centerX = parentRect.left + (initialTransform.x / 100) * parentRect.width; const centerY = parentRect.top + (initialTransform.y / 100) * parentRect.height;
            const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI; const startRotation = initialTransform.rotation;
            const handleMouseMove = (moveEvent: MouseEvent) => {
                const currentAngle = Math.atan2(moveEvent.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
                const deltaAngle = currentAngle - startAngle;
                onTransform(id, { ...initialTransform, rotation: startRotation + deltaAngle });
            };
            const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
            window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
        };
        const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation();
            const parentRect = parentRef.current?.getBoundingClientRect(); if (!parentRect) return;
            const startX = e.clientX; const startScale = initialTransform.scale;
            const handleMouseMove = (moveEvent: MouseEvent) => {
                const dx = moveEvent.clientX - startX; const scaleChange = dx / 100;
                onTransform(id, { ...initialTransform, scale: Math.max(0.2, startScale + scaleChange) });
            };
            const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
            window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
        };
        return (
            <div onMouseDown={handleMouseDown} className="absolute" style={{ left: `${initialTransform.x}%`, top: `${initialTransform.y}%`, transform: `translate(-50%, -50%) rotate(${initialTransform.rotation}deg) scale(${initialTransform.scale})`, touchAction: 'none', cursor: isDraggable ? (isSelected ? 'move' : 'pointer') : 'default', outline: isSelected && isDraggable ? '2px dashed #efa3b5' : 'none', outlineOffset: '5px' }}>
                {children}
                {isSelected && isDraggable && (
                    <>
                        {isRotatable && <div onMouseDown={handleRotate} className="transform-handle absolute -top-6 left-1/2 -translate-x-1/2 cursor-alias bg-luvin-pink text-white rounded-full h-4 w-4" title="Rotate"></div>}
                        {isResizable && <div onMouseDown={handleResize} className="transform-handle absolute -bottom-2 -right-2 cursor-nwse-resize bg-luvin-pink w-3 h-3 rounded-full border-2 border-white" title="Resize"></div>}
                    </>
                )}
            </div>
        );
    };

  return (
    <div ref={ref} className={`flex items-center justify-center ${className}`} style={{ width: frameWidth, height: frameHeight }}>
        <div className="relative bg-white" style={{ width: '100%', height: '100%', boxShadow: `0 4px 12px #d8d8d8` }}>
            <div ref={previewContainerRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden" style={{ width: backgroundWidth, height: backgroundHeight, ...backgroundStyle, boxShadow: `inset 0 0 0 1px rgba(0, 0, 0, 0.15)` }} onClick={(e) => { if (isInteractive && e.target === previewContainerRef.current) { setSelectedItemId(null); } }}>
                {config.characters.map(char => {
                    const id = `character-${char.id}`;
                    return ( <Transformable key={id} id={id} initialTransform={char} onTransform={onItemTransform} parentRef={previewContainerRef} isSelected={selectedItemId === id} onSelect={setSelectedItemId} isResizable={false} isRotatable={false} isDraggable={isInteractive}> <LegoCharacter character={char} scale={pxPerCm} /> </Transformable> );
                })}
                {config.draggableItems.map(item => {
                    const isCharm = item.type === 'charm';
                    const part = !isCharm ? allParts[item.partId] : null;
                    const imageUrl = isCharm ? item.partId : part?.imageUrl;
                    const name = isCharm ? 'charm' : part?.name;
                    const widthCm = isCharm ? 2 : (part?.widthCm || 1);
                    const heightCm = isCharm ? 2 : (part?.heightCm || 1);
                    if (!imageUrl) return null;
                    const id = `item-${item.id}`;
                    return ( <Transformable key={id} id={id} initialTransform={item} onTransform={onItemTransform} parentRef={previewContainerRef} isSelected={selectedItemId === id} onSelect={setSelectedItemId} isResizable={false} isRotatable={isInteractive} isDraggable={isInteractive}> <img src={imageUrl} alt={name} className="pointer-events-none" style={{ width: widthCm * pxPerCm, height: heightCm * pxPerCm, objectFit: 'contain' }}/> </Transformable> );
                })}
                {config.texts.map(text => {
                    const id = `text-${text.id}`;
                    return ( <Transformable key={id} id={id} initialTransform={{x: text.x, y: text.y, rotation: text.rotation, scale: text.scale}} onTransform={onItemTransform} parentRef={previewContainerRef} isSelected={selectedItemId === id} onSelect={setSelectedItemId} isDraggable={isInteractive && !isCurrentlyEditingText}> <EditableText text={text} scale={pxPerCm} onUpdate={(updates) => onTextUpdate(text.id, updates)} onBeginEditing={() => setIsCurrentlyEditingText(true)} onEndEditing={() => setIsCurrentlyEditingText(false)} /> </Transformable> );
                })}
            </div>
        </div>
    </div>
  );
});

// === Inlined from App.tsx ===
const App: React.FC = () => {
  // FIX: Inlined all helper components and functions from App.tsx to resolve scope issues.
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
  }> = ({ config, setConfig, addText, addCharm }) => {
    const bgUploadRef = useRef<HTMLInputElement>(null);
    const charmUploadRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
    const availableBackgrounds = useMemo(() => {
      // Check if the selected frame is square ('sm' or 'lg') or rectangle ('md')
      const isSquare = config.frameId === 'sm' || config.frameId === 'lg';
      return isSquare ? PRESET_BACKGROUNDS_SQUARE : PRESET_BACKGROUNDS_RECTANGLE;
    }, [config.frameId]);
  
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
  }> = ({ config, setConfig, navigateTo, onAddToCart, showToast }) => {
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
    
    const allParts = useMemo(() => Object.values(LEGO_PARTS).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {} as Record<string, LegoPart>), []);
  
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
        const newText: TextConfig = { id: newId, content: 'Nhập chữ...', font: 'Montserrat', size: 30, color: '#333333', x: 50, y: 50, rotation: 0, scale: 1, background: true, textAlign: 'center' };
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
        case 2: return <Step2BackgroundAndDecorations config={config} setConfig={setConfig} addText={addText} addCharm={addCharm} />;
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

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

  const allParts = useMemo(() => Object.values(LEGO_PARTS).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {} as Record<string, LegoPart>), []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
  };

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
      setCartItems([]);
      navigateTo('order-confirmation');
  };
  
  const renderCurrentPage = () => {
    // This is where all the page components would be defined if they weren't so large
    // For brevity, I will just call them, assuming they are defined above in the monolith
    // In the actual monolith, the component definitions would be here.
    // This is a placeholder for the logic that was in App.tsx originally.
    // The actual components (HomePage, BuilderPage etc.) are defined inside App.tsx in the provided code
    // So they are in scope here. I'll just copy the original switch statement.
    switch (page) {
      case 'home': return <HomePage navigateTo={navigateTo} />;
      case 'builder': return <BuilderPage config={frameConfig} setConfig={setFrameConfig} navigateTo={navigateTo} onAddToCart={handleAddToCart} showToast={showToast} />;
      case 'collection': return <CollectionPage navigateTo={navigateTo} setConfig={setFrameConfig} />;
      case 'cart': return <CartPage cartItems={cartItems} onRemoveItem={handleRemoveFromCart} allParts={allParts} navigateTo={navigateTo} />;
      case 'checkout': return <CheckoutPage cartItems={cartItems} allParts={allParts} onConfirmOrder={handleConfirmOrder} />;
      case 'order-confirmation': return orderDetails ? <OrderConfirmationPage details={orderDetails} allParts={allParts} /> : <CheckoutPage cartItems={cartItems} allParts={allParts} onConfirmOrder={handleConfirmOrder} />;
      case 'order-lookup': return <OrderLookupPage allOrders={allOrders} />;
      case 'contact': return <ContactPage />;
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



// === Final render call from original index.tsx ===
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);