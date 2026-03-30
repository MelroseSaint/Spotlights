"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Music,
  Heart,
  Flag,
  BarChart3,
  Shield,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  Crown,
  Zap,
  UserCheck,
  UserX,
  Plus,
  Flame,
  AlertCircle,
  Download,
  FileText,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useUser,
  useAdmin,
  useVerifyAdminAccess,
  useAdminDashboard,
  useApproveContent,
  useRejectContent,
  useUpdateUserRole,
  useSuspendUser,
  useDeleteUser,
  useModerationLogs,
  useAllHottestArtistsAdmin,
  useAddHottestArtist,
  useRemoveHottestArtist,
  useClearHottestArtists,
  useAnnouncements,
  useCreateAnnouncement,
} from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/utils";

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useUser();
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
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [hottestSearch, setHottestSearch] = useState("");
  const [showAddHottest, setShowAddHottest] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState<"announcement" | "update" | "whats_new">("announcement");
  const [isPinned, setIsPinned] = useState(true);

  const moderationLogs = useModerationLogs(100, true);
  const hottestArtistsAdmin = useAllHottestArtistsAdmin();
  const addHottestArtist = useAddHottestArtist();
  const removeHottestArtist = useRemoveHottestArtist();
  const clearHottestArtists = useClearHottestArtists();
  const { announcements } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const isAdmin =
    (adminAccess?.isAdmin ?? false) ||
    user?.email === "monroedoses@gmail.com";

  const filteredUsers = allUsers?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  }) || [];

  const handleApproveContent = async (contentId: Id<"artistContent">) => {
    if (!user) return;
    try {
      await approveContent({ moderatorId: user._id, contentId });
      toast.success("Content approved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  };

  const handleRejectContent = async (contentId: Id<"artistContent">) => {
    if (!user) return;
    const reason = rejectReason[contentId];
    if (!reason?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await rejectContent({ moderatorId: user._id, contentId, reason });
      toast.success("Content rejected");
      setRejectReason((prev) => ({ ...prev, [contentId]: "" }));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
  };

  const handleUpdateRole = async (targetUserId: Id<"users">) => {
    if (!user || !newRole) return;
    try {
      await updateUserRole({ adminId: user._id, targetUserId, newRole });
      toast.success("Role updated");
      setSelectedUser(null);
      setNewRole("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleSuspendUser = async (targetUserId: Id<"users">, currentlySuspended: boolean) => {
    if (!user) return;
    try {
      await suspendUser({
        adminId: user._id,
        targetUserId,
        reason: currentlySuspended ? "Unsuspended by admin" : "Suspended by admin",
      });
      toast.success(currentlySuspended ? "User unsuspended" : "User suspended");
    } catch (err: any) {
      toast.error(err.message || "Failed to update suspension status");
    }
  };

  const handleDeleteUser = async (targetUserId: Id<"users">, name: string) => {
    if (!user) return;
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await deleteUser({ adminId: user._id, targetUserId });
      toast.success("User deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const exportFullReport = () => {
    if (!dashboard || !allUsers || !moderationQueue) return;
    const report = {
      generatedAt: new Date().toISOString(),
      summary: dashboard.stats,
      tierBreakdown: dashboard.tierBreakdown,
      roleBreakdown: dashboard.roleBreakdown,
      users: allUsers.map((u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.tier,
        followers: u.followers,
        posts: u.postsCount,
        verified: u.isVerified,
        suspended: u.isSuspended,
        created: new Date(u.createdAt || 0).toISOString(),
      })),
      moderationQueue: moderationQueue.map((item) => ({
        title: item.content?.title,
        owner: item.owner?.name,
        email: item.owner?.email,
        status: item.status,
        created: new Date(item.createdAt).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const exportUsersCSV = () => {
    if (!allUsers) return;
    const headers = ["Name", "Email", "Role", "Tier", "Followers", "Posts", "Verified", "Suspended", "Created"];
    const rows = allUsers.map((u) => [
      u.name,
      u.email,
      u.role || "user",
      u.tier || "standard",
      u.followers || 0,
      u.postsCount || 0,
      u.isVerified ? "Yes" : "No",
      u.isSuspended ? "Yes" : "No",
      new Date(u.createdAt || 0).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users CSV exported");
  };

  const handleAddHottest = async (artistId: string) => {
    if (!user || !artistId) return;
    try {
      await addHottestArtist({ artistId: artistId as Id<"users">, addedBy: user._id });
      toast.success("Artist added to Hottest!");
      setShowAddHottest(false);
      setHottestSearch("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveHottest = async (artistId: Id<"users">) => {
    if (!user) return;
    try {
      await removeHottestArtist({ artistId, removedBy: user._id });
      toast.success("Artist removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClearHottest = async () => {
    if (!user) return;
    if (!confirm("Clear all hottest artists?")) return;
    try {
      await clearHottestArtists({ clearedBy: user._id });
      toast.success("Hottest list cleared");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!user || !announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createAnnouncement({
        authorId: user._id,
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
        isPinned,
      });
      toast.success("Announcement created!");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setIsPinned(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (adminAccess === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-16 h-16 text-zinc-700" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-zinc-400">You don&apos;t have admin privileges.</p>
        <Button onClick={() => navigate("/")} className="bg-amber-500 hover:bg-amber-400 text-black">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
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
            Welcome back, {user?.name}. You have {adminAccess.role} privileges.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportFullReport} variant="outline" className="rounded-xl border-zinc-700">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={exportUsersCSV} variant="outline" className="rounded-xl border-zinc-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={dashboard.stats.totalUsers} icon={<Users className="w-5 h-5" />} color="blue" />
          <StatCard label="Total Content" value={dashboard.stats.totalContent} icon={<Music className="w-5 h-5" />} color="purple" />
          <StatCard label="Pending" value={dashboard.stats.pendingModeration} icon={<Clock className="w-5 h-5" />} color="amber" />
          <StatCard label="Active Promos" value={dashboard.stats.activePromotions} icon={<Heart className="w-5 h-5" />} color="green" />
          <StatCard label="Active Content" value={dashboard.stats.activeContent} icon={<Flag className="w-5 h-5" />} color="pink" />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-zinc-900/50 rounded-xl p-1">
          <TabsTrigger value="moderation" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Mod
            {moderationQueue && moderationQueue.length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white rounded-full text-xs">{moderationQueue.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <Users className="w-4 h-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="hottest" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <Flame className="w-4 h-4 mr-1" />
            Hot
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <AlertCircle className="w-4 h-4 mr-1" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <Megaphone className="w-4 h-4 mr-1" />
            Announce
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">
            <Music className="w-4 h-4 mr-1" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Moderation Queue</span>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                  {moderationQueue?.length || 0} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moderationQueue && moderationQueue.length > 0 ? (
                moderationQueue.map((item: any) => (
                  <ModerationItem
                    key={item._id}
                    item={item}
                    rejectReason={rejectReason[item.content?._id] || ""}
                    onRejectReasonChange={(val) => setRejectReason((prev) => ({ ...prev, [item.content?._id]: val }))}
                    onApprove={() => handleApproveContent(item.content?._id)}
                    onReject={() => handleRejectContent(item.content?._id)}
                  />
                ))
              ) : (
                <EmptyState icon={<Check className="w-12 h-12" />} title="All Clear" description="No content pending moderation" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredUsers.length})</span>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-zinc-900/50 border-zinc-700"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((u: any) => (
                    <UserRow
                      key={u._id}
                      user={u}
                      onRoleChange={(role) => { setSelectedUser(u._id); setNewRole(role); }}
                      onSuspend={() => handleSuspendUser(u._id, !!u.isSuspended)}
                      onDelete={() => handleDeleteUser(u._id, u.name)}
                      selectedUserId={selectedUser}
                      newRole={newRole}
                      onUpdateRole={() => handleUpdateRole(u._id as Id<"users">)}
                      onCancelRole={() => { setSelectedUser(null); setNewRole(""); }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Users className="w-12 h-12" />} title="No Users" description="Try a different search" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hottest Tab */}
        <TabsContent value="hottest" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-6 h-6 text-amber-500" />
                  <span>Hottest in the City</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddHottest(!showAddHottest)} className="bg-amber-500 hover:bg-amber-400 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  {hottestArtistsAdmin && hottestArtistsAdmin.length > 0 && (
                    <Button onClick={handleClearHottest} variant="destructive" className="rounded-xl">
                      Clear All
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddHottest && (
                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                  <p className="text-zinc-400 text-sm">Search and select an artist to add:</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Filter artists..."
                      value={hottestSearch}
                      onChange={(e) => setHottestSearch(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-700"
                    />
                    <Select onValueChange={handleAddHottest}>
                      <SelectTrigger className="w-full sm:w-[200px] bg-zinc-900/50 border-zinc-700">
                        <SelectValue placeholder="Select artist" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {allUsers
                          ?.filter((u) => u.name.toLowerCase().includes(hottestSearch.toLowerCase()))
                          .filter((u) => !hottestArtistsAdmin?.some((h) => h.artistId === u._id))
                          .slice(0, 10)
                          .map((u) => (
                            <SelectItem key={u._id} value={u._id} className="text-white">
                              {u.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {hottestArtistsAdmin && hottestArtistsAdmin.length > 0 ? (
                hottestArtistsAdmin.map((item: any, idx: number) => (
                  <div key={item._id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      #{idx + 1}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={item.artist?.avatarUrl} />
                      <AvatarFallback className="bg-zinc-700">{item.artist?.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{item.artist?.name}</p>
                      <p className="text-zinc-500 text-sm truncate">{item.artist?.email}</p>
                    </div>
                    <Button onClick={() => handleRemoveHottest(item.artistId as Id<"users">)} variant="ghost" className="text-red-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <EmptyState icon={<Flame className="w-12 h-12" />} title="No Hottest Artists" description="Add artists to feature them here" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <span>Moderation Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moderationLogs && moderationLogs.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {moderationLogs.map((log: any) => (
                    <div key={log._id} className="p-4 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {log.flagged && <Badge variant="destructive">Flagged</Badge>}
                        <Badge className={log.actionTaken === "block" ? "bg-red-500/20 text-red-500" : log.actionTaken === "warn" ? "bg-amber-500/20 text-amber-500" : "bg-green-500/20 text-green-500"}>
                          {log.actionTaken}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600">{log.contentType}</Badge>
                        <span className="text-zinc-500 text-sm ml-auto">{formatTimestamp(log.createdAt)}</span>
                      </div>
                      <p className="text-white text-sm line-clamp-2">{log.rawContent}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<AlertCircle className="w-12 h-12" />} title="No Logs" description="Moderation activity will appear here" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Megaphone className="w-6 h-6 text-amber-500" />
                <span>Create Announcement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Announcement title..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-700"
                />
                <Textarea
                  placeholder="Announcement content..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-700 min-h-[100px]"
                />
                <div className="flex flex-wrap gap-3">
                  <Select value={announcementType} onValueChange={(v: any) => setAnnouncementType(v)}>
                    <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="whats_new">What's New</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsPinned(!isPinned)}
                    variant={isPinned ? "default" : "outline"}
                    className={isPinned ? "bg-amber-500 hover:bg-amber-400" : ""}
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    {isPinned ? "Pinned" : "Not Pinned"}
                  </Button>
                  <Button onClick={handleCreateAnnouncement} className="bg-amber-500 hover:bg-amber-400 text-black">
                    <Check className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                </div>
              </div>

              {announcements && announcements.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-white font-bold mb-3">Recent Announcements</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {announcements.slice(0, 5).map((ann: any) => (
                      <div key={ann._id} className="p-3 bg-zinc-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-bold text-white text-sm">{ann.title}</h5>
                          {ann.isPinned && <Badge className="bg-amber-500/20 text-amber-500 text-[10px]">Pinned</Badge>}
                        </div>
                        <p className="text-zinc-500 text-xs line-clamp-2">{ann.content}</p>
                        <p className="text-zinc-600 text-xs mt-1">{formatTimestamp(ann.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-white">{dashboard.stats.totalContent}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Active</p>
                    <p className="text-2xl font-bold text-green-500">{dashboard.stats.activeContent}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-amber-500">{dashboard.stats.pendingModeration}</p>
                  </div>
                </div>
              )}
              <EmptyState icon={<Music className="w-12 h-12" />} title="Content Management" description="View moderation queue for content details" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    green: "bg-green-500",
    pink: "bg-pink-500",
  };
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-400 text-sm mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
          </div>
          <div className={`${colorMap[color]} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-zinc-700 mx-auto mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}

function ModerationItem({
  item,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onReject,
}: {
  item: any;
  rejectReason: string;
  onRejectReasonChange: (val: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={item.owner?.avatarUrl} />
          <AvatarFallback className="bg-zinc-700">{item.owner?.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white">{item.owner?.name || "Unknown"}</h4>
            <Badge variant="secondary" className="text-xs">{item.owner?.tier || "standard"}</Badge>
          </div>
          <p className="text-zinc-500 text-sm">{item.owner?.email}</p>
        </div>
        <span className="text-zinc-500 text-sm">{formatTimestamp(item.createdAt)}</span>
      </div>
      {item.content && (
        <div className="bg-zinc-900/50 rounded-lg p-3 mb-4">
          <h5 className="font-bold text-white mb-1">{item.content.title}</h5>
          <p className="text-zinc-400 text-sm line-clamp-2">{item.content.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">{item.content.genre}</Badge>
            <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">{item.content.region}</Badge>
          </div>
        </div>
      )}
      <Textarea
        placeholder="Rejection reason..."
        value={rejectReason}
        onChange={(e) => onRejectReasonChange(e.target.value)}
        className="bg-zinc-900/50 border-zinc-700 mb-3"
      />
      <div className="flex gap-2">
        <Button onClick={onApprove} className="bg-green-600 hover:bg-green-500">
          <Check className="w-4 h-4 mr-1" />
          Approve
        </Button>
        <Button onClick={onReject} variant="destructive" disabled={!rejectReason.trim()}>
          <X className="w-4 h-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onRoleChange,
  onSuspend,
  onDelete,
  selectedUserId,
  newRole,
  onUpdateRole,
  onCancelRole,
}: {
  user: any;
  onRoleChange: (role: string) => void;
  onSuspend: () => void;
  onDelete: () => void;
  selectedUserId: string | null;
  newRole: string;
  onUpdateRole: () => void;
  onCancelRole: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl">
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatarUrl} />
        <AvatarFallback className="bg-zinc-700">{user.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white truncate">{user.name}</p>
          {user.isVerified && <Badge className="bg-amber-500/20 text-amber-500 text-xs">Verified</Badge>}
          {user.isSuspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
        </div>
        <p className="text-zinc-500 text-sm truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {selectedUserId === user._id ? (
          <>
            <Select value={newRole} onValueChange={onRoleChange}>
              <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onUpdateRole} size="sm" className="bg-amber-500 hover:bg-amber-400 text-black">
              Save
            </Button>
            <Button onClick={onCancelRole} size="sm" variant="ghost">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => onRoleChange(user.role || "user")} variant="outline" size="sm" className="border-zinc-600">
              <Shield className="w-4 h-4 mr-1" />
              {user.role || "User"}
            </Button>
            <Button onClick={onSuspend} variant="ghost" className={user.isSuspended ? "text-green-500" : "text-red-500"}>
              {user.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            </Button>
            <Button onClick={onDelete} variant="ghost" className="text-red-600 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
