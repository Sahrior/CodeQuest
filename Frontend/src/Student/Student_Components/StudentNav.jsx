import { useEffect, useState } from "react";
import StudentNavbar from "./StudentNavbar";
import StudentNavbarPreminum from "./StudentNavbarPreminum";
import { API_URL } from "../../api";

const cache = { token: null, premium: false };

export default function StudentNav() {
  const token = localStorage.getItem("token");
  const [premium, setPremium] = useState(cache.token === token ? cache.premium : false);

  useEffect(() => {
    if (!token || cache.token === token) return;

    let cancelled = false;

    fetch(`${API_URL}/api/student/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        cache.token = token;
        cache.premium = Boolean(data.profile.is_premium);
        setPremium(cache.premium);
      })
      .catch(() => {
        // the normal navbar stays in place if this fails
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return premium ? <StudentNavbarPreminum /> : <StudentNavbar />;
}