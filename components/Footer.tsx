import React from "react";
import Link from "next/link";
import { Feather, Shield, Cpu, Cloud, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#10b981]/15 bg-[#040907] text-gray-400 text-sm py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center border border-[#10b981]/40">
                <Feather className="w-4 h-4 text-[#34d399]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Emerald Cloud
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Enterprise-grade publishing platform utilizing Next.js App Router, Supabase RLS Row-Level Security, and dynamic Markdown rendering.
            </p>
          </div>

          {/* Architecture Tech Stack */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#fbbf24] mb-3">
              Cloud Stack
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-2 text-gray-300">
                <Cpu className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Next.js App Router & Server Components</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <Database className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Supabase Postgres + RLS Policies</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <Shield className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Supabase Auth (JWT & Role Profiles)</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <Cloud className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Vercel Deploy Ready + Dynamic Sitemap</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#34d399] mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#34d399] transition-colors">
                  Blog Feed & Search
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#34d399] transition-colors">
                  Author Studio Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#34d399] transition-colors">
                  User Authentication
                </Link>
              </li>
              <li>
                <Link href="/db-setup" className="hover:text-[#fbbf24] transition-colors">
                  Supabase SQL Database Script
                </Link>
              </li>
            </ul>
          </div>

          {/* Aesthetic Theme Specs */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#34d399] mb-3">
              UI System
            </h4>
            <p className="text-xs text-gray-400 mb-2">
              Non-blue theme: Emerald Obsidian glassmorphism with Amber Champagne accents.
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <span className="w-4 h-4 rounded-full bg-[#050b08] border border-gray-600" title="Obsidian #050b08"></span>
              <span className="w-4 h-4 rounded-full bg-[#10b981]" title="Emerald #10b981"></span>
              <span className="w-4 h-4 rounded-full bg-[#34d399]" title="Mint #34d399"></span>
              <span className="w-4 h-4 rounded-full bg-[#f59e0b]" title="Amber #f59e0b"></span>
              <span className="w-4 h-4 rounded-full bg-[#fbbf24]" title="Gold #fbbf24"></span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#10b981]/10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Emerald Cloud Blog Platform. Built with Next.js, Supabase, & TypeScript.
        </div>
      </div>
    </footer>
  );
}
