"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Track {
  _id: string;
  title: string;
  artistName: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  contentType: string;
  duration?: number;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  playTrack: (track: Track, trackQueue?: Track[]) => void;
  closePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track, trackQueue?: Track[]) => {
    setCurrentTrack(track);
    if (trackQueue) {
      setQueue(trackQueue);
    } else if (!queue.find(t => t._id === track._id)) {
      setQueue([track]);
    }
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
    setQueue([]);
  };

  return (
    <MusicPlayerContext.Provider value={{ currentTrack, queue, isPlaying, playTrack, closePlayer }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return context;
}

export type { Track };
