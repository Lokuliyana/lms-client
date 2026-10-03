"use client";

import React, { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { useEditMode } from "@/context/EditModeContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/dev/dialog";
import { Button } from "@/components/dev/button";
import { Slider } from "@/components/dev/slider";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import API from "@/lib/axios";
import { Loader2, Upload, Image as ImageIcon, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditableImageProps extends Omit<ImageProps, "src"> {
  configKey: string;
  initialValue: string;
  aspectRatio?: number; // e.g., 16/9, 1, 4/3. If not provided, free crop or defaults to container?
  containerClass?: string;
}

const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function EditableImage({
  configKey,
  initialValue,
  aspectRatio = 16 / 9, // Default aspect ratio
  className,
  containerClass,
  alt,
  ...imageProps
}: EditableImageProps) {
  const { isEditMode } = useEditMode();
  const [src, setSrc] = useState(initialValue);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSrc(initialValue);
  }, [initialValue]);

  useEffect(() => {
    // Check if user is teacher
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === "teacher" || user.role === "admin" || user.role === "moderator") {
          setCanEdit(true);
        }
      }
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    if (isEditMode && canEdit) {
      e.preventDefault();
      e.stopPropagation(); // Prevent bubbling if inside a link
      setIsDialogOpen(true);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedFile(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!selectedFile || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      // 1. Get cropped image blob
      const croppedImageBlob = await getCroppedImg(
        selectedFile,
        croppedAreaPixels
      );

      if (!croppedImageBlob) {
        throw new Error("Failed to crop image");
      }

      // 2. Upload to internal customization upload API
      const formData = new FormData();
      formData.append("image", croppedImageBlob, "cropped.png");

      const res = await API.post("/customization/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newImageUrl = res.data.publicUrl || res.data.url;

      // 3. Save URL to content.json
      const saveResponse = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: configKey,
          value: newImageUrl,
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save content configuration");

      // 4. Update state
      setSrc(newImageUrl);
      setIsDialogOpen(false);
      setSelectedFile(null);
      setZoom(1);
      
      toast({
        title: "Image updated",
        description: "The image has been successfully updated.",
      });

    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description: "Failed to update image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setZoom(1);
  };

  // If not in edit mode or not allowed, just render the image
  if (!isEditMode || !canEdit) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        {...imageProps}
      />
    );
  }

  const wrapperClass = imageProps.fill 
    ? `absolute inset-0 w-full h-full group/edit cursor-pointer ${containerClass || ""}`
    : `relative group/edit cursor-pointer ${containerClass || ""}`;

  return (
    <>
      <div 
        className={wrapperClass} 
        onClick={handleImageClick}
      >
        <Image
          src={src}
          alt={alt}
          className={className}
          {...imageProps}
        />
        
        {/* Overlay on hover in edit mode */}
        <div className="absolute inset-0 z-50 bg-black/0 group-hover/edit:bg-black/20 transition-colors duration-200 flex items-center justify-center rounded-[inherit]">
          <div className="opacity-0 group-hover/edit:opacity-100 bg-white/90 p-2 rounded-full shadow-lg transform scale-90 group-hover/edit:scale-100 transition-all duration-200">
            <Pencil className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Image</DialogTitle>
            <DialogDescription>
              Upload and crop a new image to replace the current one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-indigo-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-900">Click to upload</p>
                  <p className="text-sm text-slate-500">SVG, PNG, JPG or GIF</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative h-[300px] w-full rounded-xl overflow-hidden bg-slate-900">
                  <Cropper
                    image={selectedFile}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedFile(null);
                      setZoom(1);
                    }}
                  >
                    Change File
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
