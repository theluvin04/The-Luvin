
import React, { useMemo } from 'react';
import { CollectionTemplate, FrameConfig, LegoPart, FrameOption } from '../types';
import { calculatePrice, formatCurrency } from '../utils/pricing';
import { ZoomIcon } from '../components/ZoomIcon';

interface TemplateDetailPageProps {
    template: CollectionTemplate;
    onCustomize: (config: FrameConfig) => void;
    onBack: () => void;
    onZoomImage: (url: string) => void;
    allParts: Record<string, LegoPart>;
    frames: FrameOption[];
}

export const TemplateDetailPage: React.FC<TemplateDetailPageProps> = ({ 
    template, onCustomize, onBack, onZoomImage, allParts, frames 
}) => {
    const { totalPrice } = calculatePrice(template.config, allParts, frames);
    const frame = frames.find(f => f.id === template.config.frameId);

    return (
        <div className="min-h-screen bg-[#f9f4ef] font-body pb-20 animate-fade-in">
             {/* Header / Breadcrumb */}
             <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4">
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2 font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Quay lại bộ sưu tập
                    </button>
                </div>
             </div>

             <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                    {/* Left: Image */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-center relative group">
                        <img 
                            src={template.imageUrl} 
                            alt={template.name} 
                            className="w-full max-h-[500px] object-contain shadow-lg"
                        />
                        <button 
                            onClick={() => onZoomImage(template.imageUrl)}
                            className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-3 rounded-full shadow hover:bg-luvin-pink hover:text-white transition-colors"
                        >
                            <ZoomIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-8 lg:sticky lg:top-24">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 mb-4 leading-tight">{template.name}</h1>
                            <div className="flex items-baseline gap-4">
                                <p className="text-3xl font-bold text-luvin-pink">{formatCurrency(totalPrice)}</p>
                                <span className="text-sm text-gray-400 font-medium">Giá ước tính</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Chi tiết thiết kế</h3>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Loại khung:</span>
                                    <span className="font-medium">{frame?.name || template.config.frameId} ({frame?.description})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kích thước:</span>
                                    <span className="font-medium">{frame?.frameWidthCm} x {frame?.frameHeightCm} cm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số lượng nhân vật:</span>
                                    <span className="font-medium">{template.config.characters.length} nhân vật</span>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-dashed border-gray-200">
                                <p className="font-bold text-gray-800 mb-2">Đặc điểm nổi bật:</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-500 text-sm">
                                    <li>Thiết kế có thể tùy chỉnh hoàn toàn (tóc, áo, phụ kiện...).</li>
                                    <li>Miễn phí in ảnh & lời chúc theo yêu cầu.</li>
                                    <li>Đóng gói hộp quà trang trọng, sẵn sàng để tặng.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => onCustomize(template.config)}
                                className="w-full bg-luvin-pink text-gray-900 font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#e890a5] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Tùy chỉnh mẫu này
                            </button>
                            <p className="text-xs text-center text-gray-400">
                                * Bạn sẽ được chuyển sang trang thiết kế để chỉnh sửa chi tiết.
                            </p>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};
