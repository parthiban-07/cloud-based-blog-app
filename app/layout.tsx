import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Emerald Cloud | Modern Full-Stack Publishing Platform",
  description: "High-performance cloud-based blog platform powered by Next.js App Router, Supabase Postgres RLS, and dynamic Markdown rendering.",
  keywords: ["Next.js", "Supabase", "Postgres", "Markdown", "Blog Platform", "Full Stack"],
  authors: [{ name: "Emerald Platform Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#050b08] text-[#f3f4f6]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
