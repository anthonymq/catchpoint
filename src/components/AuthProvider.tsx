import { useEffect, type ReactNode } from "react";
import { subscribeToAuthState } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}
