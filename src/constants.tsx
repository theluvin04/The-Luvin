import type { FrameConfig, LegoPart } from './types';
import { IMAGE_ASSETS } from './assets';

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

// This data is now static. If LEGO parts become dynamic, these need to be looked up from the fetched data.
const placeholderLegoParts = {
    shirt: [{id: 'shirt2'}, {id: 'shirt3'}, {id: 'shirt4'}, {id: 'shirt5'}],
    pants: [{id: 'pants2'}, {id: 'pants3'}, {id: 'pants4'}, {id: 'pants5'}],
    face: [{id: 'face1'}, {id: 'face2'}, {id: 'face3'}, {id: 'face4'}, {id: 'face5'}],
    hair: [{id: 'hair1'}, {id: 'hair2'}, {id: 'hair3'}, {id: 'hair4'}, {id: 'hair5'}],
    hat: [{id: 'hat1'}]
};

export const COLLECTION_TEMPLATES: { name: string; imageUrl: string; config: FrameConfig }[] = [
    {
        name: 'Wedding Day',
        imageUrl: IMAGE_ASSETS.collectionTemplates.wedding,
        config: {
            frameId: 'lg',
            background: { type: 'image', value: IMAGE_ASSETS.presetBackgrounds.square.valentine },
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
        imageUrl: IMAGE_ASSETS.collectionTemplates.graduation,
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
    {
        name: 'Birthday Fun',
        imageUrl: IMAGE_ASSETS.collectionTemplates.birthday,
        config: {
            frameId: 'sm',
            background: { type: 'image', value: IMAGE_ASSETS.presetBackgrounds.square.sinh_nhat_bg },
            texts: [{...initialTextConfig, id: 3, content: 'Happy Birthday!', y: 25, rotation: 0, scale: 1}],
            characters: [
                { id: 1, shirt: placeholderLegoParts.shirt[3] as LegoPart, pants: placeholderLegoParts.pants[3] as LegoPart, face: placeholderLegoParts.face[4] as LegoPart, hair: placeholderLegoParts.hair[4] as LegoPart, x: 50, y: 75, rotation: 0, scale: 1 },
            ],
            draggableItems: [{id: Date.now(), partId: 'pet1', type: 'pet', x: 20, y: 80, rotation: -10, scale: 1}],
        }
    }
];

export const FEEDBACK_ITEMS = [
    { name: 'Minh & Anh', text: 'Món quà kỷ niệm cưới tuyệt vời, chồng mình rất thích!', imageUrl: IMAGE_ASSETS.feedback.minhAnh },
    { name: 'Gia đình bé Bắp', text: 'Bé nhà mình rất hào hứng khi thấy cả nhà trong khung hình LEGO.', imageUrl: IMAGE_ASSETS.feedback.giaDinhBap },
    { name: 'Hoàng Long', text: 'Shop tư vấn nhiệt tình, giao hàng nhanh. Sẽ ủng hộ lần tới!', imageUrl: IMAGE_ASSETS.feedback.hoangLong },
    { name: 'Thùy Chi', text: 'Chất lượng sản phẩm rất tốt, chi tiết sắc nét.', imageUrl: IMAGE_ASSETS.feedback.thuyChi },
];

export const PRODUCT_HIGHLIGHTS = [
    {id: 1, name: 'Khung Kỷ niệm Ngày cưới', collection: 'Bộ sưu tập Tình yêu', imageUrl: IMAGE_ASSETS.productHighlights.wedding },
    {id: 2, name: 'Khung Tốt nghiệp', collection: 'Bộ sưu tập Dấu ấn', imageUrl: IMAGE_ASSETS.productHighlights.graduation },
    {id: 3, name: 'Khung Gia đình', collection: 'Bộ sưu tập Gia đình', imageUrl: IMAGE_ASSETS.productHighlights.family },
    {id: 4, name: 'Khung Sinh nhật Vui vẻ', collection: 'Bộ sưu tập Mừng tuổi mới', imageUrl: IMAGE_ASSETS.productHighlights.birthday },
]

export const GENERAL_ASSETS = {
  hero: IMAGE_ASSETS.general.hero,
  inspire: IMAGE_ASSETS.general.inspire,
  giftbox: IMAGE_ASSETS.general.giftbox,
  vietqr: IMAGE_ASSETS.general.vietqr,
}