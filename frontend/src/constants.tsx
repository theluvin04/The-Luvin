import type { FrameConfig, LegoPart } from './types';

// NOTE: All product and background data is now fetched from the Supabase database.
// This file only contains initial/template configurations.

export const INITIAL_FRAME_CONFIG: FrameConfig = {
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

// NOTE: LEGO part IDs here are placeholders. The actual parts will be looked up from the database.
const placeholderLegoParts = {
    shirt: [{id: 'shirt2'}, {id: 'shirt3'}, {id: 'shirt4'}, {id: 'shirt5'}],
    pants: [{id: 'pants2'}, {id: 'pants3'}, {id: 'pants4'}, {id: 'pants5'}],
    face: [{id: 'face1'}, {id: 'face2'}, {id: 'face3'}, {id: 'face4'}, {id: 'face5'}],
    hair: [{id: 'hair1'}, {id: 'hair2'}, {id: 'hair3'}, {id: 'hair4'}, {id: 'hair5'}],
    hat: [{id: 'hat1'}]
};

// NOTE: Image URLs in these templates are placeholders. 
// You should update them to point to your actual image URLs in Supabase Storage.
export const COLLECTION_TEMPLATES: { name: string; imageUrl: string; config: FrameConfig }[] = [
    {
        name: 'Wedding Day',
        imageUrl: '/placeholder-collection-wedding.jpg',
        config: {
            frameId: 'lg',
            background: { type: 'image', value: '/placeholder-bg-valentine.jpg' },
            texts: [initialTextConfig],
            characters: [
                { id: 1, shirt: placeholderLegoParts.shirt[0] as LegoPart, pants: placeholderLegoParts.pants[0] as LegoPart, face: placeholderLegoParts.face[1] as LegoPart, hair: placeholderLegoParts.hair[1] as LegoPart, x: 40, y: 75, rotation: 0, scale: 1 },
                { id: 2, shirt: placeholderLegoParts.shirt[1] as LegoPart, pants: placeholderLegoParts.pants[1] as LegoPart, face: placeholderLegoParts.face[2] as LegoPart, hair: placeholderLegoParts.hair[0] as LegoPart, x: 60, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [],
        }
    },
    {
        name: 'Graduation',
        imageUrl: '/placeholder-collection-graduation.jpg',
        config: {
            frameId: 'md',
            background: { type: 'color', value: '#e0f2fe' },
            texts: [{...initialTextConfig, id: 2, content: 'Class of 2024', y: 10, rotation: 0, scale: 1}],
            characters: [
                { id: 1, shirt: placeholderLegoParts.shirt[2] as LegoPart, pants: placeholderLegoParts.pants[2] as LegoPart, face: placeholderLegoParts.face[3] as LegoPart, hat: placeholderLegoParts.hat[0] as LegoPart, x: 50, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [{ id: Date.now(), partId: 'accessory1', type: 'accessory', x: 70, y: 70, rotation: 15, scale: 1 }],
        }
    },
];

export const FEEDBACK_ITEMS = [
    { name: 'Minh & Anh', text: 'Món quà kỷ niệm cưới tuyệt vời, chồng mình rất thích!', imageUrl: '/placeholder-feedback-1.jpg' },
    { name: 'Gia đình bé Bắp', text: 'Bé nhà mình rất hào hứng khi thấy cả nhà trong khung hình LEGO.', imageUrl: '/placeholder-feedback-2.jpg' },
    { name: 'Hoàng Long', text: 'Shop tư vấn nhiệt tình, giao hàng nhanh. Sẽ ủng hộ lần tới!', imageUrl: '/placeholder-feedback-3.jpg' },
];

export const PRODUCT_HIGHLIGHTS = [
    {id: 1, name: 'Khung Kỷ niệm Ngày cưới', collection: 'Bộ sưu tập Tình yêu', imageUrl: '/placeholder-highlight-1.jpg' },
    {id: 2, name: 'Khung Tốt nghiệp', collection: 'Bộ sưu tập Dấu ấn', imageUrl: '/placeholder-highlight-2.jpg' },
    {id: 3, name: 'Khung Gia đình', collection: 'Bộ sưu tập Gia đình', imageUrl: '/placeholder-highlight-3.jpg' },
]

export const GENERAL_ASSETS = {
  hero: '/placeholder-general-hero.jpg',
  inspire: '/placeholder-general-inspire.jpg',
  giftbox: '/placeholder-general-giftbox.jpg',
}
