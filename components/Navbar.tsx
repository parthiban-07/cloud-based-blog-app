"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Feather, 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  Database, 
  Menu, 
  X, 
  Sparkles,
  ShieldCheck,
  UserCheck
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, role, signOut, isDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[#10b981]/20 bg-[#050b08]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#f59e0b] p-0.5 shadow-lg shadow-[#10b981]/20 group-hover:shadow-[#10b981]/40 transition-all duration-300">
              <div className="w-full h-full bg-[#050b08] rounded-[10px] flex items-center justify-center">
                <Feather className="w-5 h-5 text-[#34d399] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#34d399] to-[#fbbf24] bg-clip-text text-transparent">
                EmeraldCloud
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                v2.4 Postgres
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Explore Feed
            </Link>

            {user && (role === "writer" || role === "admin") && (
              <Link
                href="/dashboard"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard")
                    ? "bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#fbbf24]" />
                <span>Studio Studio</span>
              </Link>
            )}

            <Link
              href="/db-setup"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                pathname === "/db-setup"
                  ? "bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40"
                  : "text-gray-400 hover:text-[#fbbf24] hover:bg-white/5"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>SQL Schema</span>
            </Link>
          </nav>

          {/* Auth / Profile Section */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Role Badge */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0a1510] border border-[#10b981]/30">
                  {role === "admin" ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-[#34d399]" />
                  )}
                  <span className="text-xs font-semibold capitalize text-[#34d399]">
                    {profile?.display_name || user.email?.split("@")[0]} ({role})
                  </span>
                  {isDemo && (
                    <span className="text-[10px] bg-[#f59e0b]/20 text-[#fbbf24] px-1.5 rounded">
                      Demo
                    </span>
                  )}
                </div>

                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-emerald flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#10b981]/20 bg-[#050b08] px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-[#10b981]/15 hover:text-[#34d399]"
          >
            Explore Feed
          </Link>

          {user && (role === "writer" || role === "admin") && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-[#10b981]/15 hover:text-[#34d399]"
            >
              Studio Studio
            </Link>
          )}

          <Link
            href="/db-setup"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-amber-400/10"
          >
            SQL Database Schema
          </Link>

          <div className="pt-2 border-t border-gray-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-[#34d399]">
                  Signed in as <span className="font-bold">{profile?.display_name}</span> ({role})
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-emerald block w-full text-center px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
