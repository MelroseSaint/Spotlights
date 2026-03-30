"use client";

import { Link } from "react-router-dom";
import { Crown, Music, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-amber-500" />
              <span className="text-xl font-black text-white italic">
                InTha<span className="text-amber-500">Spotlight</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Central Pennsylvania's dedicated platform for independent recording artists. 
              Built on fairness and real engagement.
            </p>
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold tracking-widest uppercase">
              The 717 Music Authority
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/discovery" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Discover Artists
                </Link>
              </li>
              <li>
                <Link to="/fresh-faces" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Fresh Faces
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Local Events
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-zinc-500 hover:text-amber-500 transition-colors text-sm">
                  Contact / Feedback
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-sm">
            © {new Date().getFullYear()} InThaSpotlight. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-zinc-600 text-xs">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Content Moderated
            </span>
            <span>•</span>
            <span>Made in the 717</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
