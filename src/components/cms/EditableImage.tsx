import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEditMode } from '@/contexts/EditModeContext';

interface EditableImageProps {
  contentKey: string;
  defaultSrc: string;
  alt?: string;
  aspectRatio?: number;
  className?: string;
}

export function EditableImage({ contentKey, defaultSrc, alt = '', aspectRatio = 16 / 9, className }: EditableImageProps) {
  const { isEditMode, updateContent } = useEditMode();
  const [src, setSrc] = useState(defaultSrc);
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      // In a real app, do canvas cropping here
      // For mock purposes, just take the raw image base64
      setSrc(imageSrc);
      updateContent(contentKey, imageSrc);
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isEditMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <>
      <div 
        className={`relative group cursor-pointer border-2 border-dashed border-transparent hover:border-blue-400 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
          Click to Edit Image
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {!imageSrc ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
              <input type="file" accept="image/*" onChange={handleFileChange} className="p-4" />
            </div>
          ) : (
            <div className="relative h-64 w-full">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            {imageSrc && <Button onClick={showCroppedImage}>Save Crop</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
