"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from "./types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDemoUser: (role: UserRole) => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "reader",
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  setDemoUser: () => {},
  isDemo: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Fallback default profile if table query fails or row missing
        setProfile({
          id: userId,
          display_name: user?.email?.split("@")[0] || "User",
          role: "writer",
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      setProfile({
        id: userId,
        display_name: "Author User",
        role: "writer",
      });
    }
  }

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch {
        console.log("Auth session initialization completed");
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsDemo(false);
          await fetchProfile(session.user.id);
        } else if (!isDemo) {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isDemo) {
      setUser(null);
      setProfile(null);
      setIsDemo(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const setDemoUser = (selectedRole: UserRole) => {
    setIsDemo(true);
    const mockId = `demo-${selectedRole}-id`;
    setUser({
      id: mockId,
      email: `${selectedRole}@emerald-blog.cloud`,
      app_metadata: {},
      user_metadata: { display_name: `Demo ${selectedRole.toUpperCase()}` },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User);

    setProfile({
      id: mockId,
      display_name: `Demo ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
      role: selectedRole,
      avatar_url: selectedRole === 'admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    });
  };

  const role: UserRole = profile?.role || "reader";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signOut,
        refreshProfile,
        setDemoUser,
        isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
