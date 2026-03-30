import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const useStorage = () => {
  const generateUploadUrl = useMutation(api.backend.storage.generateUploadUrl);
  const deleteFile = useMutation(api.backend.storage.deleteFile);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const uploadUrl = await generateUploadUrl({ contentType: file.type });
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file");
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be less than 5MB");
    }

    return uploadFile(file);
  };

  const uploadVideo = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("video/")) {
      throw new Error("Please select a video file");
    }
    
    if (file.size > 100 * 1024 * 1024) {
      throw new Error("Video must be less than 100MB");
    }

    return uploadFile(file);
  };

  const removeFile = async (storageId: string): Promise<boolean> => {
    try {
      await deleteFile({ storageId });
      return true;
    } catch {
      return false;
    }
  };

  return {
    uploadFile,
    uploadImage,
    uploadVideo,
    removeFile,
  };
};

export const useFileUrl = (storageId: string | undefined | null) => {
  if (!storageId) return null;
  if (storageId.startsWith("http://") || storageId.startsWith("https://")) {
    return storageId;
  }
  return useQuery(api.backend.storage.getFileUrl, storageId ? { storageId } : "skip");
};
