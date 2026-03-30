"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Check, Zap, Clock, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useEvents, useCheckInToEvent, useFileUrl } from "@/hooks/api";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";
import { formatEventDate, formatTime } from "@/lib/utils";
import { EVENT_RULES } from "../../convex/constants";

function CreatorAvatar({ creator }: { creator: any }) {
  const avatarUrl = useFileUrl(creator?.avatarUrl);
  return (
    <Avatar className="w-6 h-6 rounded-full">
      <AvatarImage src={avatarUrl || ""} alt={creator?.name} />
      <AvatarFallback className="bg-zinc-700 text-xs">
        {creator?.name?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { user, lightCredz } = useUser();
  const { getUpcomingEvents, hasCheckedIn } = useEvents();
  const checkInToEvent = useCheckInToEvent();
  
  const [activeTab, setActiveTab] = useState("upcoming");
  const [checkingIn, setCheckingIn] = useState<Id<"events"> | null>(null);
  
  const events = getUpcomingEvents(20);

  const canCreateEvent = lightCredz && lightCredz.balance >= EVENT_RULES.GROWTH_MIN_CREDITS;

  const handleCheckIn = async (eventId: Id<"events">) => {
    if (!user) {
      toast.error("Please sign in to check in to events");
      return;
    }
    
    setCheckingIn(eventId);
    try {
      const result = await checkInToEvent({ eventId, userId: user._id });
      toast.success(`Checked in! You earned ${result.creditsAwarded} LightCredz!`, {
        description: "Thanks for attending!",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-amber-500 w-5 h-5" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Community</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight mb-2">
            Events
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 max-w-2xl">
              Discover events in Central PA and earn LightCredz by checking in!
            </p>
            {user && (
              <Button
                onClick={() => {
                  if (!canCreateEvent) {
                    toast.error(`You need at least ${EVENT_RULES.GROWTH_MIN_CREDITS} LightCredz to create an event`);
                    return;
                  }
                  navigate("/create-event");
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 rounded-2xl p-1 mb-8 max-w-md">
            <TabsTrigger
              value="upcoming"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold"
            >
              <Clock className="w-4 h-4 mr-2" />
              Past Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any) => (
                  <Card key={event._id} className="bg-zinc-900/50 border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 flex items-center justify-between border-b border-amber-500/20">
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                        {formatEventDate(event.eventDate)}
                      </span>
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 rounded-full text-xs">
                        {formatTime(event.eventDate)}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-white line-clamp-2">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-zinc-400 text-sm line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span>{event.location}</span>
                        {event.isVirtual && (
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs ml-auto">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Virtual
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-400 text-sm">
                          {event.attendeeCount || 0} attending
                        </span>
                      </div>

                      {event.creator && (
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                          <CreatorAvatar creator={event.creator} />
                          <span className="text-zinc-500 text-sm">
                            Hosted by {event.creator.name}
                          </span>
                        </div>
                      )}

                      {user && (
                        <Button
                          onClick={() => handleCheckIn(event._id)}
                          disabled={checkingIn === event._id}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
                        >
                          {checkingIn === event._id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                              Checking In...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Check In (+10 LC)
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <Calendar size={64} className="mx-auto text-zinc-700 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Upcoming Events</h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Check back soon for events in the Central PA area!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
              <Clock size={64} className="mx-auto text-zinc-700 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Past Events</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Event history will be available here soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* LightCredz Benefits */}
        <div className="mt-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-amber-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Earn LightCredz at Events</h2>
          </div>
          <p className="text-zinc-400 mb-6">
            Check in to events to earn LightCredz that you can use to promote your own content!
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
