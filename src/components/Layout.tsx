"use client";

import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

const Layout = () => {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      <main className="md:pl-64 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
