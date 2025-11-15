import type { FrameConfig } from './types';
import { IMAGE_ASSETS } from './assets';

export const INITIAL_FRAME_CONFIG: FrameConfig = {
  frameId: 'sm',
  background: { type: 'color', value: '#f4eee8' },
  characters: [],
  texts: [],
  draggableItems: [],
};

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

export const PRESET_BACKGROUNDS_RECTANGLE: { name: string; url: string; category: string; }[] = [
    { name: 'FootBall 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football1, category: 'Kỷ niệm' },
    { name: 'FootBall 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football2, category: 'Sinh nhật' },
    { name: 'FootBall 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football3, category: 'Sinh nhật' },
    { name: 'FootBall 4', url: IMAGE_ASSETS.presetBackgrounds.rectangle.football4, category: 'Tốt nghiệp' },
    { name: 'Tốt nghiệp 3', url: IMAGE_ASSETS.presetBackgrounds.rectangle.tot_nghiep3, category: 'Tốt nghiệp' },
    { name: 'Album 1', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album1, category: 'Album' },
    { name: 'Album 2', url: IMAGE_ASSETS.presetBackgrounds.rectangle.album2, category: 'Album' },
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