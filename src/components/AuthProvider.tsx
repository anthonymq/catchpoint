import { useEffect, type ReactNode } from "react";
import { subscribeToAuthState } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { isUsingMockAuth } from "@/lib/firebase";
import { db } from "@/db";
import { generateTestCatches } from "@/data/testCatches";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setUser(user);
      setLoading(false);

      if (user && isUsingMockAuth) {
        const count = await db.catches.count();
        if (count === 0) {
          console.log("[Auth] Seeding mock data for local dev...");
          const testData = generateTestCatches();
          await db.catches.bulkAdd(
            testData.map((c) => ({
              ...c,
              userId: user.uid,
              syncStatus: "synced",
            })),
          );
        }
      }
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}
