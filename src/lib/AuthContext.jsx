import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
    });

    return () => unsubscribe();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setIsAuthenticated(!!auth.currentUser);
    setUser(auth.currentUser);
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  const logout = async (shouldRedirect = true) => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};