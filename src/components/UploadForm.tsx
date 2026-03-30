"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Video, Upload, X, Hash, MapPin, Globe, Lock, AlertCircle, Check, Image, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUser, useCreateContent } from "@/hooks/api";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const CONTENT_REQUIREMENTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DURATION_SECONDS: 30,
  MAX_DURATION_SECONDS: 600,
  ALLOWED_CONTENT_TYPES: ["audio", "video"] as const,
  ALLOWED_GENRES: ["Hip Hop", "R&B", "Trap", "Pop", "Rock", "Indie", "Jazz", "Soul", "Electronic", "Country", "Folk", "Metal", "Other"],
  ALLOWED_REGIONS: ["Dauphin County", "Lancaster County", "York County", "Cumberland County", "Lebanon County", "Adams County", "Franklin County", "Other"],
};

const GENRES = CONTENT_REQUIREMENTS.ALLOWED_GENRES;
const REGIONS = CONTENT_REQUIREMENTS.ALLOWED_REGIONS;

export default function UploadForm() {
  const navigate = useNavigate();
  const { user, uploadStatus } = useUser();
  const createContent = useCreateContent();
  const generateUploadUrl = useMutation(api.backend.storage.generateUploadUrl);
  
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"audio" | "video">("audio");
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [region, setRegion] = useState("");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState<number | undefined>();
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const canUpload = uploadStatus?.canUpload ?? false;
  const uploadsUsed = uploadStatus?.activeContentCount ?? 0;
  const maxUploads = uploadStatus?.maxContentAllowed ?? 10;
  const isAdmin = uploadStatus?.isAdmin ?? false;

  const uploadMediaFile = async (fileToUpload: File): Promise<string | null> => {
    setIsUploadingMedia(true);
    try {
      const uploadUrl = await generateUploadUrl({ contentType: fileToUpload.type });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const { storageId } = await response.json();
      return storageId;
    } catch (err: any) {
      toast.error(err.message || "Failed to upload media file");
      return null;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (contentType === "audio") {
        const audioUrl = URL.createObjectURL(selectedFile);
        const audio = new Audio(audioUrl);
        audio.addEventListener("loadedmetadata", () => {
          setDuration(Math.floor(audio.duration));
        });
      }
      
      const storageId = await uploadMediaFile(selectedFile);
      if (storageId) {
        setMediaUrl(storageId);
      } else {
        setFile(null);
        toast.error("Failed to upload media file");
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setCoverFile(selectedFile);
      setCoverPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverFile) return null;
    
    setIsUploadingCover(true);
    try {
      const uploadUrl = await generateUploadUrl({ contentType: coverFile.type });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": coverFile.type },
        body: coverFile,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const { storageId } = await response.json();
      return storageId;
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover image");
      return null;
    } finally {
      setIsUploadingCover(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!title || title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH) {
      errors.push(`Title must be at least ${CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH} characters`);
    }
    if (title.length > CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH) {
      errors.push(`Title must be less than ${CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH} characters`);
    }
    if (!artistName || artistName.trim().length === 0) {
      errors.push("Artist name is required");
    }
    if (!description || description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH) {
      errors.push(`Description must be at least ${CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters`);
    }
    if (!genre) {
      errors.push("Genre is required");
    }
    if (!region) {
      errors.push("Region is required");
    }
    if (duration && (duration < CONTENT_REQUIREMENTS.MIN_DURATION_SECONDS || duration > CONTENT_REQUIREMENTS.MAX_DURATION_SECONDS)) {
      errors.push(`Duration must be between ${CONTENT_REQUIREMENTS.MIN_DURATION_SECONDS} and ${CONTENT_REQUIREMENTS.MAX_DURATION_SECONDS} seconds`);
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to upload content");
      navigate("/signup");
      return;
    }

    if (!canUpload) {
      toast.error(uploadStatus?.maxContentAllowed 
        ? `Upload limit reached (${uploadsUsed}/${maxUploads}). Delete content or upgrade your subscription.`
        : "Cannot upload content at this time");
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsUploading(true);
    try {
      const tagArray = tags
        .split(",")
        .map(t => t.trim().toLowerCase().replace(/^#/, ""))
        .filter(t => t.length > 0)
        .slice(0, 10);

      let finalThumbnailUrl = thumbnailUrl;
      if (coverFile && !thumbnailUrl) {
        finalThumbnailUrl = await uploadCoverImage() || "";
      }

      await createContent({
        ownerId: user._id,
        title,
        artistName,
        description,
        genre,
        region,
        contentType,
        mediaUrl,
        tags: tagArray,
        duration,
        thumbnailUrl: finalThumbnailUrl || undefined,
      });

      toast.success("Content uploaded successfully!", {
        description: "Your content is pending review and will appear in the feed once approved.",
      });

      navigate("/profile/" + user._id);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload content");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
        <CardContent className="p-8 text-center">
          <Music className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Sign in Required</h3>
          <p className="text-zinc-400 mb-6">Please sign in or create an account to upload content.</p>
          <Button onClick={() => navigate("/signup")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            Sign Up
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {!file ? (
            <div className="space-y-6">
              {/* Cover Art Upload */}
              <div className="space-y-3">
                <Label className="text-zinc-300">Cover Art (optional)</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-24 h-24 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden relative cursor-pointer group"
                    onClick={() => document.getElementById("cover-input")?.click()}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    {isUploadingCover && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400 mb-2">Upload a cover image to make your content stand out</p>
                    <label 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer text-sm text-zinc-300 border border-zinc-700"
                    >
                      <Upload className="w-4 h-4" />
                      {coverFile ? "Change" : "Choose File"}
                      <input
                        id="cover-input"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                    {coverFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverFile(null);
                          setCoverPreview(null);
                          setThumbnailUrl("");
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-1 bg-zinc-800/50 rounded-2xl w-fit">
                <Button
                  type="button"
                  variant={contentType === "audio" ? "default" : "ghost"}
                  onClick={() => setContentType("audio")}
                  className={`rounded-xl px-6 ${contentType === "audio" ? "bg-amber-500 hover:bg-amber-400 text-black" : ""}`}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Audio
                </Button>
                <Button
                  type="button"
                  variant={contentType === "video" ? "default" : "ghost"}
                  onClick={() => setContentType("video")}
                  className={`rounded-xl px-6 ${contentType === "video" ? "bg-amber-500 hover:bg-amber-400 text-black" : ""}`}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-3xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full group-hover:scale-110 transition-transform mb-4">
                    <Upload className="w-10 h-10" />
                  </div>
                  <p className="mb-2 text-lg font-bold text-white">Click or drag to upload</p>
                  <p className="text-sm text-zinc-400">
                    MP3, WAV, MP4 up to 100MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept={contentType === "audio" ? "audio/*" : "video/*"}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  {contentType === "audio" ? (
                    <Music className="w-6 h-6 text-amber-500" />
                  ) : (
                    <Video className="w-6 h-6 text-amber-500" />
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-zinc-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                      {duration && ` • ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setMediaUrl("");
                    setDuration(undefined);
                  }}
                  className="rounded-full hover:bg-zinc-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-bold text-white">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Track title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl focus-visible:ring-amber-500"
                    maxLength={CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH ? "text-red-500" : "text-zinc-500"}>
                      {title.length}/{CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH}
                      {title.length < CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH && ` (min ${CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH})`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artistName" className="font-bold text-white">
                    Artist Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="artistName"
                    placeholder="Your artist name..."
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl focus-visible:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-bold text-white">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Tell the community about your track..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] bg-zinc-800/50 border-zinc-700 text-white rounded-xl resize-none focus-visible:ring-amber-500"
                    maxLength={CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH ? "text-red-500" : "text-zinc-500"}>
                      {description.length}/{CONTENT_REQUIREMENTS.MAX_DESCRIPTION_LENGTH}
                      {description.length < CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH && ` (min ${CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH})`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-white">
                      Genre <span className="text-red-500">*</span>
                    </Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g} className="text-white">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-white">
                      Region <span className="text-red-500">*</span>
                    </Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r} className="text-white">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="font-bold text-white">
                    Tags (optional)
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <Input
                      id="tags"
                      placeholder="hiphop, harrisburg, vocals..."
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="pl-9 bg-zinc-800/50 border-zinc-700 text-white rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Separate tags with commas (max 10)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-white mb-1">Upload Guidelines</p>
              <ul className="text-zinc-400 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Title: {CONTENT_REQUIREMENTS.MIN_TITLE_LENGTH}-{CONTENT_REQUIREMENTS.MAX_TITLE_LENGTH} characters
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Description: At least {CONTENT_REQUIREMENTS.MIN_DESCRIPTION_LENGTH} characters
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Genre and region are required
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Content will be reviewed before appearing in the feed
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-zinc-400">Uploads used: </span>
          <span className={canUpload ? "text-white font-bold" : "text-red-500 font-bold"}>
            {uploadsUsed}{isAdmin ? "/Unlimited" : `/${maxUploads}`}
          </span>
          {!canUpload && !isAdmin && (
            <span className="text-zinc-500 ml-2">(Upgrade to upload more)</span>
          )}
        </div>
        <Button
          type="submit"
          disabled={!file || !title || !artistName || !description || !genre || !region || isUploading || !canUpload || isUploadingMedia || isUploadingCover}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl px-8"
        >
          {isUploading || isUploadingMedia || isUploadingCover ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Uploading...
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {isUploadingMedia ? "Uploading Media..." : isUploadingCover ? "Uploading Cover..." : "Upload & Submit for Review"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
