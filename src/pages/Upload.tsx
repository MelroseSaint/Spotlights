"use client";

import { Upload as UploadIcon } from "lucide-react";
import UploadForm from "@/components/UploadForm";

export default function Upload() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UploadIcon className="text-amber-500 w-5 h-5" />
          <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">Broadcast</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight italic uppercase">
          Upload Content
        </h1>
        <p className="text-zinc-400 mt-4 max-w-2xl text-lg leading-relaxed">
          Share your art with the Central PA community. All content is reviewed before appearing in the feed.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
