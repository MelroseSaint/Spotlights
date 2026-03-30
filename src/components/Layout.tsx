"use client";

import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navigation />
      <main className="md:pl-64 pb-20 md:pb-0 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
