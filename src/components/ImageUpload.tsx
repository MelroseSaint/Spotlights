"use client";

import { useState, useRef } from "react";
import { Upload, X, Image, Camera, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  type?: "avatar" | "banner" | "cover";
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  type = "avatar",
  className 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const uploadUrl = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadUrl.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadUrl.json();
      onChange(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const dimensions = {
    avatar: { width: 128, height: 128, label: "Profile Picture" },
    banner: { width: 1200, height: 400, label: "Profile Banner" },
    cover: { width: 500, height: 500, label: "Cover Art" },
  };

  const { width, height, label } = dimensions[type];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-xs text-zinc-500">
          {type === "avatar" ? "1:1" : "16:9"} • Max 5MB
        </span>
      </div>

      {value ? (
        <div className="relative group">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800",
              type === "avatar" && "w-32 h-32",
              type === "banner" && "w-full h-32",
              type === "cover" && "w-40 h-40"
            )}
          >
            <img
              src={value}
              alt={label}
              className={cn(
                "object-cover w-full h-full",
                type === "avatar" && "rounded-full"
              )}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                className="bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                <FileImage className="w-4 h-4 mr-1" />
                Change
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="bg-red-600 hover:bg-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all cursor-pointer flex flex-col items-center justify-center gap-2",
            type === "avatar" && "w-32 h-32",
            type === "banner" && "w-full h-32",
            type === "cover" && "w-40 h-40",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
          ) : type === "avatar" ? (
            <>
              <Camera className="w-8 h-8 text-zinc-500" />
              <span className="text-xs text-zinc-500">Add Photo</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-zinc-500" />
              <span className="text-xs text-zinc-500">Upload {label}</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={type === "cover" ? "image/*,video/*" : "image/*"}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

interface MediaUploadProps {
  onUpload: (storageId: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function MediaUpload({ 
  onUpload, 
  accept = "image/*,video/*",
  maxSize = 100 * 1024 * 1024,
  className 
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setProgress(100);
      const { storageId } = await response.json();
      onUpload(storageId);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </>
        )}
      </Button>
    </div>
  );
}
