
import type { FrameOption, LegoPart, FrameConfig, OutfitColor } from './types.ts';
import { IMAGE_ASSETS } from './assets.ts';


export const FRAME_OPTIONS: FrameOption[] = [
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

// Standardized dimensions based on 300 DPI spec (1cm = 118.11px)
const PART_W_CM = 2.5;     // 295px
const HAIR_H_CM = 0.6;     // 71px
const FACE_H_CM = 1.0;     // 118px
const SHIRT_H_CM = 1.3;    // 154px
const PANTS_H_CM = 1.6;    // 188px -> Total height is now 4.5cm (531px)
const HAT_H_CM = 0.8;      // A reasonable height for hats


export const LEGO_PARTS: {
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


// ===================================================================================
// =================== CHỈNH SỬA CÁC MẪU NỀN CÓ SẴN TẠI ĐÂY =========================
// ===================================================================================
// Hướng dẫn: 
// - Thêm/sửa/xóa các mẫu cho từng loại khung trong các mảng tương ứng dưới đây.
// - `name`: Tên hiển thị của mẫu.
// - `url`: Dán trực tiếp đường dẫn URL hình ảnh vào đây.
// - `category`: Dịp của mẫu (để khách hàng lọc, vd: 'Kỷ niệm', 'Sinh nhật').
// ===================================================================================

/**
 * === KHUNG VUÔNG ===
 * Áp dụng cho cả 2 cỡ: 15x15cm & 23x23cm
 * Thêm hoặc sửa các mẫu cho khung vuông ở đây.
 */
export const PRESET_BACKGROUNDS_SQUARE: { name: string; url: string; category: string; }[] = [
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

/**
 * === KHUNG CHỮ NHẬT ===
 * Áp dụng cho cỡ A5: 14.8x21cm
 * Thêm hoặc sửa các mẫu cho khung chữ nhật (A5) ở đây.
 */
export const PRESET_BACKGROUNDS_RECTANGLE: { name: string; url: string; category: string; }[] = [
    { name: 'FootBall 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football1, category: 'Kỷ niệm' },
    { name: 'FootBall 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football2, category: 'Sinh nhật' },
    { name: 'FootBall 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football3, category: 'Sinh nhật' },
    { name: 'FootBall 4', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football4, category: 'Tốt nghiệp' },
    { name: 'Tốt nghiệp 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.tot_nghiep3, category: 'Tốt nghiệp' },
    { name: 'Album 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album1, category: 'Album' },
    { name: 'Album 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album2, category: 'Album' },
];

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

export const COLLECTION_TEMPLATES: { name: string; imageUrl: string; config: FrameConfig }[] = [
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