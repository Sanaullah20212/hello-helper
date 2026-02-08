import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    console.log("Checking admin role for user:", userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      console.log("Admin check result:", { data, error });
      
      const isAdminUser = !!data && !error;
      console.log("Is admin:", isAdminUser);
      setIsAdmin(isAdminUser);
      setAdminChecked(true);
    } catch (err) {
      console.error("Admin check error:", err);
      setIsAdmin(false);
      setAdminChecked(true);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAdminChecked(false);

        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 100);
        } else {
          setIsAdmin(false);
          setAdminChecked(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAdminChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    setAdminChecked(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminChecked(false);
  };

  return { user, session, loading, isAdmin, adminChecked, signIn, signUp, signOut };
};
