import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentNavbar from "../Student_Components/StudentNavbar";
import StudentNavbarPreminum from "../Student_Components/StudentNavbarPreminum";
import { Avatar, assetUrl, linkSmall } from "../Student_Components/shared";
import { API_URL } from "../../api";
import { closeSocket } from "../../socketclient";

const MAX_LENGTH = 2000;
const PREVIEW_LENGTH = 320;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const request = async (navigate, path, { method = "GET", body } = {}) => {
  let res;
  try {
    res = await fetch(`${API_URL}/api/posts${path}`, {
      method,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body,
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

  if (!res.ok) {
    throw new Error(
      data.message ||
        (res.status === 404
          ? "The server does not have the post routes yet. Update the backend files and restart it."
          : `Request failed (${res.status})`)
    );
  }

  return data;
};

const timeAgo = (value) => {
  const seconds = Math.floor((new Date() - new Date(value)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const btnSolid =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-500 bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-block cursor-pointer whitespace-nowrap rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";

function HeartIcon({ filled }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PostCard({ post, onLike, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const isLong = post.content.length > PREVIEW_LENGTH;
  const text =
    isLong && !expanded ? `${post.content.slice(0, PREVIEW_LENGTH).trimEnd()}...` : post.content;

  return (
    <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <Link to={`/student/profile/${post.author.id}`} className="shrink-0">
          <Avatar name={post.author.name} src={post.author.profile_pic_url} size={44} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/student/profile/${post.author.id}`}
            className="block truncate text-sm font-semibold text-stone-900 no-underline hover:underline"
          >
            {post.author.name}
          </Link>
          {post.author.headline && (
            <div className="truncate text-xs text-stone-500">{post.author.headline}</div>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span>{timeAgo(post.created_at)}</span>
            {post.is_mine && post.status === "pending" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Pending review
              </span>
            )}
            {post.is_mine && post.status === "rejected" && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">
                Not approved
              </span>
            )}
          </div>
        </div>

        {post.is_mine && (
          <button
            type="button"
            onClick={() => onDelete(post)}
            className="cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-medium text-stone-400 hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </header>

      {text && (
        <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-800 [overflow-wrap:anywhere]">
          {text}
        </p>
      )}

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          {expanded ? "Show less" : "See more"}
        </button>
      )}

      {post.image_url && (
        <img
          src={assetUrl(post.image_url)}
          alt="Attached to the post"
          className="mt-3 block max-h-[480px] w-full rounded-xl border border-orange-100 bg-stone-50 object-contain"
        />
      )}

      <footer className="mt-4 flex items-center justify-between border-t border-orange-100 pt-3">
        <button
          type="button"
          onClick={() => onLike(post)}
          aria-pressed={post.liked_by_me}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm font-semibold transition-colors ${
            post.liked_by_me ? "text-orange-600" : "text-stone-500 hover:bg-orange-50 hover:text-orange-600"
          }`}
        >
          <HeartIcon filled={post.liked_by_me} />
          {post.liked_by_me ? "Liked" : "Like"}
        </button>
        <span className="text-xs text-stone-500">
          {post.like_count} {post.like_count === 1 ? "like" : "likes"}
        </span>
      </footer>
    </article>
  );
}

const Post = () => {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [viewer, setViewer] = useState(null);
  const [scope, setScope] = useState("all");
  const [posts, setPosts] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    setPosts(null);
    setLoadError("");

    request(navigate, `?scope=${scope}`)
      .then((data) => {
        if (cancelled) return;
        setViewer(data.viewer);
        setPosts(data.posts);
        setHasMore(data.has_more);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [scope, reloadKey, navigate]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.preview);
    };
  }, [image]);

  const Navbar = viewer?.is_premium ? StudentNavbarPreminum : StudentNavbar;

  const patchPost = (postId, changes) => {
    setPosts((current) =>
      current ? current.map((p) => (p.post_id === postId ? { ...p, ...changes } : p)) : current
    );
  };

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setNotice({ type: "error", text: "Please choose a JPG, PNG or WebP image" });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setNotice({ type: "error", text: "The image must be 3 MB or smaller" });
      return;
    }

    setImage({ file, preview: URL.createObjectURL(file) });
  };

  const submitPost = async (e) => {
    if (e) e.preventDefault();

    const content = draft.trim();
    if ((!content && !image) || posting) return;

    setPosting(true);

    try {
      const body = new FormData();
      body.append("content", content);
      if (image) body.append("file", image.file);

      const data = await request(navigate, "", { method: "POST", body });

      setDraft("");
      setImage(null);
      setPosts((current) => {
        if (!current) return current;
        if (data.post.status !== "approved" && scope === "all") return current;
        return [data.post, ...current];
      });
      setNotice({ type: "ok", text: data.message });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setPosting(false);
    }
  };

  const onComposerKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitPost();
    }
  };

  const toggleLike = async (post) => {
    const nextLiked = !post.liked_by_me;

    patchPost(post.post_id, {
      liked_by_me: nextLiked,
      like_count: Math.max(0, post.like_count + (nextLiked ? 1 : -1)),
    });

    try {
      const data = await request(navigate, `/${post.post_id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
      patchPost(post.post_id, { liked_by_me: data.liked, like_count: data.like_count });
    } catch (err) {
      patchPost(post.post_id, { liked_by_me: post.liked_by_me, like_count: post.like_count });
      setNotice({ type: "error", text: err.message });
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;

    try {
      await request(navigate, `/${post.post_id}`, { method: "DELETE" });
      setPosts((current) => (current ? current.filter((p) => p.post_id !== post.post_id) : current));
      setNotice({ type: "ok", text: "Post deleted" });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  };

  const loadMore = async () => {
    if (!posts || posts.length === 0 || loadingMore) return;

    setLoadingMore(true);

    try {
      const data = await request(navigate, `?scope=${scope}&before=${posts[posts.length - 1].post_id}`);
      setPosts((current) => {
        const seen = new Set(current.map((p) => p.post_id));
        return [...current, ...data.posts.filter((p) => !seen.has(p.post_id))];
      });
      setHasMore(data.has_more);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setLoadingMore(false);
    }
  };

  const firstName = viewer ? viewer.name.split(" ")[0] : "";
  const canPost = (draft.trim().length > 0 || image) && !posting;

  return (
    <div className="min-h-screen bg-orange-50 text-stone-900 [&_button]:font-[inherit] [&_textarea]:font-[inherit]">
      <Navbar />

      {notice && (
        <div
          role="status"
          className={`fixed right-5 top-20 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            notice.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-6">
        <Link to="/student" className={linkSmall}>
          ← Back to home
        </Link>
        <h1 className="m-0 mt-2 text-2xl font-bold text-stone-900">Posts</h1>
        <p className="m-0 mb-5 mt-1 text-sm text-stone-500">
          Share tips, wins and questions with other CodeQuest students.
        </p>

        <form
          onSubmit={submitPost}
          className="mb-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
        >
          <div className="flex gap-3">
            {viewer && <Avatar name={viewer.name} src={viewer.profile_pic_url} size={44} />}
            <div className="min-w-0 flex-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onComposerKeyDown}
                maxLength={MAX_LENGTH}
                rows={3}
                placeholder={firstName ? `What's on your mind, ${firstName}?` : "What's on your mind?"}
                className="w-full resize-none rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />

              {image && (
                <div className="relative mt-3 inline-block">
                  <img
                    src={image.preview}
                    alt="Selected to upload"
                    className="block max-h-56 max-w-full rounded-xl border border-orange-100 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    aria-label="Remove photo"
                    className="absolute -right-2 -top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-orange-200 bg-white p-0 text-sm leading-none text-stone-600 shadow hover:bg-orange-50"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPickImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={posting}
                    className={btnOutline}
                  >
                    Add photo
                  </button>
                  <span className="text-xs text-stone-400">
                    {draft.length}/{MAX_LENGTH}
                  </span>
                </div>
                <button type="submit" disabled={!canPost} className={btnSolid}>
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
              <p className="m-0 mt-2 text-[11px] text-stone-400">Ctrl+Enter to post</p>
            </div>
          </div>
        </form>

        <div className="mb-4 flex gap-2">
          {[
            { key: "all", label: "All posts" },
            { key: "mine", label: "My posts" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScope(tab.key)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold ${
                scope === tab.key
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-orange-200 bg-white text-stone-600 hover:bg-orange-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <p className="m-0 mb-3 text-sm text-red-600">{loadError}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className={btnOutline}>
              Try again
            </button>
          </div>
        ) : posts === null ? (
          <p className="py-16 text-center text-sm text-stone-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
            <p className="m-0 text-sm font-semibold text-stone-800">
              {scope === "all" ? "No posts yet" : "You haven't posted yet"}
            </p>
            <p className="m-0 mt-1 text-xs text-stone-500">
              {scope === "all"
                ? "Be the first to share something with the community."
                : "Write your first post above."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.post_id} post={post} onLike={toggleLike} onDelete={deletePost} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button type="button" onClick={loadMore} disabled={loadingMore} className={btnOutline}>
                  {loadingMore ? "Loading..." : "Load more posts"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Post;