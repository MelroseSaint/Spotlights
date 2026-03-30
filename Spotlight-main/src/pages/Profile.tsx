"use client";

import { useState, useEffect } from "react";
import { 
  Music, 
  Users, 
  MapPin, 
  Link as LinkIcon, 
  Play, 
  Heart, 
  Share2, 
  Radio,
  Volume2,
  Camera,
  Edit3,
  Calendar,
  MessageCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Mock user data - TODO: Connect to Convex
const mockUser = {
  _id: "1",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  avatarUrl: "",
  bannerUrl: "",
  bio: "Music producer and artist from Central PA",
  location: "Harrisburg, PA",
  website: "johndoe.com",
  followers: 123,
  following: 456,
  postsCount: 78,
  createdAt: new Date()
};

const mockPosts = [
  { _id: "1", content: "New track dropping soon!", likes: 10, comments: 5, shares: 2, tags: ["hiphop", "newmusic"], imageUrl: "", createdAt: new Date() },
  { _id: "2", content: "Studio session vibes", likes: 20, comments: 8, shares: 3, tags: ["studio", "beats"], imageUrl: "", createdAt: new Date() },
];

const Profile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Get current user ID from auth (simplified - in real app use proper auth)
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setIsOwnProfile(storedUserId === mockUser._id);
    }
  }, []);

  const handleFollow = async () => {
    // TODO: Implement with Convex mutation
    setIsFollowing(true);
    toast.success("You are now following this artist");
  };

  const handleUnfollow = async () => {
    // TODO: Implement with Convex mutation
    setIsFollowing(false);
    toast.success("Unfollowed this artist");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="container mx-auto px-6 py-6">
        {/* Profile Header */}
        <div className="relative rounded-3xl overflow-hidden mb-12">
          <div className="h-64 bg-gradient-to-r from-amber-900/30 to-orange-900/30 relative">
            {mockUser.bannerUrl && (
              <img 
                src={mockUser.bannerUrl} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          </div>
          
          <div className="relative -mt-20 px-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-2xl">
                  {mockUser.avatarUrl ? (
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                      <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-16 h-16 text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-4xl font-black text-white mb-2">{mockUser.name}</h1>
                    {mockUser.username && (
                      <p className="text-zinc-400">@{mockUser.username}</p>
                    )}
                    <div className="flex items-center gap-2 text-zinc-400 mt-2">
                      {mockUser.location && (
                        <>
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>{mockUser.location}</span>
                        </>
                      )}
                    </div>
                    {mockUser.website && (
                      <div className="flex items-center gap-2 text-zinc-400 mt-1">
                        <LinkIcon className="w-4 h-4 text-amber-500" />
                        <a href={`https://${mockUser.website}`} className="text-amber-500 hover:underline">
                          {mockUser.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {isOwnProfile ? (
                      <Button variant="outline" className="rounded-full">
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={isFollowing ? handleUnfollow : handleFollow}
                          className={`rounded-full ${isFollowing ? "bg-zinc-800 hover:bg-zinc-700" : "bg-amber-500 text-black hover:bg-amber-400"}`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <Button variant="outline" className="rounded-full">
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {mockUser.bio && (
                  <p className="text-zinc-300 mb-6 max-w-2xl whitespace-pre-line">
                    {mockUser.bio}
                  </p>
                )}
                
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{mockUser.postsCount || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{mockUser.followers || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{mockUser.following || 0}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-widest">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Music className="text-amber-500 w-5 h-5" />
            <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">
              Latest Broadcasts
            </h2>
          </div>
          
          {mockPosts && mockPosts.length > 0 ? (
            <div className="space-y-6">
              {mockPosts.map((post) => (
                <Card key={post._id} className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={mockUser.avatarUrl || ""} alt={mockUser.name} />
                          <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{mockUser.name}</h3>
                          <span className="text-zinc-500 text-sm">•</span>
                          <span className="text-zinc-500 text-sm">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-white mb-3">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {post.imageUrl && (
                      <div className="relative rounded-xl overflow-hidden mb-4 bg-zinc-800 aspect-video">
                        <img 
                          src={post.imageUrl} 
                          alt="Post media" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm">{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm">{post.shares}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-amber-500">
                        Resonate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-900/50 border border-white/5 rounded-2xl">
              <CardContent className="p-12 text-center">
                <Music className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No broadcasts yet</h3>
                <p className="text-zinc-400 mb-6">
                  {isOwnProfile 
                    ? "Start sharing your music with the community!" 
                    : "This artist hasn't posted anything yet."}
                </p>
                {isOwnProfile && (
                  <Button className="rounded-xl">
                    Upload Your First Track
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;