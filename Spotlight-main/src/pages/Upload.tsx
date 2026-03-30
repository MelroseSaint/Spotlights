"use client";

import { useState, useEffect } from "react";
import { Upload, X, Music, Video, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CONTENT_REQUIREMENTS } from "../../../convex/constants";
import { useUserUploadStatus } from "../../hooks/api/useUser";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [region, setRegion] = useState("");
  const [contentType, setContentType] = useState<"audio" | "video">("audio");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const uploadStatus = useUserUploadStatus(userId || "");
  const createContent = useMutation(api.backend.content.createContent);
  
  const canUpload = uploadStatus?.canUpload ?? true;
  const remaining = (uploadStatus?.maxContentAllowed ?? 10) - (uploadStatus?.activeContentCount ?? 0);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title || title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH) {
      newErrors.title = `Title must be at least ${CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH} characters`;
    }
    if (title.length > CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be less than ${CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH} characters`;
    }
    
    if (!artistName || artistName.trim().length === 0) {
      newErrors.artistName = "Artist name is required";
    }
    
    if (!description || description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters`;
    }
    if (description.length > CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be less than ${CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH} characters`;
    }
    
    if (!genre) {
      newErrors.genre = "Please select a genre";
    }
    
    if (!region) {
      newErrors.region = "Please select a Central PA region";
    }
    
    if (!mediaFile) {
      newErrors.media = "Please upload a media file";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!canUpload || !userId) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    setErrors({});
    
    try {
      setUploadProgress(50);
      
      const contentId = await createContent({
        ownerId: userId as any,
        title,
        artistName,
        description,
        genre,
        region,
        contentType,
        mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : "",
        thumbnailUrl: thumbnailFile ? URL.createObjectURL(thumbnailFile) : undefined,
        duration: undefined,
        tags,
      });
      
      setUploadProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setArtistName("");
        setDescription("");
        setGenre("");
        setRegion("");
        setMediaFile(null);
        setThumbnailFile(null);
        setTags([]);
      }, 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to upload content" });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-zinc-500">Please sign in to upload content</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tight mb-2">
          Upload Content
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-zinc-500">{remaining} of {uploadStatus?.maxContentAllowed ?? 10} uploads remaining</p>
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full">
            <Zap size={14} className="text-amber-500" />
            <span className="text-amber-500 font-bold text-sm">{uploadStatus?.tier || "Standard"} Tier</span>
          </div>
        </div>
      </div>
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">Content uploaded successfully!</p>
            <p className="text-sm text-green-400/80">Your content is pending moderation.</p>
          </div>
        </div>
      )}
      
      {!canUpload && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={24} />
          <div>
            <p className="font-bold">Upload limit reached</p>
            <p className="text-sm text-red-400/80">Delete content or upgrade your tier to upload more.</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.title ? "border-red-500" : "border-white/10"
                }`}
                maxLength={CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH}
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              <p className="text-zinc-600 text-xs mt-1">{title.length}/{CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH}</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Artist Name *</label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Your artist name"
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.artistName ? "border-red-500" : "border-white/10"
                }`}
              />
              {errors.artistName && <p className="text-red-400 text-sm mt-1">{errors.artistName}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              Description * ({CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH}+ characters)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind this track..."
              rows={4}
              className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                errors.description ? "border-red-500" : "border-white/10"
              }`}
              maxLength={CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            <p className="text-zinc-600 text-xs mt-1">{description.length}/{CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Content Type *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setContentType("audio")}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    contentType === "audio" ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/10 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Music size={18} />
                  Audio
                </button>
                <button
                  type="button"
                  onClick={() => setContentType("video")}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    contentType === "video" ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/10 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Video size={18} />
                  Video
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Genre *</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.genre ? "border-red-500" : "border-white/10"
                }`}
              >
                <option value="">Select genre</option>
                {CONTENT_REQUIREMENTS.ALLOWED_GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Region *</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.region ? "border-red-500" : "border-white/10"
                }`}
              >
                <option value="">Select Central PA region</option>
                {CONTENT_REQUIREMENTS.ALLOWED_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.region && <p className="text-red-400 text-sm mt-1">{errors.region}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              Media File * ({contentType === "audio" ? "MP3, WAV" : "MP4, MOV"})
            </label>
            <div
              onClick={() => document.getElementById("mediaInput")?.click()}
              className={`py-12 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                errors.media ? "border-red-500 bg-red-500/5" : mediaFile ? "border-green-500 bg-green-500/5" : "border-white/10 bg-zinc-800/50 hover:border-amber-500/50"
              }`}
            >
              {mediaFile ? (
                <>
                  <CheckCircle2 size={32} className="text-green-500" />
                  <span className="text-green-400 font-bold">{mediaFile.name}</span>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-zinc-500" />
                  <span className="text-zinc-400">Click to upload {contentType}</span>
                </>
              )}
            </div>
            <input
              id="mediaInput"
              type="file"
              accept={contentType === "audio" ? "audio/*" : "video/*"}
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {errors.media && <p className="text-red-400 text-sm mt-1">{errors.media}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Tags (Optional)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white hover:bg-zinc-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-1">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {errors.submit && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}
        
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-zinc-500 text-sm text-center">Uploading... {uploadProgress}%</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!canUpload || isUploading}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            canUpload && !isUploading ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Content"}
        </button>
      </form>
    </div>
  );
}
