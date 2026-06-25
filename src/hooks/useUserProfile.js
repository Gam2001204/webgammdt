

import { useState, useEffect } from "react";

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const loadProfile = async () => {
    try {
      const me = await db.auth.me();
      setUser(me);
      const profiles = await db.entities.UserProfile.filter({ userId: me.id });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        setProfile(null);
      }
      const bizList = await db.entities.Business.filter({ activo: true });
      setBusinesses(bizList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return { profile, businesses, loading, user, reload: loadProfile };
}