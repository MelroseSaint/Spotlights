"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bug, MessageSquare, Lightbulb, ArrowLeft, Send, Check, Loader2 } from "lucide-react";
import { useUser, useSubmitFeedback, useUserFeedback } from "@/hooks/api";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  { id: "bug_report", label: "Bug Report", description: "Report a technical issue or error", icon: Bug },
  { id: "feature_request", label: "Feature Request", description: "Suggest a new feature or improvement", icon: Lightbulb },
  { id: "general_feedback", label: "General Feedback", description: "Share your thoughts or suggestions", icon: MessageSquare },
];

export default function Feedback() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isUserLoading } = useUser();
  const submitFeedback = useSubmitFeedback();
  const userFeedback = useUserFeedback(user?._id || null);

  const [feedbackType, setFeedbackType] = useState("general_feedback");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated && !isUserLoading) {
    navigate("/signup");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id) return;

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!description.trim() || description.length < 10) {
      toast.error("Please provide more details (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId: user._id,
        type: feedbackType as "bug_report" | "feature_request" | "general_feedback",
        subject: subject.trim(),
        description: description.trim(),
      });

      toast.success("Feedback submitted! Thank you for helping us improve.");
      setSubject("");
      setDescription("");
      setFeedbackType("general_feedback");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Feedback & Support</h1>
            <p className="text-zinc-400 text-sm">Help us improve the platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white">Submit Feedback</CardTitle>
              <CardDescription className="text-zinc-400">
                Report bugs, request features, or share your thoughts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white">Feedback Type</Label>
                <RadioGroup
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {FEEDBACK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.id}>
                        <RadioGroupItem value={type.id} id={type.id} className="peer hidden" />
                        <label
                          htmlFor={type.id}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                            feedbackType === type.id
                              ? "bg-amber-500/10 border-amber-500 text-amber-500"
                              : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="font-medium text-sm">{type.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Please provide as much detail as possible..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px] bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">
                  {description.length}/2000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isSubmitting || !subject.trim() || description.length < 10}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>

        {userFeedback && userFeedback.length > 0 && (
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl mt-8">
            <CardHeader>
              <CardTitle className="text-white">Your Previous Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userFeedback.slice(0, 5).map((fb: any) => (
                <div key={fb._id} className="p-4 bg-zinc-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-amber-500 font-medium uppercase">
                      {fb.type.replace("_", " ")}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      fb.status === "resolved" ? "bg-green-500/20 text-green-400" :
                      fb.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                      fb.status === "declined" ? "bg-red-500/20 text-red-400" :
                      "bg-zinc-600/50 text-zinc-400"
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                  <p className="font-medium text-white">{fb.subject}</p>
                  {fb.adminResponse && (
                    <p className="text-sm text-zinc-400 mt-2 border-t border-zinc-700 pt-2">
                      <span className="text-amber-500">Admin response:</span> {fb.adminResponse}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
