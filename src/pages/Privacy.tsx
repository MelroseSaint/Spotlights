"use client";

import { Shield, Lock, Eye, Mail } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-amber-500" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Information We Collect
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We collect information you provide directly:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (bio, location, profile picture)</li>
              <li>Content you upload (music, images, descriptions)</li>
              <li>Messages and interactions with other users</li>
              <li>Payment information (processed by Stripe)</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              How We Use Your Information
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Provide and maintain the Platform</li>
              <li>Process transactions and send related information</li>
              <li>Send you updates and notifications</li>
              <li>Moderate content for compliance with guidelines</li>
              <li>Improve and optimize the Platform</li>
              <li>Detect and prevent fraudulent or abusive activity</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Content Moderation</h2>
            <p className="text-zinc-400 leading-relaxed">
              We use automated systems to moderate content you submit. This includes using third-party services 
              like OpenAI to analyze content for policy violations. Content that violates our guidelines may be 
              blocked or removed.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Data Sharing</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Other users (as visible on your profile and content)</li>
              <li>Service providers (hosting, payment processing, moderation)</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Data Security</h2>
            <p className="text-zinc-400 leading-relaxed">
              We implement appropriate security measures to protect your information. However, no method of 
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Rights</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cookies</h2>
            <p className="text-zinc-400 leading-relaxed">
              We use cookies to maintain your session and preferences. You can control cookie settings through 
              your browser.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Children's Privacy</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Platform is not intended for users under 13 years of age. We do not knowingly collect 
              information from children under 13.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p className="text-zinc-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes 
              by posting the new policy on this page.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
            <p className="text-zinc-400 leading-relaxed">
              For questions about this Privacy Policy, please use the <a href="/feedback" className="text-amber-500 hover:underline">Feedback</a> page to contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
