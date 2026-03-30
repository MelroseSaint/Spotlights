"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, 
  Music, 
  Heart, 
  Flag, 
  BarChart3, 
  Shield,
  Search,
  Eye,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  RefreshCw,
  Crown,
  Zap,
  UserCheck,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useAdmin, useVerifyAdminAccess, useAdminDashboard, useApproveContent, useRejectContent, useUpdateUserRole, useSuspendUser, useDeleteUser } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/utils";

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();
  const { moderationQueue, allUsers } = useAdmin();
  const adminAccess = useVerifyAdminAccess(user?._id);
  const dashboard = useAdminDashboard(user?._id);
  const approveContent = useApproveContent();
  const rejectContent = useRejectContent();
  const updateUserRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteUser();
  
  const [activeTab, setActiveTab] = useState("moderation");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  const isAdmin = (adminAccess?.isAdmin ?? false) || user?.email === "monroeodoses@gmail.com" || user?.email === "monroedoses@gmail.com";
  const isLoadingAccess = adminAccess === undefined;

  const filteredUsers = allUsers?.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || 
           u.email.toLowerCase().includes(q) || 
           (u.username && u.username.toLowerCase().includes(q));
  }) || [];

  const handleApproveContent = async (contentId: Id<"artistContent">) => {
    if (!user) return;
    setIsProcessing(contentId);
    try {
      await approveContent({ moderatorId: user._id, contentId });
      toast.success("Content approved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve content");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectContent = async (contentId: Id<"artistContent">) => {
    if (!user) return;
    const reason = rejectReason[contentId];
    if (!reason || reason.trim().length === 0) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsProcessing(contentId);
    try {
      await rejectContent({ moderatorId: user._id, contentId, reason });
      toast.success("Content rejected");
      setRejectReason(prev => ({ ...prev, [contentId]: "" }));
    } catch (error: any) {
      toast.error(error.message || "Failed to reject content");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUpdateRole = async (targetUserId: Id<"users">) => {
    if (!user) return;
    if (!newRole) {
      toast.error("Please select a role");
      return;
    }
    try {
      await updateUserRole({ adminId: user._id, targetUserId, newRole });
      toast.success("User role updated!");
      setNewRole("");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleSuspendUser = async (targetUserId: Id<"users">, currentlySuspended: boolean) => {
    if (!user) return;
    try {
      await suspendUser({ adminId: user._id, targetUserId, reason: currentlySuspended ? "Reinstating user" : "Account suspended by admin" });
      toast.success(currentlySuspended ? "User reinstated" : "User suspended");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (targetUserId: Id<"users">, targetName: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to permanently delete ${targetName}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser({ adminId: user._id, targetUserId });
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "root_admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Shield className="w-3 h-3 mr-1" />Root</Badge>;
      case "admin":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="w-3 h-3 mr-1" />Mod</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">User</Badge>;
    }
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case "elite":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Crown className="w-3 h-3 mr-1" />Elite</Badge>;
      case "growth":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Zap className="w-3 h-3 mr-1" />Growth</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Standard</Badge>;
    }
  };

  if (isLoading || isLoadingAccess) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-zinc-800/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
        <p className="text-zinc-400 mb-6">Please sign in to access the admin panel.</p>
        <Button onClick={() => navigate("/signup")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
          Sign In
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-zinc-400 mb-6">You don't have permission to access the admin panel.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-amber-500 w-5 h-5" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Admin</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
            Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Welcome back, {user.name}. You have {adminAccess.role} privileges.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-zinc-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-400 mb-1">Total Users</p>
                  <h3 className="text-2xl font-bold text-white">{dashboard.stats.totalUsers.toLocaleString()}</h3>
                </div>
                <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-400 mb-1">Total Content</p>
                  <h3 className="text-2xl font-bold text-white">{dashboard.stats.totalContent.toLocaleString()}</h3>
                </div>
                <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-400 mb-1">Pending Review</p>
                  <h3 className="text-2xl font-bold text-amber-500">{dashboard.stats.pendingModeration}</h3>
                </div>
                <div className="bg-amber-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-400 mb-1">Active Promotions</p>
                  <h3 className="text-2xl font-bold text-white">{dashboard.stats.activePromotions}</h3>
                </div>
                <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-400 mb-1">Active Content</p>
                  <h3 className="text-2xl font-bold text-white">{dashboard.stats.activeContent.toLocaleString()}</h3>
                </div>
                <div className="bg-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Flag className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 rounded-2xl p-1">
          <TabsTrigger 
            value="moderation" 
            className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Moderation
            {moderationQueue && moderationQueue.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white rounded-full text-xs">
                {moderationQueue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="content" 
            className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
          >
            <Music className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl font-bold text-white">Moderation Queue</span>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 rounded-full">
                  {moderationQueue?.length || 0} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {moderationQueue && moderationQueue.length > 0 ? (
                <div className="space-y-6">
                  {moderationQueue.map((item: any) => (
                    <div key={item._id} className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/50">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12 rounded-full">
                          <AvatarImage src={item.owner?.avatarUrl || ""} alt={item.owner?.name} />
                          <AvatarFallback className="bg-zinc-700">
                            {item.owner?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white">{item.owner?.name || "Unknown"}</h4>
                            <Badge variant="secondary" className="text-xs rounded-full">
                              {item.owner?.tier || "standard"}
                            </Badge>
                          </div>
                          <p className="text-zinc-500 text-sm">{item.owner?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-500 text-sm">
                            {formatTimestamp(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      {item.content && (
                        <div className="bg-zinc-900/50 rounded-xl p-4 mb-4">
                          <h5 className="font-bold text-white mb-2">{item.content.title}</h5>
                          <p className="text-zinc-400 text-sm line-clamp-2">{item.content.description}</p>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                              {item.content.genre}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                              {item.content.region}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                              {item.content.contentType}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Rejection reason (required if rejecting)..."
                          value={rejectReason[item.content?._id] || ""}
                          onChange={(e) => setRejectReason(prev => ({ 
                            ...prev, 
                            [item.content?._id]: e.target.value 
                          }))}
                          className="bg-zinc-900/50 border-zinc-700 text-white rounded-xl"
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApproveContent(item.content?._id)}
                            disabled={isProcessing === item.content?._id}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectContent(item.content?._id)}
                            disabled={isProcessing === item.content?._id}
                            variant="destructive"
                            className="flex-1 bg-red-600 hover:bg-red-500 rounded-xl"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-zinc-400">No content pending review.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
            <CardHeader className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-xl font-bold text-white">User Management ({filteredUsers.length})</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((u: any) => (
                    <div key={u._id} className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 rounded-full">
                          <AvatarImage src={u.avatarUrl || ""} alt={u.name} />
                          <AvatarFallback className="bg-amber-500/20 text-amber-500">
                            {u.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white truncate">{u.name}</h4>
                            {u.isVerified && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Verified</Badge>}
                            {u.isSuspended && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Suspended</Badge>}
                          </div>
                          <p className="text-zinc-500 text-sm truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getRoleBadge(u.role)}
                            {getTierBadge(u.tier)}
                            <span className="text-zinc-600 text-xs">• {u.followers || 0} followers</span>
                            <span className="text-zinc-600 text-xs">• {u.activeContentCount || 0} uploads</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${u._id}`}>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {selectedUser === u._id ? (
                            <div className="flex items-center gap-2">
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger className="w-[120px] bg-zinc-700 border-zinc-600">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={() => handleUpdateRole(u._id)} size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
                                Save
                              </Button>
                              <Button onClick={() => { setSelectedUser(null); setNewRole(""); }} variant="ghost" size="sm">
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => { setSelectedUser(u._id); setNewRole(u.role); }} 
                              variant="outline" 
                              size="sm" 
                              className="border-zinc-600"
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Role
                            </Button>
                          )}
                          <Button
                            onClick={() => handleSuspendUser(u._id, !!u.isSuspended)}
                            variant="ghost"
                            size="icon"
                            className={u.isSuspended ? "text-green-500 hover:text-green-400" : "text-red-500 hover:text-red-400"}
                          >
                            {u.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Users Found</h3>
                  <p className="text-zinc-400">Try a different search term.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-bold text-white">Content Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Total Content</p>
                    <p className="text-2xl font-bold text-white">{dashboard.stats.totalContent}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Active Content</p>
                    <p className="text-2xl font-bold text-green-500">{dashboard.stats.activeContent}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Pending Review</p>
                    <p className="text-2xl font-bold text-amber-500">{dashboard.stats.pendingModeration}</p>
                  </div>
                </div>
              )}
              <div className="mt-6 text-center py-8">
                <Music className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Detailed Content View</h3>
                <p className="text-zinc-400">Browse and manage all content from the moderation queue above.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
