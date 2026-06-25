

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import OnboardingModal from "@/components/OnboardingModal";

export default function OnboardingWrapper() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const me = await db.auth.me();
      setUser(me);
      const profiles = await db.entities.UserProfile.filter({ userId: me.id });
      setProfile(profiles[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#111111]">
        <div className="w-8 h-8 border-4 border-[#FDDC03]/30 border-t-[#FDDC03] rounded-full animate-spin" />
      </div>
    );
  }

  const needsOnboarding = !profile?.onboardingCompletado;

  return (
    <>
      {needsOnboarding && user && (
        <OnboardingModal user={user} onComplete={loadProfile} />
      )}
      <Outlet />
    </>
  );
}