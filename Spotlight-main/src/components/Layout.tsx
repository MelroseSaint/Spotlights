"use client";

import { Outlet, Link, useLocation } from "react-router-dom";
import { Navigation } from "./Navigation";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Layout = () => {
  const [user, setUser] = useState<any>(null);
  const currentUser = useQuery(api.backend.users.getCurrentUser);
  
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem("userId", currentUser._id);
    }
  }, [currentUser]);
  
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("userId");
  };
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
