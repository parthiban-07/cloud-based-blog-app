"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setDemoUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("writer");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split("@")[0],
              role: selectedRole,
            },
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Account created successfully! Check your inbox or proceed to sign in.",
          });
          if (data.session) {
            router.push("/dashboard");
          }
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({ type: "success", text: "Signed in successfully! Redirecting..." });
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  const handleQuickDemo = (role: UserRole) => {
    setDemoUser(role);
    setMessage({
      type: "success",
      text: `Logged in as Instant Demo ${role.toUpperCase()}. Redirecting to feed...`,
    });
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="glass-panel p-8 rounded-3xl border border-[#10b981]/30 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#10b981]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#10b981]/15 mx-auto flex items-center justify-center border border-[#10b981]/40 text-[#34d399]">
            {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? "Create Emerald Account" : "Sign In to Cloud Studio"}
          </h1>
          <p className="text-xs text-gray-400">
            Powered by Supabase Auth with RLS Role Controls
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#050b08] border border-gray-800">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp
                ? "bg-[#10b981] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isSignUp
                ? "bg-[#10b981] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rostova"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="name@cloud-blog.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300">Default Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("writer")}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition-all ${
                    selectedRole === "writer"
                      ? "bg-[#10b981]/20 text-[#34d399] border-[#10b981]"
                      : "bg-[#050b08] text-gray-400 border-gray-800"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Writer / Author</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("reader")}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition-all ${
                    selectedRole === "reader"
                      ? "bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]"
                      : "bg-[#050b08] text-gray-400 border-gray-800"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Reader</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-emerald w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Complete Registration</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </>
            )}
          </button>
        </form>

        {/* Instant Demo Access Divider */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <div className="text-center text-[11px] font-mono text-[#fbbf24] uppercase tracking-wider flex items-center justify-center space-x-1">
            <Zap className="w-3 h-3 text-[#f59e0b]" />
            <span>Instant Demo Mode (No Supabase Account Required)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo("writer")}
              className="px-3 py-2 rounded-xl bg-[#0a1510] hover:bg-[#10b981]/20 border border-[#10b981]/30 text-xs font-semibold text-[#34d399] transition-all text-center"
            >
              Demo Writer Studio
            </button>
            <button
              onClick={() => handleQuickDemo("admin")}
              className="px-3 py-2 rounded-xl bg-[#0a1510] hover:bg-[#fbbf24]/20 border border-[#fbbf24]/30 text-xs font-semibold text-[#fbbf24] transition-all text-center"
            >
              Demo Admin User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}