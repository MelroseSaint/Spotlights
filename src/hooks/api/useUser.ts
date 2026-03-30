import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useState, useEffect } from "react";

const SESSION_KEY = "spotlight_session_token";

export const useUser = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    setSessionToken(token);
  }, []);

  const currentUser = useQuery(api.backend.users.getCurrentUser, { sessionToken: sessionToken || undefined });
  const userUploadStatus = useQuery(
    api.backend.users.getUserUploadStatus,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const userLightCredz = useQuery(
    api.backend.users.getUserLightCredz,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const signInUser = useMutation(api.backend.users.signInUser);
  const signOutUser = useMutation(api.backend.users.signOutUser);

  const login = async (email: string) => {
    const result = await signInUser({ email });
    if (result.token) {
      localStorage.setItem(SESSION_KEY, result.token);
      setSessionToken(result.token);
    }
    return result;
  };

  const logout = async () => {
    if (sessionToken) {
      await signOutUser({ sessionToken });
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
  };

  return {
    user: currentUser,
    uploadStatus: userUploadStatus,
    lightCredz: userLightCredz,
    isLoading: currentUser === undefined,
    isAuthenticated: !!currentUser,
    login,
    logout,
  };
};

export const useUserById = (userId: Id<"users"> | null) => {
  return useQuery(api.backend.users.getUser, userId ? { userId } : "skip");
};

export const useFollowUser = () => {
  return useMutation(api.backend.users.followUser);
};

export const useUnfollowUser = () => {
  return useMutation(api.backend.users.unfollowUser);
};

export const useCreateUser = () => {
  return useMutation(api.backend.users.createUser);
};
