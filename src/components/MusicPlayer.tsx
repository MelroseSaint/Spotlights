"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Heart, X, ChevronUp, ChevronDown, Shuffle, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { useFileUrl } from "@/hooks/api";
import { Id } from "convex/_generated/dataModel";

export default function MusicPlayer() {
  const { currentTrack, queue, isPlaying, playTrack, closePlayer } = useMusicPlayer();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  
  const audioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const mediaUrl = useFileUrl(currentTrack?.mediaUrl);

  useEffect(() => {
    if (currentTrack && mediaUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (currentTrack.contentType === "audio") {
        audioRef.current = new Audio(mediaUrl);
      } else {
        const videoEl = document.createElement("video");
        videoEl.src = mediaUrl;
        videoEl.muted = true;
        videoEl.autoplay = true;
        audioRef.current = videoEl;
      }
      
      const media = audioRef.current;
      media.volume = volume / 100;
      
      media.addEventListener("loadedmetadata", () => {
        setDuration(media.duration || currentTrack.duration || 0);
      });
      
      media.addEventListener("timeupdate", () => {
        setCurrentTime(media.currentTime);
      });
      
      media.addEventListener("ended", () => {
        handleNext();
      });
      
      if (isPlaying) {
        media.play().catch(console.error);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentTrack, mediaUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const handleNext = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        return;
      }
    }
    
    playTrack(queue[nextIndex], queue);
  };

  const handlePrev = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === "all") {
        prevIndex = queue.length - 1;
      } else {
        audioRef.current!.currentTime = 0;
        return;
      }
    }
    
    playTrack(queue[prevIndex], queue);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Expanded Queue View */}
      {isExpanded && (
        <div className="fixed bottom-20 left-0 right-0 top-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 z-40 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Now Playing</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-lg font-bold text-white mb-4">Queue ({queue.length})</h3>
              <div className="space-y-2">
                {queue.map((track, idx) => (
                  <div
                    key={track._id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      currentTrack?._id === track._id ? "bg-amber-500/20" : "bg-zinc-800/50 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-zinc-500 w-6 text-center">{idx + 1}</span>
                    <div className="w-12 h-12 rounded-lg bg-zinc-700 overflow-hidden">
                      {track.thumbnailUrl && (
                        <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => playTrack(track, queue)}>
                      <p className="font-medium text-white truncate cursor-pointer hover:text-amber-500">{track.title}</p>
                      <p className="text-sm text-zinc-500 truncate">{track.artistName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 z-50">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Current Track Info */}
          <div className="flex items-center gap-3 flex-shrink-0 w-64">
            {currentTrack && (
              <>
                <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                  {currentTrack.thumbnailUrl ? (
                    <img src={currentTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ListMusic className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <Link to={`/profile/${currentTrack.ownerId}`} className="font-medium text-white truncate block hover:text-amber-500">
                    {currentTrack.title}
                  </Link>
                  <p className="text-sm text-zinc-500 truncate">{currentTrack.artistName}</p>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`text-zinc-400 hover:text-white ${isShuffled ? "text-amber-500" : ""}`}
                onClick={() => setIsShuffled(!isShuffled)}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={handlePrev}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="bg-white hover:bg-zinc-200 text-black rounded-full w-10 h-10"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={handleNext}>
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`text-zinc-400 hover:text-white ${repeatMode !== "off" ? "text-amber-500" : ""}`}
                onClick={() => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-xl flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-zinc-500 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Extra */}
          <div className="flex items-center gap-2 w-48 justify-end">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => setShowQueue(!showQueue)}>
              <ListMusic className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Heart className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-red-500"
              onClick={closePlayer}
            >
              <X className="w-5 h-5" />
            </Button>
            {volume > 0 && !isMuted ? (
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => setIsMuted(true)}>
                <Volume2 className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => setIsMuted(false)}>
                <VolumeX className="w-5 h-5" />
              </Button>
            )}
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Queue Sidebar */}
      {showQueue && (
        <div className="fixed bottom-20 right-0 w-80 max-h-96 bg-zinc-900 border border-zinc-800 rounded-l-2xl overflow-hidden z-40">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-white">Queue</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowQueue(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="max-h-72 overflow-auto">
            {queue.map((track) => (
              <div
                key={track._id}
                className="flex items-center gap-2 p-2 hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => playTrack(track, queue)}
              >
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                  {track.thumbnailUrl && (
                    <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{track.artistName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
