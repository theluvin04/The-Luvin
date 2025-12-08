
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudioTemplate, StudioLayer, FrameOption, LayerType, CustomFont } from '../../types';
import { getAllStudioTemplates, saveStudioTemplate, deleteStudioTemplate } from '../../services/studioService';
import { uploadToCloudinary } from '../../services/uploadService';
import { getStoreConfig } from '../../services/configService';

interface AdminStudioProps {
    frames: FrameOption[];
}

const DEFAULT_LAYER_PROPS = {
    x: 50, y: 50, width: 20, height: 10, rotation: 0, opacity: 1, visible: true, locked: false, allowUserEdit: true
};

export const AdminStudio: React.FC<AdminStudioProps> = ({ frames }) => {
    const [templates, setTemplates] = useState<StudioTemplate[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [loading, setLoading] = useState(false);
    const [fonts, setFonts] = useState<CustomFont[]>([]);

    // Editor State
    const [currentTemplate, setCurrentTemplate] = useState<StudioTemplate | null>(null);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);

    // Canvas Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<{ id: string, startX: number, startY: number, startLayerX: number, startLayerY: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [tpls, config] = await Promise.all([
            getAllStudioTemplates(),
            getStoreConfig()
        ]);
        setTemplates(tpls);
        if (config?.uploadedFonts) {
            setFonts(config.uploadedFonts);
        }
        setLoading(false);
    };

    const handleCreateNew = () => {
        const newTemplate: StudioTemplate = {
            id: `tpl_${Date.now()}`,
            name: 'Template Mới',
            category: 'General',
            frameId: frames[0]?.id || 'lg',
            layers: [],
            updatedAt: Date.now()
        };
        setCurrentTemplate(newTemplate);
        setViewMode('editor');
    };

    const handleEdit = (tpl: StudioTemplate) => {
        setCurrentTemplate(JSON.parse(JSON.stringify(tpl))); // Deep clone
        setViewMode('editor');
    };

    const handleDelete = async (id: string) => {
        if (confirm("Xóa template này?")) {
            await deleteStudioTemplate(id);
            loadData();
        }
    };

    const handleSave = async () => {
        if (!currentTemplate) return;
        setLoading(true);
        
        // Capture thumbnail logic could go here (using html2canvas)
        // For now, we save raw data
        
        const success = await saveStudioTemplate(currentTemplate);
        if (success) {
            alert("Đã lưu thành công!");
            loadData();
        } else {
            alert("Lỗi lưu template");
        }
        setLoading(false);
    };

    // --- EDITOR LOGIC ---

    const currentFrame = frames.find(f => f.id === currentTemplate?.frameId) || frames[0];
    
    // Pixel mapping (1cm = 40px for editor view)
    const PX_PER_CM = 40;
    const canvasWidth = (currentFrame?.backgroundWidthCm || 20) * PX_PER_CM;
    const canvasHeight = (currentFrame?.backgroundHeightCm || 20) * PX_PER_CM;

    const addLayer = (type: LayerType) => {
        if (!currentTemplate) return;
        const id = `layer_${Date.now()}`;
        const newLayer: StudioLayer = {
            id,
            type,
            name: `${type} ${currentTemplate.layers.length + 1}`,
            ...DEFAULT_LAYER_PROPS,
            width: type === 'text' ? 40 : 30, // Percentage
            height: type === 'text' ? 10 : 30,
        };

        if (type === 'text') {
            newLayer.text = 'Nhập văn bản...';
            newLayer.fontSize = 24;
            newLayer.fill = '#000000';
            newLayer.fontFamily = 'Montserrat';
            newLayer.textAlign = 'center';
        } else if (type === 'shape') {
            newLayer.shapeType = 'rectangle';
            newLayer.fill = '#e2e8f0';
        } else if (type === 'image') {
            newLayer.src = 'https://placehold.co/100'; // Placeholder
        }

        setCurrentTemplate(prev => prev ? {
            ...prev,
            layers: [...prev.layers, newLayer]
        } : null);
        setSelectedLayerId(id);
    };

    const updateLayer = (id: string, updates: Partial<StudioLayer>) => {
        setCurrentTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } : l)
            };
        });
    };

    const deleteLayer = (id: string) => {
        setCurrentTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                layers: prev.layers.filter(l => l.id !== id)
            };
        });
        setSelectedLayerId(null);
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            const url = await uploadToCloudinary(e.target.files[0]);
            setLoading(false);
            if (url) {
                if (selectedLayerId) {
                    // Update existing image layer
                    updateLayer(selectedLayerId, { src: url });
                } else {
                    // Add new image layer
                    const id = `layer_${Date.now()}`;
                    const newLayer: StudioLayer = {
                        id,
                        type: 'image',
                        name: `Image ${currentTemplate?.layers.length || 0 + 1}`,
                        ...DEFAULT_LAYER_PROPS,
                        width: 30,
                        height: 30,
                        src: url
                    };
                    setCurrentTemplate(prev => prev ? { ...prev, layers: [...prev.layers, newLayer] } : null);
                    setSelectedLayerId(id);
                }
            }
        }
    };

    // --- CANVAS INTERACTION ---

    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        if (previewMode) return;
        e.stopPropagation();
        setSelectedLayerId(layerId);
        
        const layer = currentTemplate?.layers.find(l => l.id === layerId);
        if (!layer || layer.locked) return;

        draggingRef.current = {
            id: layerId,
            startX: e.clientX,
            startY: e.clientY,
            startLayerX: layer.x,
            startLayerY: layer.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingRef.current || !canvasRef.current) return;
        
        const { startX, startY, startLayerX, startLayerY } = draggingRef.current;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        // Calculate delta in percentage relative to canvas size
        const deltaX = ((e.clientX - startX) / (canvasRect.width / zoom)) * 100;
        const deltaY = ((e.clientY - startY) / (canvasRect.height / zoom)) * 100;

        updateLayer(draggingRef.current.id, {
            x: startLayerX + deltaX,
            y: startLayerY + deltaY
        });
    };

    const handleMouseUp = () => {
        draggingRef.current = null;
    };

    // --- RENDERERS ---

    if (viewMode === 'list') {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Studio Design (Smart Templates)</h2>
                    <button onClick={handleCreateNew} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-black">+ Tạo Template Mới</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                                {tpl.thumbnailUrl ? <img src={tpl.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">🎨</span>}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => handleEdit(tpl)} className="bg-white text-gray-900 px-3 py-1 rounded font-bold text-sm">Sửa</button>
                                    <button onClick={() => handleDelete(tpl.id)} className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">Xóa</button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800">{tpl.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{tpl.category} • {frames.find(f=>f.id===tpl.frameId)?.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!currentTemplate) return null;

    const selectedLayer = currentTemplate.layers.find(l => l.id === selectedLayerId);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {/* Top Bar */}
            <div className="bg-white border-b h-14 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-900 font-bold">&larr; Thoát</button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <input 
                        className="font-bold text-gray-800 border-none focus:ring-0 p-0" 
                        value={currentTemplate.name} 
                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded">-</button>
                        <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded">+</button>
                    </div>
                    <button onClick={() => setPreviewMode(!previewMode)} className={`px-4 py-2 rounded text-sm font-bold border ${previewMode ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300'}`}>
                        {previewMode ? 'Thoát Preview' : '👁️ Preview'}
                    </button>
                    <button onClick={handleSave} className="bg-gray-900 text-white px-6 py-2 rounded text-sm font-bold hover:bg-black">
                        {loading ? 'Đang lưu...' : 'Lưu Template'}
                    </button>
                </div>
            </div>

            <div className="flex flex-grow overflow-hidden">
                {/* LEFT: TOOLS & LAYERS */}
                <div className="w-64 bg-white border-r flex flex-col z-10">
                    <div className="p-4 border-b">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Công cụ</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => addLayer('text')} className="flex flex-col items-center justify-center p-3 border rounded hover:bg-gray-50 transition-colors">
                                <span className="text-xl">T</span>
                                <span className="text-xs font-medium">Text</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-3 border rounded hover:bg-gray-50 transition-colors cursor-pointer">
                                <span className="text-xl">🖼️</span>
                                <span className="text-xs font-medium">Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                            </label>
                            <button onClick={() => addLayer('shape')} className="flex flex-col items-center justify-center p-3 border rounded hover:bg-gray-50 transition-colors">
                                <span className="text-xl">⬜</span>
                                <span className="text-xs font-medium">Shape</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Layers ({currentTemplate.layers.length})</h4>
                        <div className="space-y-1">
                            {[...currentTemplate.layers].reverse().map(layer => (
                                <div 
                                    key={layer.id} 
                                    onClick={() => setSelectedLayerId(layer.id)}
                                    className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer border ${selectedLayerId === layer.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span>{layer.type === 'text' ? 'T' : layer.type === 'image' ? 'IMG' : 'S'}</span>
                                        <span className="truncate">{layer.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }} className="text-gray-400 hover:text-gray-600">
                                            {layer.visible ? '👁️' : '🚫'}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }} className="text-gray-400 hover:text-gray-600">
                                            {layer.locked ? '🔒' : '🔓'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: CANVAS */}
                <div className="flex-grow bg-gray-100 overflow-auto flex items-center justify-center p-8 relative">
                    <div 
                        ref={canvasRef}
                        className="bg-white shadow-2xl relative overflow-hidden transition-transform ease-out duration-200 origin-center"
                        style={{ 
                            width: canvasWidth, 
                            height: canvasHeight,
                            transform: `scale(${zoom})`,
                        }}
                        onClick={() => setSelectedLayerId(null)}
                    >
                        {/* Render Layers */}
                        {currentTemplate.layers.map(layer => {
                            if (!layer.visible) return null;
                            const isSelected = selectedLayerId === layer.id;
                            
                            const style: React.CSSProperties = {
                                position: 'absolute',
                                left: `${layer.x}%`,
                                top: `${layer.y}%`,
                                width: `${layer.width}%`,
                                height: `${layer.height}%`,
                                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                opacity: layer.opacity,
                                cursor: previewMode || layer.locked ? 'default' : 'move',
                                outline: isSelected && !previewMode ? '2px dashed #3b82f6' : 'none',
                                zIndex: 10
                            };

                            if (layer.type === 'text') {
                                style.fontFamily = layer.fontFamily;
                                style.fontSize = `${layer.fontSize}px`; // This should be relative in real impl
                                style.color = layer.fill;
                                style.textAlign = layer.textAlign;
                                style.whiteSpace = 'pre-wrap';
                                style.display = 'flex';
                                style.alignItems = 'center';
                                style.justifyContent = layer.textAlign === 'center' ? 'center' : layer.textAlign === 'right' ? 'flex-end' : 'flex-start';
                            } else if (layer.type === 'shape') {
                                style.backgroundColor = layer.fill;
                                if (layer.shapeType === 'circle') style.borderRadius = '50%';
                            }

                            return (
                                <div 
                                    key={layer.id} 
                                    style={style}
                                    onMouseDown={(e) => handleMouseDown(e, layer.id)}
                                >
                                    {layer.type === 'text' && layer.text}
                                    {layer.type === 'image' && (
                                        <img src={layer.src} className="w-full h-full object-cover pointer-events-none" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: PROPERTIES */}
                <div className="w-72 bg-white border-l p-4 overflow-y-auto z-10">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 border-b pb-2">Thuộc tính</h4>
                    {selectedLayer ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Tên Layer</label>
                                <input className="w-full border p-1.5 rounded text-sm" value={selectedLayer.name} onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold mb-1">X (%)</label>
                                    <input type="number" className="w-full border p-1.5 rounded text-sm" value={Math.round(selectedLayer.x)} onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Y (%)</label>
                                    <input type="number" className="w-full border p-1.5 rounded text-sm" value={Math.round(selectedLayer.y)} onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Rộng (%)</label>
                                    <input type="number" className="w-full border p-1.5 rounded text-sm" value={Math.round(selectedLayer.width)} onChange={(e) => updateLayer(selectedLayer.id, { width: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Cao (%)</label>
                                    <input type="number" className="w-full border p-1.5 rounded text-sm" value={Math.round(selectedLayer.height)} onChange={(e) => updateLayer(selectedLayer.id, { height: Number(e.target.value) })} />
                                </div>
                            </div>

                            {selectedLayer.type === 'text' && (
                                <div className="space-y-3 pt-3 border-t">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Nội dung</label>
                                        <textarea className="w-full border p-1.5 rounded text-sm" rows={2} value={selectedLayer.text} onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Font chữ</label>
                                        <select className="w-full border p-1.5 rounded text-sm" value={selectedLayer.fontFamily} onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}>
                                            <option value="Montserrat">Montserrat</option>
                                            <option value="Playfair Display">Playfair Display</option>
                                            <option value="Dancing Script">Dancing Script</option>
                                            {fonts.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Cỡ chữ (px)</label>
                                            <input type="number" className="w-full border p-1.5 rounded text-sm" value={selectedLayer.fontSize} onChange={(e) => updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Màu sắc</label>
                                            <input type="color" className="w-full h-8 border p-0 rounded" value={selectedLayer.fill} onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Căn lề</label>
                                        <div className="flex border rounded overflow-hidden">
                                            {['left', 'center', 'right'].map(align => (
                                                <button 
                                                    key={align} 
                                                    className={`flex-1 py-1 text-xs ${selectedLayer.textAlign === align ? 'bg-gray-200 font-bold' : 'hover:bg-gray-50'}`}
                                                    onClick={() => updateLayer(selectedLayer.id, { textAlign: align as any })}
                                                >
                                                    {align.charAt(0).toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedLayer.type === 'shape' || selectedLayer.type === 'text') && (
                                <div>
                                    <label className="block text-xs font-bold mb-1">Màu {selectedLayer.type === 'text' ? 'Chữ' : 'Nền'}</label>
                                    <div className="flex gap-2">
                                        <input type="color" className="w-8 h-8 rounded border cursor-pointer" value={selectedLayer.fill} onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })} />
                                        <input className="flex-grow border p-1.5 rounded text-sm uppercase" value={selectedLayer.fill} onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {selectedLayer.type === 'image' && (
                                <div className="pt-3 border-t">
                                    <label className="block text-xs font-bold mb-1">Thay đổi ảnh</label>
                                    <input type="file" accept="image/*" className="w-full text-xs" onChange={handleUploadImage} />
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-2">
                                <h5 className="font-bold text-xs text-blue-600 mb-2">Quyền Khách hàng (User Rules)</h5>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedLayer.allowUserEdit} onChange={(e) => updateLayer(selectedLayer.id, { allowUserEdit: e.target.checked })} className="rounded" />
                                    <span className="text-sm">Cho phép khách sửa nội dung</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedLayer.locked} onChange={(e) => updateLayer(selectedLayer.id, { locked: e.target.checked })} className="rounded" />
                                    <span className="text-sm">Khóa vị trí (Admin only)</span>
                                </label>
                            </div>

                            <button onClick={() => deleteLayer(selectedLayer.id)} className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded mt-4 text-sm font-bold hover:bg-red-100">
                                Xóa Layer này
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 text-sm italic mt-10">
                            Chọn một layer để chỉnh sửa hoặc thêm mới từ thanh công cụ bên trái.
                        </div>
                    )}
                    
                    <div className="mt-8 pt-4 border-t">
                        <label className="block text-xs font-bold mb-1">Kích thước khung (Tham chiếu)</label>
                        <select 
                            className="w-full border p-1.5 rounded text-sm bg-gray-50" 
                            value={currentTemplate.frameId}
                            onChange={(e) => setCurrentTemplate({...currentTemplate, frameId: e.target.value})}
                        >
                            {frames.map(f => (
                                <option key={f.id} value={f.id}>{f.name} ({f.frameWidthCm}x{f.frameHeightCm})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">Thay đổi khung sẽ thay đổi tỷ lệ canvas.</p>
                        
                        <label className="block text-xs font-bold mt-3 mb-1">Danh mục</label>
                        <input className="w-full border p-1.5 rounded text-sm" value={currentTemplate.category} onChange={(e) => setCurrentTemplate({...currentTemplate, category: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>
    );
};
