"use client";

import { Shield, Mail, AlertCircle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-amber-500" />
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              By accessing and using InThaSpotlight ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-zinc-400 leading-relaxed">
              InThaSpotlight is a platform for independent recording artists in Central Pennsylvania to share their 
              music and content. The Platform provides tools for uploading, sharing, and promoting artistic content.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              To use certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">4. Content Guidelines</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              All content uploaded to the Platform must comply with the following guidelines:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li>Content must be original or you must have rights to share it</li>
              <li>No content promoting violence, hate speech, or discrimination</li>
              <li>No sexually explicit or harmful content</li>
              <li>No content that infringes on intellectual property rights</li>
              <li>No fraudulent or deceptive content</li>
            </ul>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">5. Moderation</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Platform uses automated systems to moderate content. Content may be reviewed, approved, or rejected 
              based on community guidelines. Admins reserve the right to remove content and suspend accounts that 
              violate these terms.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-zinc-400 leading-relaxed">
              Users retain ownership of content they upload. By uploading content, you grant the Platform a 
              non-exclusive license to display and distribute your content on the Platform.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">7. Subscription & Payments</h2>
            <p className="text-zinc-400 leading-relaxed">
              Paid subscriptions provide additional features. Payments are processed through Stripe. Subscriptions 
              renew automatically unless cancelled. Refunds are subject to Stripe's policies.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Platform is provided "as is" without warranties. We are not liable for any damages arising 
              from your use of the Platform.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              We may update these terms at any time. Continued use of the Platform after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">10. Contact</h2>
            <p className="text-zinc-400 leading-relaxed">
              For questions about these terms, please use the <a href="/feedback" className="text-amber-500 hover:underline">Feedback</a> page to contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
