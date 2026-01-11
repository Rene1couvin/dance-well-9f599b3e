import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export type RedirectIntent = {
  action: "enroll" | "book";
  id: string;
  type?: "regular" | "private";
};

/**
 * Hook to manage authentication redirects with preserved intent
 * Allows users to continue their action after signing in
 */
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Encode intent for URL
  const encodeIntent = (intent: RedirectIntent): string => {
    return btoa(JSON.stringify(intent));
  };

  // Decode intent from URL
  const decodeIntent = (): RedirectIntent | null => {
    const encoded = searchParams.get("intent");
    if (!encoded) return null;
    try {
      return JSON.parse(atob(encoded));
    } catch {
      return null;
    }
  };

  // Redirect to auth with intent preserved
  const redirectToAuth = (intent: RedirectIntent, returnPath: string) => {
    const encodedIntent = encodeIntent(intent);
    navigate(`/auth?intent=${encodedIntent}&return=${encodeURIComponent(returnPath)}`);
  };

  // Get the return path and intent from URL
  const getRedirectInfo = () => {
    const intent = decodeIntent();
    const returnPath = searchParams.get("return") || "/";
    return { intent, returnPath };
  };

  return {
    redirectToAuth,
    getRedirectInfo,
    decodeIntent,
  };
};

/**
 * Hook to handle post-auth redirect
 * Use this in the Auth component
 */
export const usePostAuthRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      const intent = searchParams.get("intent");
      const returnPath = searchParams.get("return");
      
      if (returnPath) {
        // Navigate back to the original page with intent
        const url = intent 
          ? `${returnPath}?intent=${intent}`
          : returnPath;
        navigate(url, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate, searchParams]);

  return { hasIntent: !!searchParams.get("intent") };
};
