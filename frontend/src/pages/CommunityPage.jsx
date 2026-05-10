import { Heart, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { communityAPI } from "../services/api";

export default function CommunityPage() {
  const { trips, communityPosts, refreshCommunity } = useTrips();
  const { showToast } = useToast();
  const [posts, setPosts] = useState(communityPosts);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ trip_id: "", title: "", body: "", tags: "" });

  const load = async () => {
    const response = await communityAPI.getAll({ search, sort });
    setPosts(response.data.posts || []);
  };

  useEffect(() => {
    load().catch(() => null);
  }, []);

  const createPost = async (event) => {
    event.preventDefault();
    await communityAPI.create({ ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
    showToast("success", "Trip shared to community");
    setModal(false);
    setForm({ trip_id: "", title: "", body: "", tags: "" });
    await refreshCommunity();
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Community"
        title="Public trip inspiration"
        description="Share a trip, let others browse it, and surface the best journeys from the community feed."
        action={<Button icon={<Plus size={16} />} onClick={() => { setForm({ ...form, trip_id: trips.find((trip) => trip.is_public)?.id || "" }); setModal(true); }}>Share my trip</Button>}
      />
      <div className="traveloop-card mb-6 grid gap-3 p-4 lg:grid-cols-[1fr_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-traveloop-muted" size={18} />
          <input className="traveloop-input pl-10" placeholder="Search posts" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="traveloop-input" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Recent</option>
          <option value="popular">Popular</option>
        </select>
        <Button onClick={load} variant="secondary">Apply</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {(posts.length > 0
          ? posts
          : [
              {
                title: "No public posts yet",
                body: "Create one from the backend-enabled flow once auth is wired.",
              },
            ]
        ).map((post) => (
          <article key={post.id || post.title} className="traveloop-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-traveloop-clay">
              {post.trip_name || "Featured trip"}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-traveloop-midnight">
              {post.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-traveloop-midnight/70">
              {post.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(post.tags || []).map((tag) => <Badge key={tag} tone="sand">{tag}</Badge>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button icon={<Heart size={16} />} onClick={async () => {
                if (post.id) {
                  await communityAPI.like(post.id);
                  await load();
                }
              }} variant="secondary">{post.likes_count || 0}</Button>
              {post.public_slug ? <Link className="traveloop-button-primary" to={`/share/${post.public_slug}`}>View full trip</Link> : null}
            </div>
          </article>
        ))}
      </div>
      <Modal open={modal} title="Share a public trip" onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={createPost}>
          <select className="traveloop-input" required value={form.trip_id} onChange={(event) => setForm({ ...form, trip_id: event.target.value })}>
            <option value="">Select public trip</option>
            {trips.filter((trip) => trip.is_public).map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
          <input className="traveloop-input" required placeholder="Post title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea className="traveloop-input" required rows="4" placeholder="What makes this plan useful?" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
          <input className="traveloop-input" placeholder="Tags, comma separated" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <Button type="submit">Publish post</Button>
        </form>
      </Modal>
    </div>
  );
}
