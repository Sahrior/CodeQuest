import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StudentNavbar from "../Student_Components/StudentNavbar";
import StudentNavbarPreminum from "../Student_Components/StudentNavbarPreminum";
import StudentSearch from "../Student_Components/StudentSearch";
import { Avatar, linkSmall } from "../Student_Components/shared";
import { API_URL } from "../../api";
import { closeSocket, getSocket } from "../../socketclient";

const MAX_LENGTH = 2000;

const getMyId = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.id ?? null;
  } catch {
    return null;
  }
};

const request = async (navigate, path, { method = "GET", json } = {}) => {
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  if (json) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}/api/messages${path}`, {
      method,
      headers,
      body: json ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (res.status === 401) {
    closeSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    throw new Error("Your session has expired. Please log in again");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const dayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const listTime = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) return formatTime(value);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const btnSolid =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 no-underline hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";

const Messages = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const parsedId = Number(studentId);
  const activeId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const me = getMyId();

  const [conversations, setConversations] = useState(null);
  const [listError, setListError] = useState("");
  const [viewerPremium, setViewerPremium] = useState(false);
  const [chat, setChat] = useState(null);
  const [chatError, setChatError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const stickToBottom = useRef(true);
  const restoreHeight = useRef(null);
  const activeIdRef = useRef(activeId);
  const conversationsRef = useRef(conversations);

  const loadConversations = useCallback(async () => {
    try {
      const data = await request(navigate, "/conversations");
      setConversations(data.conversations);
      setViewerPremium(data.viewer_is_premium);
      setListError("");
    } catch (err) {
      setListError(err.message);
      setConversations((current) => current ?? []);
    }
  }, [navigate]);

  const markRead = useCallback(
    async (otherId) => {
      try {
        await request(navigate, `/with/${otherId}/read`, { method: "POST" });
        setConversations((list) =>
          list ? list.map((c) => (c.other.id === otherId ? { ...c, unread: 0 } : c)) : list
        );
        window.dispatchEvent(new Event("messages:changed"));
      } catch {
        // marking as read is not critical
      }
    },
    [navigate]
  );

  const markReadRef = useRef(markRead);
  const loadConversationsRef = useRef(loadConversations);

  useEffect(() => {
    activeIdRef.current = activeId;
    conversationsRef.current = conversations;
    markReadRef.current = markRead;
    loadConversationsRef.current = loadConversations;
  });

  const applyMessage = useCallback(
    (message) => {
      const otherId = message.sender_id === me ? message.recipient_id : message.sender_id;
      const reading = otherId === activeIdRef.current && document.visibilityState === "visible";

      if (otherId === activeIdRef.current) {
        setChat((current) => {
          if (!current || current.student.id !== otherId) return current;
          if (current.messages.some((m) => m.message_id === message.message_id)) return current;
          return { ...current, messages: [...current.messages, message] };
        });
      }

      if (message.sender_id !== me && reading) {
        markReadRef.current(otherId);
      }

      const known = conversationsRef.current?.some((c) => c.other.id === otherId);

      if (!known) {
        loadConversationsRef.current();
        return;
      }

      setConversations((list) => {
        if (!list) return list;
        const index = list.findIndex((c) => c.other.id === otherId);
        if (index === -1) return list;

        const existing = list[index];
        const unread =
          message.sender_id !== me && !reading && !existing.blocked_by_me
            ? existing.unread + 1
            : existing.unread;

        const updated = {
          ...existing,
          unread,
          last_message: {
            content: message.content,
            sender_id: message.sender_id,
            created_at: message.created_at,
          },
        };

        return [updated, ...list.filter((_, i) => i !== index)];
      });
    },
    [me]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!activeId) {
      setChat(null);
      setChatError("");
      return;
    }

    if (activeId === me) {
      navigate("/student/messages", { replace: true });
      return;
    }

    let cancelled = false;
    setChat(null);
    setChatError("");
    setChatLoading(true);
    setNotice("");
    setDraft("");

    request(navigate, `/with/${activeId}`)
      .then((data) => {
        if (cancelled) return;
        stickToBottom.current = true;
        setChat({
          student: data.student,
          messages: data.messages,
          hasMore: data.has_more,
          canMessage: data.can_message,
          blockedByMe: data.blocked_by_me,
        });
        if (data.messages.some((m) => m.sender_id !== me && !m.read_at)) {
          markReadRef.current(activeId);
        }
      })
      .catch((err) => {
        if (!cancelled) setChatError(err.message);
      })
      .finally(() => {
        if (!cancelled) setChatLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, me, navigate]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onRead = ({ by }) => {
      if (by !== activeIdRef.current) return;
      const now = new Date().toISOString();
      setChat((current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((m) =>
                m.sender_id === me && !m.read_at ? { ...m, read_at: now } : m
              ),
            }
          : current
      );
    };

    const onReconnect = () => loadConversationsRef.current();

    socket.on("message:new", applyMessage);
    socket.on("messages:read", onRead);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("message:new", applyMessage);
      socket.off("messages:read", onRead);
      socket.io.off("reconnect", onReconnect);
    };
  }, [applyMessage, me]);

  useEffect(() => {
    const onVisible = () => {
      const current = activeIdRef.current;
      if (document.visibilityState !== "visible" || !current) return;
      const conversation = conversationsRef.current?.find((c) => c.other.id === current);
      if (conversation && conversation.unread > 0) markReadRef.current(current);
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !chat) return;

    if (restoreHeight.current !== null) {
      el.scrollTop = el.scrollHeight - restoreHeight.current;
      restoreHeight.current = null;
      return;
    }

    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat?.messages.length, chat?.student.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (!chat?.hasMore || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const data = await request(navigate, `/with/${chat.student.id}?before=${chat.messages[0].message_id}`);
      restoreHeight.current = scrollRef.current ? scrollRef.current.scrollHeight : null;
      setChat((current) =>
        current
          ? { ...current, messages: [...data.messages, ...current.messages], hasMore: data.has_more }
          : current
      );
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  const onSend = async (e) => {
    if (e) e.preventDefault();

    const content = draft.trim();
    if (!content || sending || !chat || !chat.canMessage) return;

    setSending(true);
    setNotice("");

    try {
      const data = await request(navigate, `/with/${chat.student.id}`, {
        method: "POST",
        json: { content },
      });
      setDraft("");
      stickToBottom.current = true;
      applyMessage(data.message);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSending(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const toggleBlock = async () => {
    if (!chat) return;

    const blocking = !chat.blockedByMe;
    if (blocking && !window.confirm(`Block ${chat.student.name}? They won't be able to message you.`)) {
      return;
    }

    try {
      const data = await request(navigate, `/block/${chat.student.id}`, {
        method: blocking ? "POST" : "DELETE",
      });
      setChat((current) =>
        current ? { ...current, blockedByMe: data.blocked_by_me, canMessage: data.can_message } : current
      );
      setConversations((list) =>
        list
          ? list.map((c) =>
              c.other.id === chat.student.id
                ? { ...c, blocked_by_me: data.blocked_by_me, unread: data.blocked_by_me ? 0 : c.unread }
                : c
            )
          : list
      );
      window.dispatchEvent(new Event("messages:changed"));
      setNotice("");
    } catch (err) {
      setNotice(err.message);
    }
  };

  const Navbar = viewerPremium ? StudentNavbarPreminum : StudentNavbar;

  const renderMessages = () => {
    const items = [];
    let previous = null;
    let lastMineId = null;

    chat.messages.forEach((m) => {
      if (m.sender_id === me) lastMineId = m.message_id;
    });

    chat.messages.forEach((m) => {
      if (!previous || !sameDay(previous.created_at, m.created_at)) {
        items.push(
          <div key={`day-${m.message_id}`} className="my-3 flex justify-center">
            <span className="rounded-full bg-orange-100 px-3 py-0.5 text-[11px] font-medium text-orange-700">
              {dayLabel(m.created_at)}
            </span>
          </div>
        );
      }

      const mine = m.sender_id === me;

      items.push(
        <div key={m.message_id} className={`mb-1.5 flex flex-col ${mine ? "items-end" : "items-start"}`}>
          <div
            className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed [overflow-wrap:anywhere] ${
              mine
                ? "rounded-br-md bg-orange-500 text-white"
                : "rounded-bl-md border border-orange-100 bg-white text-stone-900"
            }`}
          >
            {m.content}
          </div>
          <div className="mt-0.5 px-1 text-[11px] text-stone-400">
            {formatTime(m.created_at)}
            {mine && m.message_id === lastMineId && m.read_at ? " · Seen" : ""}
          </div>
        </div>
      );

      previous = m;
    });

    return items;
  };

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900 [&_button]:font-[inherit] [&_input]:font-[inherit] [&_textarea]:font-[inherit]">
      <Navbar />

      <main className="mx-auto max-w-[1240px] px-5 py-6">
        <div className="flex h-[calc(100vh-140px)] min-h-[520px] overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <aside
            className={`${activeId ? "hidden md:flex" : "flex"} w-full min-w-0 flex-col border-r border-orange-100 md:w-[340px] md:shrink-0`}
          >
            <div className="border-b border-orange-100 p-4">
              <h1 className="m-0 mb-3 text-lg font-bold text-stone-900">Messages</h1>
              <StudentSearch
                placeholder="Find a student to message"
                onSelect={(student) => navigate(`/student/messages/${student.id}`)}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations === null ? (
                <p className="m-0 p-6 text-center text-sm text-stone-500">Loading conversations...</p>
              ) : listError && conversations.length === 0 ? (
                <p className="m-0 p-6 text-center text-sm text-red-600">{listError}</p>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="m-0 text-sm font-semibold text-stone-800">No messages yet</p>
                  <p className="m-0 mt-1 text-xs leading-relaxed text-stone-500">
                    Search for a student above, or open anyone&apos;s profile and click Message to say hello.
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.other.id}
                    type="button"
                    onClick={() => navigate(`/student/messages/${c.other.id}`)}
                    className={`flex w-full cursor-pointer items-center gap-3 border-0 border-b border-orange-50 px-4 py-3 text-left hover:bg-orange-50 ${
                      c.other.id === activeId ? "bg-orange-50" : "bg-white"
                    }`}
                  >
                    <Avatar name={c.other.name} src={c.other.profile_pic_url} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-stone-900">{c.other.name}</span>
                        <span className="shrink-0 text-[11px] text-stone-400">
                          {listTime(c.last_message.created_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs ${
                            c.unread > 0 ? "font-semibold text-stone-800" : "text-stone-500"
                          }`}
                        >
                          {c.blocked_by_me
                            ? "Blocked"
                            : `${c.last_message.sender_id === me ? "You: " : ""}${c.last_message.content}`}
                        </span>
                        {c.unread > 0 && (
                          <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                            {c.unread > 99 ? "99+" : c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className={`${activeId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
            {!activeId ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-500">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="m-0 text-base font-semibold text-stone-900">Your messages</h2>
                <p className="m-0 mt-1 max-w-xs text-sm text-stone-500">
                  Pick a conversation on the left, or search for a student to start a new one.
                </p>
              </div>
            ) : chatLoading || (!chat && !chatError) ? (
              <p className="m-auto text-sm text-stone-500">Loading conversation...</p>
            ) : chatError ? (
              <div className="m-auto p-6 text-center">
                <p className="m-0 mb-3 text-sm text-red-600">{chatError}</p>
                <button type="button" onClick={() => navigate("/student/messages")} className={btnOutline}>
                  Back to messages
                </button>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-orange-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigate("/student/messages")}
                    className="cursor-pointer border-0 bg-transparent p-1 text-lg leading-none text-stone-500 hover:text-stone-800 md:hidden"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                  <Avatar name={chat.student.name} src={chat.student.profile_pic_url} size={42} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/student/profile/${chat.student.id}`}
                      className="block truncate text-sm font-semibold text-stone-900 no-underline hover:underline"
                    >
                      {chat.student.name}
                    </Link>
                    {chat.student.headline && (
                      <div className="truncate text-xs text-stone-500">{chat.student.headline}</div>
                    )}
                  </div>
                  <Link to={`/student/profile/${chat.student.id}`} className={btnOutline}>
                    View profile
                  </Link>
                  <button type="button" onClick={toggleBlock} className={btnOutline}>
                    {chat.blockedByMe ? "Unblock" : "Block"}
                  </button>
                </header>

                <div
                  ref={scrollRef}
                  onScroll={onScroll}
                  className="flex-1 overflow-y-auto bg-orange-50/40 px-4 py-4"
                >
                  {chat.hasMore && (
                    <div className="mb-3 flex justify-center">
                      <button type="button" onClick={loadOlder} disabled={loadingOlder} className={btnOutline}>
                        {loadingOlder ? "Loading..." : "Load older messages"}
                      </button>
                    </div>
                  )}

                  {chat.messages.length === 0 ? (
                    <p className="m-0 mt-10 text-center text-sm text-stone-500">
                      No messages yet. Say hello to {chat.student.name.split(" ")[0]}!
                    </p>
                  ) : (
                    renderMessages()
                  )}
                </div>

                <div className="border-t border-orange-100 p-3">
                  {notice && <p className="m-0 mb-2 text-xs text-red-600">{notice}</p>}

                  {chat.canMessage ? (
                    <form onSubmit={onSend} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <textarea
                          ref={textareaRef}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={onKeyDown}
                          maxLength={MAX_LENGTH}
                          rows={2}
                          placeholder={`Message ${chat.student.name.split(" ")[0]}...`}
                          className="w-full resize-none rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                        <div className="mt-0.5 flex justify-between px-1 text-[11px] text-stone-400">
                          <span>Enter to send, Shift+Enter for a new line</span>
                          {draft.length > MAX_LENGTH - 200 && (
                            <span>
                              {draft.length}/{MAX_LENGTH}
                            </span>
                          )}
                        </div>
                      </div>
                      <button type="submit" disabled={sending || !draft.trim()} className={btnSolid}>
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </form>
                  ) : chat.blockedByMe ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-stone-600">
                      <span>You blocked {chat.student.name}. Unblock them to send a message.</span>
                      <button type="button" onClick={toggleBlock} className={btnOutline}>
                        Unblock
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-stone-600">
                      You can&apos;t reply to this conversation.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <p className="m-0 mt-3 text-center text-xs text-stone-400">
          Be respectful. You can block anyone who makes you uncomfortable.{" "}
          <Link to="/student" className={linkSmall}>
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Messages;