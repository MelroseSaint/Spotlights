"use client";

import { useState, useEffect } from "react";
import { Users, Music, Shield, AlertCircle, Check, X, Search, Zap, Eye, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAdminDashboard, useModerationQueue, useAdminUsers } from "../../hooks/api/useAdmin";
import { useApproveContent, useRejectContent } from "../../hooks/api/useAdmin";

export default function Admin() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const dashboard = useAdminDashboard(userId || "");
  const moderationQueue = useModerationQueue(50);
  const adminUsers = useAdminUsers(50, 0, undefined, undefined, searchQuery || undefined);
  const approveContent = useApproveContent();
  const rejectContent = useRejectContent();
  
  const handleApprove = async (contentId: string) => {
    if (!userId) return;
    setActionLoading(contentId);
    try {
      await approveContent({ moderatorId: userId as any, contentId: contentId as any });
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleReject = async (contentId: string) => {
    if (!userId) return;
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    
    setActionLoading(contentId);
    try {
      await rejectContent({ moderatorId: userId as any, contentId: contentId as any, reason });
    } catch (error) {
      console.error("Reject failed:", error);
    } finally {
      setActionLoading(null);
    }
  };
  
  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-zinc-500">Please sign in to access the admin panel</p>
      </div>
    );
  }
  
  if (dashboard === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
          <Shield size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase">Admin Dashboard</h1>
          <p className="text-zinc-500">Manage users, content, and platform settings</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-blue-400" />
            <span className="text-zinc-500 text-sm">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.stats?.totalUsers || 0}</p>
        </div>
        
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Music size={20} className="text-purple-400" />
            <span className="text-zinc-500 text-sm">Total Content</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.stats?.totalContent || 0}</p>
        </div>
        
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={20} className="text-amber-400" />
            <span className="text-zinc-500 text-sm">Active Promotions</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.stats?.activePromotions || 0}</p>
        </div>
        
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Check size={20} className="text-green-400" />
            <span className="text-zinc-500 text-sm">Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.stats?.pendingModeration || 0}</p>
        </div>
        
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Eye size={20} className="text-cyan-400" />
            <span className="text-zinc-500 text-sm">Active Content</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.stats?.activeContent || 0}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["dashboard", "moderation", "users"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              activeTab === tab ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Users by Tier</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Standard</span>
                <span className="font-bold text-white">{dashboard?.tierBreakdown?.standard || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Growth</span>
                <span className="font-bold text-amber-500">{dashboard?.tierBreakdown?.growth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Elite</span>
                <span className="font-bold text-purple-400">{dashboard?.tierBreakdown?.elite || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Users by Role</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Root Admin</span>
                <span className="font-bold text-red-400">{dashboard?.roleBreakdown?.root_admin || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Admin</span>
                <span className="font-bold text-orange-400">{dashboard?.roleBreakdown?.admin || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Moderator</span>
                <span className="font-bold text-yellow-400">{dashboard?.roleBreakdown?.moderator || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">User</span>
                <span className="font-bold text-white">{dashboard?.roleBreakdown?.user || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-left">
                View All Reports
              </button>
              <button className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-left">
                Manage Events
              </button>
              <button className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-left">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "moderation" && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Content Moderation Queue</h3>
          </div>
          
          {moderationQueue && moderationQueue.length > 0 ? (
            <div className="divide-y divide-white/5">
              {moderationQueue.map((item: any) => (
                <div key={item._id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.content?.thumbnailUrl ? (
                      <img src={item.content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Music size={24} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{item.content?.title || "Untitled"}</h4>
                    <p className="text-zinc-500 text-sm truncate">{item.content?.artistName || "Unknown Artist"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">{item.content?.genre}</span>
                      <span className="text-zinc-600 text-xs">{item.content?.region}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(item.contentId)}
                      disabled={actionLoading === item.contentId}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleReject(item.contentId)}
                      disabled={actionLoading === item.contentId}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Check size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-white font-bold">All caught up!</p>
              <p className="text-zinc-500">No content pending review</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === "users" && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-500 text-sm border-b border-white/10">
                  <th className="p-4 font-normal">User</th>
                  <th className="p-4 font-normal">Tier</th>
                  <th className="p-4 font-normal">Role</th>
                  <th className="p-4 font-normal">Content</th>
                  <th className="p-4 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers?.map((user: any) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-zinc-500 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.tier === "elite" ? "bg-purple-500/20 text-purple-400" :
                        user.tier === "growth" ? "bg-amber-500/20 text-amber-500" :
                        "bg-zinc-700/50 text-zinc-400"
                      }`}>
                        {user.tier?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-zinc-400 capitalize">{user.role?.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{user.activeContentCount || 0}</span>
                    </td>
                    <td className="p-4">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Eye size={18} className="text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
