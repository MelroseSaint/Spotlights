"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Zap, Check, ArrowRight, Loader2, Copy, AlertTriangle } from "lucide-react";
import { useCreateUser, useUser } from "@/hooks/api";
import { toast } from "sonner";

const FEATURES = [
  "Upload up to 10 tracks for free",
  "Earn LightCredz through engagement",
  "Promote content without paying",
  "Join the Fresh Faces program",
  "Connect with Central PA artists",
];

export default function SignUp() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const { user, isLoading, isAuthenticated, login } = useUser();
  
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      navigate(`/profile/${user._id}`);
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!zipCode.trim()) {
      toast.error("Please enter your zip code");
      return;
    }
    if (!/^\d{5}$/.test(zipCode.trim())) {
      toast.error("Please enter a valid 5-digit zip code");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUser({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        username: username.trim() || undefined,
        location: location.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
      });
      
      if (result?.token) {
        localStorage.setItem("spotlight_session_token", result.token);
        toast.success("Account created!");
        window.location.reload();
      } else {
        toast.error("Failed to create account");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase());
      toast.success("Welcome back!");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in. Please check your email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Music2 className="w-7 h-7 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                InTha<span className="text-amber-500">Spotlight</span>
              </span>
            </Link>
            <h1 className="text-3xl font-black text-white mb-2">{isSignUp ? "Join the 717" : "Welcome Back"}</h1>
            <p className="text-zinc-400">{isSignUp ? "Create your artist profile and start sharing your music" : "Sign in to continue"}</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                isSignUp ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                !isSignUp ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
            {isSignUp ? (
              <form onSubmit={handleSignUp}>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold text-white">Create Account</CardTitle>
                  <CardDescription className="text-zinc-400">
                    It's free and always will be
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name or stage name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white font-medium">
                      Username (optional)
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="yourstagename"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white font-medium">
                      Location (optional)
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Harrisburg, PA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-white font-medium">
                      Zip Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="17109"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      maxLength={5}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                    <p className="text-xs text-zinc-500">
                      Must be a Central PA zip code (717, 170xx, 173xx, etc.)
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl h-12 text-lg"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Free Account
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleSignIn}>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Enter your email to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-amber-500"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl h-12 text-lg"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-l border-zinc-800/50 items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 text-sm font-bold">FREE FOREVER</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tight">
              The Stage <br />
              <span className="text-amber-500">Is Yours.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Join Central Pennsylvania's dedicated platform for independent recording artists.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <p className="text-zinc-400 italic">
              "Finally, a platform that actually supports local artists. The Fresh Faces program helped me get my first 1,000 followers!"
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <div>
                <p className="font-bold text-white">Luna Echo</p>
                <p className="text-zinc-500 text-sm">Indie Rock • Lancaster, PA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
