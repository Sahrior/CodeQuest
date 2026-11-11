import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "./useUnreadCount";

export default function MessagesButton() {
  const navigate = useNavigate();
  const count = useUnreadCount();

  return (
    <button
      type="button"
      onClick={() => navigate("/student/messages")}
      aria-label={count > 0 ? `Messages, ${count} unread` : "Messages"}
      className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-bold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}