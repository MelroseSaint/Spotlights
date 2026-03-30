"use client";

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic2, 
  Music, 
  Users, 
  TrendingUp, 
  MapPin, 
  Play, 
  ChevronRight, 
  Heart, 
  Share2, 
  Upload, 
  Zap,
  Radio,
  Volume2,
  Flame
} from 'lucide-react';
import { useSpotlightFeed, useTrendingContent } from '../hooks/api/useFeed';
import { useFreshFaceFeed } from '../hooks/api/useFeed';

const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible] as const;
};

const SectionHeader = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div 
      ref={ref}
      className={`mb-12 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="text-amber-500 w-5 h-5" />}
        <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Artist Spotlight</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight italic uppercase">{title}</h2>
      <p className="text-zinc-400 mt-4 max-w-2xl text-lg leading-relaxed">{subtitle}</p>
    </div>
  );
};

const ArtistCard = ({ artist, delay }: { artist: any; delay: number }) => {
  const [ref, isVisible] = useScrollReveal();
  
  return (
    <Link 
      to={`/profile/${artist._id}`}
      className={`group block relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="aspect-[4/5] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10 opacity-90" />
        {artist.avatarUrl ? (
          <img 
            src={artist.avatarUrl} 
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-6xl font-black text-amber-500/50">{artist.name?.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Radio size={10} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              {artist.tier || "Standard"}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6 relative z-20 -mt-24">
        <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors uppercase italic tracking-tighter">{artist.name}</h3>
        <div className="flex items-center gap-2 text-zinc-400 text-xs mt-1 font-medium">
          <MapPin size={12} className="text-amber-500" />
          <span>{artist.location || "Central PA"}</span>
        </div>
        
        <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="flex gap-4">
            <button className="text-white hover:text-amber-500 transition-colors"><Volume2 size={20} /></button>
            <button className="text-white hover:text-amber-500 transition-colors"><Share2 size={20} /></button>
          </div>
          <button className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all">
            View Profile
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  
  const spotlightFeed = useSpotlightFeed(8);
  const trendingContent = useTrendingContent(10, "week");
  const freshFaces = useFreshFaceFeed(4);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* Immersive Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Hero: Music Focused */}
      <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-500 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className={`w-0.5 h-3 bg-amber-500 animate-music-bar-${i}`} />)}
              </div>
              The 717 Music Authority
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-10 italic uppercase">
              The Stage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-200 to-white">
                Is Yours.
              </span>
            </h1>
            
            <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mb-12 leading-relaxed font-light">
              Central PA's dedicated platform for independent recording artists. No beats, no fluff—just the voices, the lyrics, and the sound of the region.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/upload" className="group bg-amber-500 text-black px-10 py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-95">
                Drop Your Latest Track <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
              </Link>
              <Link to="/discovery" className="group px-10 py-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                Browse Artist Profiles <Users size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Visual Element: Vinyl/Soundwave vibe */}
        <div className="absolute right-[-5%] top-[15%] w-[55%] h-[75%] z-0 hidden lg:block opacity-60">
           <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-l from-zinc-950 via-transparent to-transparent z-10" />
              <div className="w-[80%] h-[80%] rounded-full border-[20px] border-zinc-900 animate-spin-slow opacity-20" />
              <img 
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-full object-cover rounded-[5rem] animate-float grayscale hover:grayscale-0 transition-all duration-1000"
                alt="Mic setup"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(245,158,11,0.6)]">
                    <Play fill="black" size={40} className="ml-2" />
                 </div>
              </div>
           </div>
        </div>
      </header>

      {/* Core Artist Content */}
      <main className="container mx-auto px-6 py-24 relative z-10">
        
        <SectionHeader 
          title="Top Artists" 
          subtitle="The most streamed, most shared, and most talked about artists in Central Pennsylvania."
          icon={TrendingUp}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {freshFaces?.slice(0, 4).map((item: any, idx: number) => (
            <ArtistCard 
              key={item._id} 
              artist={item.owner || { _id: item.ownerId, name: item.artistName, tier: item.tier }}
              delay={idx * 100} 
            />
          ))}
        </div>

        {/* Fresh Faces Section */}
        <div className="mt-24">
          <Link 
            to="/fresh-faces"
            className="group block bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-[2rem] p-8 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Radio className="text-purple-400" size={32} />
                </div>
                <div>
                  <span className="text-purple-400 font-bold tracking-widest uppercase text-xs">Discover</span>
                  <h3 className="text-3xl font-black text-white italic uppercase">Fresh Faces</h3>
                  <p className="text-zinc-400">Up-and-coming artists making their mark</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-purple-400 group-hover:translate-x-2 transition-transform">
                <span className="font-bold">View All</span>
                <ChevronRight />
              </div>
            </div>
          </Link>
        </div>

        {/* Featured Content */}
        <div className="mt-24 bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row lg:items-center gap-12">
          <div className="w-full lg:w-1/2 aspect-square md:aspect-video lg:aspect-square rounded-[2rem] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1514525253361-bee8a19740c1?auto=format&fit=crop&q=80&w=1000" 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
              alt="Live performance"
            />
          </div>
          <div className="w-full lg:w-1/2">
            <span className="text-amber-500 font-black tracking-[0.4em] uppercase text-xs">Exclusives</span>
            <h2 className="text-4xl md:text-6xl font-black text-white mt-4 mb-8 italic uppercase leading-[0.9]">Beyond The Recording.</h2>
            <p className="text-zinc-400 text-lg mb-10 font-light leading-relaxed">
              We sit down with the voices behind the tracks. Learn about the struggle, the process, and what it really takes to make it in the 717.
            </p>
            <button className="flex items-center gap-4 text-white group font-black uppercase tracking-widest text-sm">
              Read Latest Interviews <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 transition-all"><ChevronRight /></div>
            </button>
          </div>
        </div>

        {/* Spotlight Feed */}
        <div className="mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="text-amber-500 font-black tracking-[0.3em] uppercase text-[10px]">Live</span>
              <h2 className="text-5xl font-black text-white mt-3 italic uppercase tracking-tighter">Spotlight Feed</h2>
            </div>
            <Link to="/pulse" className="px-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
              View All Tracks
            </Link>
          </div>

          <div className="space-y-4">
            {spotlightFeed?.slice(0, 5).map((track: any) => (
              <div key={track._id} className="group bg-zinc-900/20 border border-white/5 rounded-2xl p-4 flex items-center gap-6 hover:bg-zinc-900/60 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                  {track.thumbnailUrl ? (
                    <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-white leading-none">{track.title}</h4>
                  <span className="text-zinc-500 text-xs mt-1 block">{track.artistName} • {track.region}</span>
                </div>
                {track.isPromoted && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
                    <Zap size={12} className="text-amber-500" />
                    <span className="text-amber-500 text-xs font-bold">BOOSTED</span>
                  </div>
                )}
                <div className="hidden md:block text-zinc-600 font-mono text-xs">
                  {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-zinc-500 hover:text-red-500 transition-colors"><Heart size={18} /></button>
                  <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 transition-all">
                    <Play size={18} fill="currentColor" className="text-white group-hover:text-black ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Final CTA */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-500" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-9xl font-black text-black leading-none mb-12 italic uppercase tracking-tighter">
            Stop Being <br />Overlooked.
          </h2>
          <p className="text-black/80 text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-16">
            Central PA music artists are building a new legacy. Claim your spot in the directory and let the community hear you.
          </p>
          <Link to="/signup" className="inline-block bg-black text-white px-12 py-8 rounded-3xl font-black uppercase tracking-[0.2em] text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl">
            Register Artist Profile
          </Link>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(1deg); }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes music-bar-1 { 
          0%, 100% { height: 4px; } 
          50% { height: 12px; } 
        }
        @keyframes music-bar-2 { 
          0%, 100% { height: 12px; } 
          50% { height: 4px; } 
        }
        @keyframes music-bar-3 { 
          0%, 100% { height: 8px; } 
          50% { height: 16px; } 
        }
        .animate-music-bar-1 { 
          animation: music-bar-1 0.8s ease-in-out infinite; 
        }
        .animate-music-bar-2 { 
          animation: music-bar-2 0.6s ease-in-out infinite; 
        }
        .animate-music-bar-3 { 
          animation: music-bar-3 1s ease-in-out infinite; 
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}} />
    </div>
  );
}
