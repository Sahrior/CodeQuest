import { useEffect, useState } from "react";
import { API_URL } from "../../api";
import { getSocket } from "../../socketclient";

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(data.count);
      } catch {
        // the badge simply stays as it was
      }
    };

    refresh();

    const socket = getSocket();
    if (socket) socket.on("message:new", refresh);
    window.addEventListener("messages:changed", refresh);

    return () => {
      cancelled = true;
      if (socket) socket.off("message:new", refresh);
      window.removeEventListener("messages:changed", refresh);
    };
  }, []);

  return count;
}