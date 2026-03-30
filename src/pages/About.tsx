"use client";

import { Link } from "react-router-dom";
import { Crown, Music, Users, Shield, Zap, Heart, MapPin, Radio } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-zinc-950" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6">
              <span>Central PA's Music Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight italic uppercase mb-6">
              About <span className="text-amber-500">InThaSpotlight</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              A real platform for artists in Central Pennsylvania who have talent but no visibility. 
              Built on fairness, transparency, and genuine support.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-zinc-900/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-amber-500" />
              <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Our Mission</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight italic uppercase mb-6">
              Built for Artists, By Artists
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              InThaSpotlight was founded to solve a problem: independent artists in Central Pennsylvania 
              have incredible talent but lack visibility. Traditional platforms overwhelm new artists with 
              algorithms, pay-to-win systems, and industry gatekeeping that keep fresh voices silent.
            </p>
            <p className="text-lg text-zinc-400 leading-relaxed">
              We built InThaSpotlight to be different. Every feature is designed to reward genuine engagement, 
              not artificial growth. Artists share music, videos, and content while building real audiences 
              that choose to support them directly.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase mb-12 text-center">
            What Makes Us <span className="text-amber-500">Different</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fair Moderation</h3>
              <p className="text-zinc-400 text-sm">
                AI-powered content review ensures a safe community while giving artists a fair chance to be heard.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">LightCredz System</h3>
              <p className="text-zinc-400 text-sm">
                Earn credits through genuine engagement. Spend them to promote your content without paying money.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fresh Faces</h3>
              <p className="text-zinc-400 text-sm">
                New artists get featured prominently. Your first upload automatically enters the Fresh Faces queue.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Direct Support</h3>
              <p className="text-zinc-400 text-sm">
                No middlemen. Fans support artists directly through tips and subscriptions.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Events & Community</h3>
              <p className="text-zinc-400 text-sm">
                Create and discover local events. Build a real community with artists and fans in your area.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Central PA Focus</h3>
              <p className="text-zinc-400 text-sm">
                Built specifically for Harrisburg, York, Lancaster, and surrounding areas. Real local music scene.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-zinc-900/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase mb-12 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-black">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sign Up</h3>
              <p className="text-zinc-400 text-sm">
                Create your artist profile with your Central PA zip code. Limited to verified local artists.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-black">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Upload</h3>
              <p className="text-zinc-400 text-sm">
                Share your music or videos. Get reviewed by our moderation team and featured to the community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-black">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Grow</h3>
              <p className="text-zinc-400 text-sm">
                Earn LightCredz, get featured on Fresh Faces, connect with fans, and build your local following.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase mb-12 text-center">
            Subscription <span className="text-amber-500">Tiers</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Standard</h3>
              <p className="text-3xl font-black text-white mb-4">$0<span className="text-sm text-zinc-400 font-normal">/mo</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Music className="w-4 h-4 text-amber-500" /> Up to 10 tracks
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Users className="w-4 h-4 text-amber-500" /> Basic profile
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" /> Earn LightCredz
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Shield className="w-4 h-4 text-amber-500" /> Community access
                </li>
              </ul>
              <p className="text-zinc-500 text-sm">Free forever for all artists</p>
            </div>

            <div className="bg-gradient-to-b from-amber-500/20 to-zinc-900/50 border border-amber-500/30 rounded-2xl p-6">
              <div className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">Most Popular</div>
              <h3 className="text-lg font-bold text-white mb-2">Growth</h3>
              <p className="text-3xl font-black text-white mb-4">$10<span className="text-sm text-zinc-400 font-normal">/mo</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Music className="w-4 h-4 text-amber-500" /> Up to 50 tracks
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Shield className="w-4 h-4 text-amber-500" /> Featured badge
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" /> 15% promo discount
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Users className="w-4 h-4 text-amber-500" /> Higher feed visibility
                </li>
              </ul>
              <p className="text-zinc-500 text-sm">For growing artists</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Elite</h3>
              <p className="text-3xl font-black text-white mb-4">$25<span className="text-sm text-zinc-400 font-normal">/mo</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Music className="w-4 h-4 text-amber-500" /> Up to 500 tracks
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Shield className="w-4 h-4 text-amber-500" /> Verified badge
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" /> 25% promo discount
                </li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Users className="w-4 h-4 text-amber-500" /> Maximum visibility
                </li>
              </ul>
              <p className="text-zinc-500 text-sm">For professional artists</p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-t from-amber-500/10 to-zinc-950">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase mb-6">
            Ready to Get <span className="text-amber-500">Started</span>?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Join the Central Pennsylvania music community. Share your sound with the 717.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Create Your Profile
            </Link>
            <Link 
              to="/discovery"
              className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:bg-zinc-800 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Explore Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="py-12 border-t border-zinc-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-zinc-500">
            <Link to="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
            <Link to="/feedback" className="hover:text-amber-500 transition-colors">Contact / Feedback</Link>
          </div>
          <p className="text-center text-zinc-600 text-sm mt-6">
            © {new Date().getFullYear()} InThaSpotlight. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
