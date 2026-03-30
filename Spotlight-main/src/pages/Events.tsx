"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Check, Zap, Video } from "lucide-react";
import { useUpcomingEvents } from "../../hooks/api/useEvents";
import { useCheckInToEvent, useHasCheckedIn } from "../../hooks/api/useEvents";

export default function Events() {
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);
  
  const upcomingEvents = useUpcomingEvents(20);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tight mb-2">
            Events
          </h1>
          <p className="text-zinc-500">Discover events in Central PA and earn LightCredz by checking in!</p>
        </div>
        
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event: any) => (
              <EventCard 
                key={event._id} 
                event={event} 
                userId={userId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5">
            <Calendar size={64} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Upcoming Events</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Check back soon for events in the Central PA area!
            </p>
          </div>
        )}
        
        <div className="mt-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-amber-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Earn LightCredz at Events</h2>
          </div>
          <p className="text-zinc-400 mb-4">
            Check in to events to earn LightCredz! The more you engage with the community, 
            the more visibility you gain on the platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Check size={24} className="text-green-500 mb-2" />
              <h3 className="font-bold text-white mb-1">Check In</h3>
              <p className="text-zinc-500 text-sm">+10 LightCredz per event</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Users size={24} className="text-blue-500 mb-2" />
              <h3 className="font-bold text-white mb-1">Meet Fans</h3>
              <p className="text-zinc-500 text-sm">Build your local following</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4">
              <Zap size={24} className="text-amber-500 mb-2" />
              <h3 className="font-bold text-white mb-1">Boost Profile</h3>
              <p className="text-zinc-500 text-sm">Increase your Fresh Face score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, userId }: { event: any; userId: string | null }) {
  const checkInToEvent = useCheckInToEvent();
  const hasCheckedIn = useHasCheckedIn(event._id, userId || "");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  const handleCheckIn = async () => {
    if (!userId || hasCheckedIn) return;
    
    setIsCheckingIn(true);
    try {
      await checkInToEvent({ eventId: event._id as any, userId: userId as any });
    } catch (error) {
      console.error("Check-in failed:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
            <div className="flex items-center gap-4 text-zinc-500 text-sm">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(event.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {event.location}
              </span>
            </div>
          </div>
          
          {event.isVirtual && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold flex items-center gap-1">
              <Video size={12} />
              VIRTUAL
            </span>
          )}
        </div>
        
        <p className="text-zinc-400 mb-4">{event.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-500 text-sm">
              <Users size={14} />
              {event.attendeeCount || 0} attending
            </span>
            {event.creator && (
              <span className="text-zinc-500 text-sm">
                by {event.creator.name}
              </span>
            )}
          </div>
          
          {userId && (
            <button
              onClick={handleCheckIn}
              disabled={!!hasCheckedIn || isCheckingIn}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                hasCheckedIn
                  ? "bg-green-500/20 text-green-400 cursor-default"
                  : "bg-amber-500 hover:bg-amber-400 text-black"
              }`}
            >
              {hasCheckedIn ? (
                <>
                  <Check size={16} />
                  Checked In (+10 credits)
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Check In
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
