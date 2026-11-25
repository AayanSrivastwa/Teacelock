import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { isConfiguredAdminEmail, type UserRole } from "../lib/roles";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  userRole: null,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  syncUserProfile: async () => {},
});

// Configure admin emails from env var. Normalized: lowercase + trimmed.
// If empty, admin access is denied to everyone.
// (Used internally by isConfiguredAdminEmail from roles.ts)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserProfileFromDb(session.user);
      }
      setLoading(false);
    });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncUserProfileFromDb(session.user);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user role from the database (server-side source of truth)
  const syncUserProfileFromDb = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (error || !data) {
        // Profile may not exist yet; attempt to sync via RPC
        await syncUserProfileRpc(authUser);
        return;
      }

      const role = data.role as UserRole;
      setUserRole(role);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  // Call the SECURITY DEFINER RPC to create/update the user profile
  const syncUserProfileRpc = async (authUser: User) => {
    const email = authUser.email;
    if (!email) return;

    try {
      const { error } = await supabase.rpc("sync_user_profile", { p_email: email });
      if (error) {
        console.error("sync_user_profile RPC error:", error);
        // Fallback: determine role from frontend-configured admin list
        const isAdmin = isConfiguredAdminEmail(email);
        setUserRole(isAdmin ? "admin" : "customer");
        return;
      }

      // Re-fetch the role after sync
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();
      if (data) {
        setUserRole(data.role as UserRole);
      } else {
        const isAdmin = isConfiguredAdminEmail(email);
        setUserRole(isAdmin ? "admin" : "customer");
      }
    } catch (err) {
      console.error("sync_user_profile RPC failed:", err);
      const isAdmin = isConfiguredAdminEmail(email);
      setUserRole(isAdmin ? "admin" : "customer");
    }
  };

  // Public method to manually trigger profile sync (e.g., after sign-in)
  const syncUserProfile = async () => {
    if (user) {
      await syncUserProfileFromDb(user);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Failed to initialize Google authentication.");
      }
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error);
      setAuthError(error.message);
    }
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  // Determine admin status from BOTH frontend config and database role.
  // The database role is the source of truth; frontend config is a UX hint.
  const userEmail = user?.email?.toLowerCase() || "";
  const frontendIsAdmin = isConfiguredAdminEmail(userEmail);
  const isAdmin = Boolean(user && (userRole === "admin" || frontendIsAdmin));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        userRole,
        authError,
        signInWithGoogle,
        signOut,
        syncUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

