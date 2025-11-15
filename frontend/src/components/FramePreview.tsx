import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { FrameConfig, LegoPart, TextConfig, AllProducts, FrameOption } from '../types';

type Transform = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width?: number;
}

interface FramePreviewProps {
  config: FrameConfig;
  allProducts: AllProducts | null;
  containerWidth?: number;
  onItemTransform: (id: string, newTransform: Transform) => void;
  onTextUpdate: (id: number, updates: Partial<TextConfig>) => void;
  className?: string;
  isInteractive?: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const LegoCharacter: React.FC<{ character: FrameConfig['characters'][0]; scale: number }> = ({ character, scale }) => {
  // ===================================================================================
  // =================== KÍCH THƯỚC TỔNG THỂ CỦA NHÂN VẬT (cm) =======================
  // ===================================================================================
  // Thay đổi các giá trị dưới đây để chỉnh chiều rộng và chiều cao tổng thể của nhân vật LEGO.
  // Đơn vị được tính bằng cm và sẽ được nhân với tỷ lệ `scale` để hiển thị chính xác.
  // ===================================================================================
  const charWidth = 2.5 * scale; // Chiều rộng tổng thể (cm)
  const charHeight = 5.0 * scale; // Chiều cao tổng thể (cm)

  const hair = character.hair;
  const hat = character.hat;
  const face = character.face;
  const shirt = character.shirt;
  const pants = character.pants;
  
  const shirtImageUrl = character.selectedShirtColor?.imageUrl || shirt?.imageUrl;
  const pantsImageUrl = character.selectedPantsColor?.imageUrl || pants?.imageUrl;

  const partStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
  };

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

const EditableText: React.FC<{
    text: TextConfig;
    scale: number;
    onUpdate: (updates: Partial<TextConfig>) => void;
    onBeginEditing: () => void;
    onEndEditing: () => void;
}> = ({ text, scale, onUpdate, onBeginEditing, onEndEditing }) => {
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setEditedContent(text.content);
            handleBlur();
        }
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditedContent(text.content);
        onBeginEditing();
    }

    const containerStyle: React.CSSProperties = {
        width: text.width ? `${text.width}px` : 'auto',
        minWidth: '50px',
        wordWrap: 'break-word',
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

    return (
        <div style={containerStyle} onDoubleClick={handleDoubleClick}>
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        ...textStyle,
                        width: '100%',
                        height: 'auto',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 0 0 2px #efa3b5',
                        margin: 0,
                        cursor: 'text',
                    }}
                />
            ) : (
                <p style={textStyle}>
                    {text.content}
                </p>
            )}
        </div>
    );
};

// REWRITTEN TRANSFORMABLE COMPONENT
const Transformable: React.FC<{
    children: React.ReactNode;
    id: string;
    initialTransform: Transform;
    onTransform: (id: string, transform: Transform) => void;
    parentRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    allowScaling?: boolean;
    allowWidthResize?: boolean;
    allowRotation?: boolean;
    allowDrag?: boolean;
}> = ({
    children, id, initialTransform, onTransform, parentRef, isSelected, onSelect,
    allowScaling = false, allowWidthResize = false, allowRotation = true, allowDrag = true
}) => {
    
    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!allowDrag) return;
        e.preventDefault(); e.stopPropagation(); onSelect(id);
        const parentRect = parentRef.current?.getBoundingClientRect(); if (!parentRect) return;
        const startX = e.clientX; const startY = e.clientY;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY;
            const newX = ((initialTransform.x / 100) * parentRect.width + dx) / parentRect.width * 100;
            const newY = ((initialTransform.y / 100) * parentRect.height + dy) / parentRect.height * 100;
            onTransform(id, { ...initialTransform, x: newX, y: newY });
        };
        const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };

    const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        const parentRect = parentRef.current?.getBoundingClientRect(); if (!parentRect) return;
        const centerX = parentRect.left + (initialTransform.x / 100) * parentRect.width;
        const centerY = parentRect.top + (initialTransform.y / 100) * parentRect.height;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        const startRotation = initialTransform.rotation;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
            const deltaAngle = currentAngle - startAngle;
            onTransform(id, { ...initialTransform, rotation: startRotation + deltaAngle });
        };
        const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };

    const handleScale = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX; const startScale = initialTransform.scale;
        const handleMouseMove = (moveEvent: MouseEvent) => {
             const dx = moveEvent.clientX - startX;
             const scaleChange = dx / 100;
             onTransform(id, { ...initialTransform, scale: Math.max(0.2, startScale + scaleChange) });
        };
        const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleWidthResize = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right') => {
        e.preventDefault(); e.stopPropagation();
        const parentRect = parentRef.current?.getBoundingClientRect(); if (!parentRect) return;
        const startX = e.clientX;
        const { x: initialXPercent, scale, width: initialWidth = 200 } = initialTransform;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dxScreen = moveEvent.clientX - startX;
            const dxElement = dxScreen / scale; // Mouse delta in element's scaled coordinate system
            let newWidth; let centerShiftElement;
            if (side === 'right') {
                newWidth = initialWidth + dxElement;
                centerShiftElement = dxElement / 2;
            } else { // side === 'left'
                newWidth = initialWidth - dxElement;
                centerShiftElement = dxElement / 2;
            }
            if (newWidth < 30) return; // Prevent inverting
            const centerShiftScreen = centerShiftElement * scale;
            const xShiftPercent = (centerShiftScreen / parentRect.width) * 100;
            const newXPercent = initialXPercent + xShiftPercent;
            onTransform(id, { ...initialTransform, width: newWidth, x: newXPercent });
        };
        const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div 
            onMouseDown={handleDrag} 
            className="absolute" 
            style={{ 
                left: `${initialTransform.x}%`, top: `${initialTransform.y}%`, 
                transform: `translate(-50%, -50%) rotate(${initialTransform.rotation}deg) scale(${initialTransform.scale})`, 
                touchAction: 'none', cursor: allowDrag ? (isSelected ? 'move' : 'pointer') : 'default', 
                outline: isSelected ? '2px dashed #efa3b5' : 'none', outlineOffset: '8px'
            }}
        >
            {children}
            {isSelected && (
              <>
                {allowRotation && <div onMouseDown={handleRotate} className="transform-handle absolute -top-6 left-1/2 -translate-x-1/2 cursor-alias bg-luvin-pink text-white rounded-full h-4 w-4" title="Rotate"></div>}
                {allowScaling && <div onMouseDown={handleScale} className="transform-handle absolute -bottom-2 -right-2 cursor-nwse-resize bg-luvin-pink w-3 h-3 rounded-full border-2 border-white" title="Scale"></div>}
                {allowWidthResize && (
                  <>
                    <div onMouseDown={(e) => handleWidthResize(e, 'left')} className="transform-handle absolute top-1/2 -left-2.5 -translate-y-1/2 w-3 h-3 bg-luvin-pink rounded-full cursor-ew-resize border-2 border-white" title="Resize Width" />
                    <div onMouseDown={(e) => handleWidthResize(e, 'right')} className="transform-handle absolute top-1/2 -right-2.5 -translate-y-1/2 w-3 h-3 bg-luvin-pink rounded-full cursor-ew-resize border-2 border-white" title="Resize Width" />
                  </>
                )}
              </>
            )}
        </div>
    );
};


const FramePreview = React.forwardRef<HTMLDivElement, FramePreviewProps>(({ config, allProducts, containerWidth = 400, onItemTransform, onTextUpdate, className, isInteractive = true, selectedItemId, setSelectedItemId }, ref) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isCurrentlyEditingText, setIsCurrentlyEditingText] = useState(false);

  const frameOptions = allProducts?.frames || [];
  const frameOption = frameOptions.find(f => f.id === config.frameId) || frameOptions[0];

  const maxDimensionCm = useMemo(() => 
    Math.max(1, ...frameOptions.map(f => Math.max(f.frameWidthCm, f.frameHeightCm)))
  , [frameOptions]);

  if (!frameOption) {
    return <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading Frame...</div>;
  }
  
  const pxPerCm = containerWidth / maxDimensionCm;
  const frameWidth = frameOption.frameWidthCm * pxPerCm;
  const frameHeight = frameOption.frameHeightCm * pxPerCm;
  const backgroundWidth = frameOption.backgroundWidthCm * pxPerCm;
  const backgroundHeight = frameOption.backgroundHeightCm * pxPerCm;

  const backgroundStyle: React.CSSProperties =
    config.background.type === 'color'
      ? { backgroundColor: config.background.value }
      : { backgroundImage: `url(${config.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  
  const allParts = useMemo(() => {
    if (!allProducts) return {};
    return Object.values(allProducts.lego_parts).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {});
  }, [allProducts]);

  return (
    <div ref={ref} className={`flex items-center justify-center ${className}`} style={{ width: frameWidth, height: frameHeight }}>
        <div className="relative bg-white" style={{ width: '100%', height: '100%', boxShadow: `0 4px 12px #d8d8d8` }}>
            <div ref={previewContainerRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden" style={{ width: backgroundWidth, height: backgroundHeight, ...backgroundStyle, boxShadow: `inset 0 0 0 1px rgba(0, 0, 0, 0.15)` }} onClick={(e) => { if (isInteractive && e.target === previewContainerRef.current) { setSelectedItemId(null); } }}>
                {config.characters.map(char => (
                    <Transformable key={`character-${char.id}`} id={`character-${char.id}`} initialTransform={char} onTransform={onItemTransform} parentRef={previewContainerRef} isSelected={selectedItemId === `character-${char.id}`} onSelect={setSelectedItemId} allowDrag={isInteractive}>
                       <LegoCharacter character={char} scale={pxPerCm} />
                    </Transformable>
                ))}
                {config.draggableItems.map(item => {
                    const isCharm = item.type === 'charm';
                    const part = !isCharm ? allParts[item.partId] : null;
                    const imageUrl = isCharm ? item.partId : part?.imageUrl;
                    const name = isCharm ? 'charm' : part?.name;
                    const widthCm = isCharm ? 2 : (part?.widthCm || 1);
                    const heightCm = isCharm ? 2 : (part?.heightCm || 1);
                    if (!imageUrl) return null;
                    return (
                        <Transformable key={`item-${item.id}`} id={`item-${item.id}`} initialTransform={item} onTransform={onItemTransform} parentRef={previewContainerRef} isSelected={selectedItemId === `item-${item.id}`} onSelect={setSelectedItemId} allowScaling={true} allowRotation={isInteractive} allowDrag={isInteractive}>
                            <img src={imageUrl} alt={name} className="pointer-events-none" style={{ width: widthCm * pxPerCm, height: heightCm * pxPerCm, objectFit: 'contain' }} />
                        </Transformable>
                    );
                })}
                {config.texts.map(text => {
                    const id = `text-${text.id}`;
                    const transformProps = { x: text.x, y: text.y, rotation: text.rotation, scale: text.scale, width: text.width || 200 };
                    return (
                        <Transformable 
                            key={id} id={id} 
                            initialTransform={transformProps} 
                            onTransform={onItemTransform} 
                            parentRef={previewContainerRef} 
                            isSelected={selectedItemId === id} 
                            onSelect={setSelectedItemId}
                            allowDrag={isInteractive && !isCurrentlyEditingText}
                            allowWidthResize={true}
                            allowRotation={true}
                        >
                           <EditableText text={text} scale={pxPerCm} onUpdate={(updates) => onTextUpdate(text.id, updates)} onBeginEditing={() => setIsCurrentlyEditingText(true)} onEndEditing={() => setIsCurrentlyEditingText(false)} />
                        </Transformable>
                    );
                })}
            </div>
        </div>
    </div>
  );
});

export default FramePreview;