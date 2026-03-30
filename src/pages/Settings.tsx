"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Trash2, Shield, Zap, Crown, User, Bell, CreditCard, AlertTriangle, Camera, Upload, X } from "lucide-react";
import { useUser, useFileUrl } from "@/hooks/api";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, isLoading, isAuthenticated } = useUser();
  const updateUserProfile = useMutation(api.backend.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.backend.storage.generateUploadUrl);
  
  const [activeSection, setActiveSection] = useState<"profile" | "account" | "notifications" | "subscription">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");
  const avatarImageUrl = useFileUrl(avatarUrl || user?.avatarUrl || null);
  const bannerImageUrl = useFileUrl(bannerUrl || user?.bannerUrl || null);

  if (!isAuthenticated && !isLoading) {
    navigate("/signup");
    return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      const uploadUrl = await generateUploadUrl({ contentType: file.type });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const { storageId } = await response.json();
      
      setAvatarUrl(storageId);
      await updateUserProfile({
        userId: user._id,
        avatarUrl: storageId,
      });
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    
    setIsUploadingBanner(true);
    try {
      const uploadUrl = await generateUploadUrl({ contentType: file.type });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const { storageId } = await response.json();
      
      setBannerUrl(storageId);
      await updateUserProfile({
        userId: user._id,
        bannerUrl: storageId,
      });
      toast.success("Banner updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    
    setIsSaving(true);
    try {
      await updateUserProfile({
        userId: user._id,
        name: name || undefined,
        username: username || undefined,
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        avatarUrl: avatarUrl || user.avatarUrl || undefined,
        bannerUrl: bannerUrl || user.bannerUrl || undefined,
      });
      toast.success("Profile updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logout();
      navigate("/");
      window.location.reload();
    }
  };

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case "elite": return <Crown className="w-4 h-4 text-yellow-500" />;
      case "growth": return <Zap className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/profile/${user?._id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Settings</h1>
            <p className="text-zinc-400 text-sm">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveSection("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === "profile" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={() => setActiveSection("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === "account" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Account</span>
            </button>
            <button
              onClick={() => setActiveSection("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === "notifications" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notifications</span>
            </button>
            <button
              onClick={() => setActiveSection("subscription")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === "subscription" ? "bg-amber-500/10 text-amber-500" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Subscription</span>
            </button>
            
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeSection === "profile" && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Edit Profile</CardTitle>
                  <CardDescription className="text-zinc-400">Update your public profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Images */}
                  <div className="space-y-4">
                    <Label className="text-white">Profile Images</Label>
                    
                    {/* Banner Upload */}
                    <div className="relative">
                      <div 
                        className="w-full h-32 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden relative group"
                        style={{
                          backgroundImage: bannerImageUrl ? `url(${bannerImageUrl})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      >
                        {!bannerUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-zinc-500 text-sm">No banner image</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            disabled={isUploadingBanner}
                            className="hidden"
                          />
                          {isUploadingBanner ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
                          ) : (
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                              <span className="text-white text-sm">Upload Banner (1200x400)</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div 
                          className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden"
                          style={{
                            backgroundImage: avatarImageUrl ? `url(${avatarImageUrl})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center"
                          }}
                        >
                          {!avatarImageUrl && (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-10 h-10 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                            className="hidden"
                          />
                          {isUploadingAvatar ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
                        </label>
                      </div>
                      <div>
                        <p className="text-zinc-300 font-medium">Profile Picture</p>
                        <p className="text-zinc-500 text-sm">Square image, min 200x200</p>
                        <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer text-sm text-zinc-300 border border-zinc-700">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                            className="hidden"
                          />
                          {isUploadingAvatar ? "Uploading..." : "Choose File"}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Display Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Username</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="@yourusername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Bio</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Harrisburg, PA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Website</Label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeSection === "account" && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Account Info</CardTitle>
                  <CardDescription className="text-zinc-400">Your account details and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{user?.name}</p>
                      <p className="text-zinc-500 text-sm">{user?.email}</p>
                    </div>
                    {user?.role === "root_admin" && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Root Admin
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {getTierIcon(user?.tier)}
                      <div>
                        <p className="text-white font-medium capitalize">{user?.tier || "standard"} Plan</p>
                        <p className="text-zinc-500 text-sm">
                          {user?.tier === "elite" ? "500 uploads" : user?.tier === "growth" ? "50 uploads" : "10 uploads"}
                        </p>
                      </div>
                    </div>
                    {user?.tier === "standard" && (
                      <Link to="/subscriptions">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div>
                      <p className="text-white font-medium">LightCredz Balance</p>
                      <p className="text-zinc-500 text-sm">Credits for promoting content</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-500 font-bold">{user?.lightCredzBalance ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Notifications</CardTitle>
                  <CardDescription className="text-zinc-400">Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-zinc-500 text-sm">Receive updates via email</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
                      Coming Soon
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-zinc-500 text-sm">Receive in-app notifications</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "subscription" && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Subscription</CardTitle>
                  <CardDescription className="text-zinc-400">Manage your subscription plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      {getTierIcon(user?.tier)}
                      <span className="text-amber-500 font-bold capitalize">{user?.tier || "standard"} Plan</span>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      {user?.tier === "elite" && "Full access to all features"}
                      {user?.tier === "growth" && "Enhanced visibility and analytics"}
                      {user?.tier === "standard" && "Free forever - upload up to 10 tracks"}
                    </p>
                  </div>
                  <Link to="/subscriptions">
                    <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold">
                      {user?.tier === "standard" ? "Upgrade Plan" : "Change Plan"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
