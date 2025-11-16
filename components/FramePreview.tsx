// FIX: import useMemo from React
import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { FrameConfig, LegoPart, TextConfig } from '../types.ts';
import { FRAME_OPTIONS, LEGO_PARTS } from '../constants.tsx';

type Transform = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface FramePreviewProps {
  config: FrameConfig;
  containerWidth?: number;
  onItemTransform: (id: string, newTransform: Transform) => void;
  onTextUpdate: (id: number, updates: Partial<TextConfig>) => void;
  className?: string;
  isInteractive?: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

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
      {/* Layering order: Chân (pants) -> Áo (shirt) -> Đầu (face) -> Tóc (hair) -> Phụ kiện (hat) */}
      {pants && pantsImageUrl &&
        <img 
          src={pantsImageUrl}
          alt="pants" 
          style={partStyle} 
        />}
      {shirt && shirtImageUrl &&
        <img 
          src={shirtImageUrl}
          alt="shirt" 
          style={partStyle}
        />}
      {face && 
        <img 
          src={face.imageUrl} 
          alt="face" 
          style={partStyle}
        />}
      {!hat && hair && 
        <img 
          src={hair.imageUrl} 
          alt="hair" 
          style={partStyle}
        />}
      {hat && 
        <img 
          src={hat.imageUrl} 
          alt="hat" 
          style={partStyle}
        />}
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
    scale: number; // This is now pxPerCm
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
            setEditedContent(text.content); // Revert changes
            handleBlur();
        }
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditedContent(text.content);
        onBeginEditing();
    }

    const textStyle: React.CSSProperties = {
        fontFamily: getFontFamily(text.font),
        fontSize: `${text.size * (scale / 20)}px`, // Kept division for sensible default sizes
        color: text.color,
        whiteSpace: 'pre-wrap',
        textAlign: text.textAlign || 'center',
        padding: '10px',
        textShadow: '0 0 5px white, 0 0 5px white',
        ...(text.background && { backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', borderRadius: '5px' })
    };

    if (isEditing) {
        return (
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
                    minWidth: '150px',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 0 0 2px #efa3b5',
                    margin: 0,
                    cursor: 'text',
                }}
            />
        );
    }

    return (
        <div style={{minWidth: '50px'}} onDoubleClick={handleDoubleClick}>
            <p style={textStyle} >
                {text.content}
            </p>
        </div>
    );
};


const Transformable: React.FC<{
    children: React.ReactNode;
    id: string;
    initialTransform: Transform;
    onTransform: (id: string, transform: Transform) => void;
    parentRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    isResizable?: boolean;
    isRotatable?: boolean;
    isDraggable?: boolean;
}> = ({ children, id, initialTransform, onTransform, parentRef, isSelected, onSelect, isResizable = true, isRotatable = true, isDraggable = true }) => {
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(id);

        const parentRect = parentRef.current?.getBoundingClientRect();
        if (!parentRect) return;

        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            const newX = ((initialTransform.x / 100) * parentRect.width + dx) / parentRect.width * 100;
            const newY = ((initialTransform.y / 100) * parentRect.height + dy) / parentRect.height * 100;

            onTransform(id, {
                ...initialTransform,
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY)),
            });
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const parentRect = parentRef.current?.getBoundingClientRect();
        if (!parentRect) return;

        const centerX = parentRect.left + (initialTransform.x / 100) * parentRect.width;
        const centerY = parentRect.top + (initialTransform.y / 100) * parentRect.height;
        
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        const startRotation = initialTransform.rotation;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
            const deltaAngle = currentAngle - startAngle;
            onTransform(id, { ...initialTransform, rotation: startRotation + deltaAngle });
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

     const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const parentRect = parentRef.current?.getBoundingClientRect();
        if (!parentRect) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startScale = initialTransform.scale;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
             const dx = moveEvent.clientX - startX;
             const scaleChange = dx / 100; // Adjust sensitivity
             onTransform(id, { ...initialTransform, scale: Math.max(0.2, startScale + scaleChange) });
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            className="absolute"
            style={{
                left: `${initialTransform.x}%`,
                top: `${initialTransform.y}%`,
                transform: `translate(-50%, -50%) rotate(${initialTransform.rotation}deg) scale(${initialTransform.scale})`,
                touchAction: 'none',
                cursor: isDraggable ? (isSelected ? 'move' : 'pointer') : 'default',
                outline: isSelected && isDraggable ? '2px dashed #efa3b5' : 'none',
                outlineOffset: '5px'
            }}
        >
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


const FramePreview = React.forwardRef<HTMLDivElement, FramePreviewProps>(({ config, containerWidth = 400, onItemTransform, onTextUpdate, className, isInteractive = true, selectedItemId, setSelectedItemId }, ref) => {
  const frameOption = FRAME_OPTIONS.find(f => f.id === config.frameId) || FRAME_OPTIONS[0];
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isCurrentlyEditingText, setIsCurrentlyEditingText] = useState(false);

  // --- START OF FIX: Proportional Scaling Logic ---
  // 1. Find the largest dimension (width or height) across all available frames.
  const maxDimensionCm = useMemo(() => 
    Math.max(...FRAME_OPTIONS.map(f => Math.max(f.frameWidthCm, f.frameHeightCm)))
  , []);

  // 2. Create a consistent scaling factor (pixels per cm) based on the container width and the max dimension.
  const pxPerCm = containerWidth / maxDimensionCm;

  // 3. Calculate the total dimensions of the current frame in pixels.
  const frameWidth = frameOption.frameWidthCm * pxPerCm;
  const frameHeight = frameOption.frameHeightCm * pxPerCm;

  // 4. Calculate the background dimensions in pixels.
  const backgroundWidth = frameOption.backgroundWidthCm * pxPerCm;
  const backgroundHeight = frameOption.backgroundHeightCm * pxPerCm;
  // --- END OF FIX ---

  const backgroundStyle: React.CSSProperties =
    config.background.type === 'color'
      ? { backgroundColor: config.background.value }
      : { backgroundImage: `url(${config.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  
  const allParts: Record<string, LegoPart> = {
      ...Object.values(LEGO_PARTS).flat().reduce((acc, part) => ({ ...acc, [part.id]: part }), {})
  };

  return (
    // This outer div now correctly scales the entire component proportionally.
    <div ref={ref} className={`flex items-center justify-center ${className}`} style={{ width: frameWidth, height: frameHeight }}>
        {/* This div represents the white frame itself. */}
        <div 
          className="relative bg-white"
          style={{
            width: '100%',
            height: '100%',
            boxShadow: `0 4px 12px #d8d8d8`,
          }}
        >
            {/* This inner div is the background area where items are placed. */}
            <div
                ref={previewContainerRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                style={{
                    width: backgroundWidth,
                    height: backgroundHeight,
                    ...backgroundStyle,
                    boxShadow: `inset 0 0 0 1px rgba(0, 0, 0, 0.15)`,
                }}
                onClick={(e) => {
                    if (isInteractive && e.target === previewContainerRef.current) {
                        setSelectedItemId(null);
                    }
                }}
            >
                {/* FIX: Reordered elements for correct visual stacking (z-index). */}
                {/* 1. Characters render first (at the bottom). */}
                {config.characters.map(char => {
                    const id = `character-${char.id}`;
                    return (
                        <Transformable 
                            key={id} id={id} initialTransform={char} onTransform={onItemTransform} 
                            parentRef={previewContainerRef} isSelected={selectedItemId === id} onSelect={setSelectedItemId}
                            isResizable={false} isRotatable={false} isDraggable={isInteractive}
                        >
                           <LegoCharacter character={char} scale={pxPerCm} /> {/* Use the new consistent scale */}
                        </Transformable>
                    );
                })}

                {/* 2. Draggable items (accessories, pets) render on top of characters. */}
                {config.draggableItems.map(item => {
                    const isCharm = item.type === 'charm';
                    const part = !isCharm ? allParts[item.partId] : null;
                    const imageUrl = isCharm ? item.partId : part?.imageUrl;
                    const name = isCharm ? 'charm' : part?.name;
                    const widthCm = isCharm ? 2 : (part?.widthCm || 1);
                    const heightCm = isCharm ? 2 : (part?.heightCm || 1);

                    if (!imageUrl) return null;

                    const id = `item-${item.id}`;
                    return (
                        <Transformable 
                            key={id} id={id} initialTransform={item} onTransform={onItemTransform} 
                            parentRef={previewContainerRef} isSelected={selectedItemId === id} onSelect={setSelectedItemId}
                            isResizable={false} 
                            isRotatable={isInteractive} 
                            isDraggable={isInteractive}
                        >
                            <img 
                              src={imageUrl} 
                              alt={name} 
                              className="pointer-events-none"
                              style={{
                                  width: widthCm * pxPerCm, // Use the new consistent scale
                                  height: heightCm * pxPerCm, // Use the new consistent scale
                                  objectFit: 'contain'
                              }}
                            />
                        </Transformable>
                    );
                })}
                
                {/* 3. Text renders last (on top of everything). */}
                {config.texts.map(text => {
                    const id = `text-${text.id}`;
                    return (
                        <Transformable 
                            key={id} id={id} initialTransform={{x: text.x, y: text.y, rotation: text.rotation, scale: text.scale}} 
                            onTransform={onItemTransform} parentRef={previewContainerRef} 
                            isSelected={selectedItemId === id} onSelect={setSelectedItemId}
                            isDraggable={isInteractive && !isCurrentlyEditingText}
                        >
                           <EditableText
                             text={text}
                             scale={pxPerCm} // Use the new consistent scale
                             onUpdate={(updates) => onTextUpdate(text.id, updates)}
                             onBeginEditing={() => setIsCurrentlyEditingText(true)}
                             onEndEditing={() => setIsCurrentlyEditingText(false)}
                           />
                        </Transformable>
                    );
                })}
            </div>
        </div>
    </div>
  );
});

export default FramePreview;