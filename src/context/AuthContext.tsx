"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: string | null;
    isApproved: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isApproved, setIsApproved] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

    const fetchRole = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role, is_approved')
                .eq('id', userId)
                .single();
            const userRole = data?.role || 'user';
            setRole(userRole);

            // Admins and super_admins are automatically approved; organizers/users check is_approved (default true for backward compatibility unless explicitly false or pending)
            if (userRole === 'super_admin' || userRole === 'admin') {
                setIsApproved(true);
            } else {
                setIsApproved(data?.is_approved !== false);
            }
        } catch (err) {
            console.error("Error fetching role:", err);
            setRole('user');
            setIsApproved(true);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id);
            } else {
                setRole(null);
                setIsApproved(true);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id);
            } else {
                setRole(null);
                setIsApproved(true);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setIsApproved(true);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, isApproved, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
