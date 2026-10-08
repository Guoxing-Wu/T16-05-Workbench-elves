import { useState } from "react";
import {
  BookOpen,
  FileText,
  MapPin,
  RefreshCw,
  User,
} from "lucide-react";
import "./Sidebar.css";

// A pool of writing-related quotes for the daily inspiration card.
const INSPIRATION_QUOTES = [
  "The ordinary moments are where the stories live.",
  "Write the story only you can tell.",
  "First drafts are just you telling yourself the story.",
  "A character is what they do, not what they say.",
  "The scariest moment is always just before you start.",
  "You can always edit a bad page. You can't edit a blank one.",
  "Details are not the story — they make the story real.",
  "Every secret has a price. Every story has a witness.",
  "The best endings feel both surprising and inevitable.",
  "Write drunk, edit sober — but mostly, just write.",
];

// The sticky note at the top: a personal signature that can be edited by double-clicking.
function SignatureNote() {
  const [signature, setSignature] = useState(
    "Stories are like secret drawers — full of things we forgot we knew."
  );
  const [author, setAuthor] = useState("from Imbi's notebook");
  const [editing, setEditing] = useState<"signature" | "author" | null>(null);

  return (
    <div className="sticky-note">
      <span className="sticky-note-tape" />
      {editing === "signature" ? (
        <textarea
          className="sticky-note-edit"
          value={signature}
          autoFocus
          onChange={(e) => setSignature(e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setEditing(null);
            }
          }}
        />
      ) : (
        <p className="sticky-note-text" onDoubleClick={() => setEditing("signature")}>
          {signature}
        </p>
      )}
      {editing === "author" ? (
        <input
          className="sticky-note-author-edit"
          value={author}
          autoFocus
          onChange={(e) => setAuthor(e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(null);
          }}
        />
      ) : (
        <p className="sticky-note-author" onDoubleClick={() => setEditing("author")}>
          — {author}
        </p>
      )}
    </div>
  );
}
// Placeholder for the recently viewed list — static data for now, real tracking comes later.
function RecentlyViewed() {
  const items = [
    { icon: FileText, title: "Chapter 18", subtitle: "The Phone Call", time: "2h ago" },
    { icon: User, title: "Samantha", subtitle: "Character profile", time: "5h ago" },
    { icon: MapPin, title: "Nicole leaves", subtitle: "Perth, 1897", time: "Yesterday" },
    { icon: MapPin, title: "Melbourne", subtitle: "Location", time: "2 days ago" },
  ];

  return (
    <section className="right-panel-section">
      <div className="right-panel-header">
        <h3>RECENTLY VIEWED</h3>
        <span>{items.length} items</span>
      </div>
      <div className="recent-list">
        {items.map((item, i) => (
          <div key={i} className="recent-item">
            <div className={`recent-item-icon color-${i % 4}`}>
              <item.icon size={15} strokeWidth={1.8} />
            </div>
            <div className="recent-item-info">
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </div>
            <span className="recent-item-time">{item.time}</span>
          </div>
        ))}
      </div>
      <button type="button" className="view-all-link">
        View all <span>→</span>
      </button>
    </section>
  );
}

// Shows a random writing quote, with a refresh button to pick a new one.
function DailyInspiration() {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * INSPIRATION_QUOTES.length)
  );

  const refresh = () => {
    let next = Math.floor(Math.random() * INSPIRATION_QUOTES.length);
    // Avoid picking the same quote twice in a row.
    if (next === quoteIndex && INSPIRATION_QUOTES.length > 1) {
      next = (next + 1) % INSPIRATION_QUOTES.length;
    }
    setQuoteIndex(next);
  };

  return (
    <section className="right-panel-section inspiration-card">
      <div className="right-panel-header">
        <h3>
          <span className="inspiration-sparkle">✦</span> DAILY INSPIRATION
        </h3>
        <button
          type="button"
          className="refresh-btn"
          onClick={refresh}
          title="New quote"
        >
          <RefreshCw size={13} strokeWidth={2} />
        </button>
      </div>
      <blockquote className="inspiration-quote">
        "{INSPIRATION_QUOTES[quoteIndex]}"
      </blockquote>
      <div className="inspiration-footer">
        <BookOpen size={22} strokeWidth={1.3} />
        <div className="inspiration-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

// The right sidebar: signature note, recently viewed, and daily inspiration.
export function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <SignatureNote />
      <RecentlyViewed />
      <DailyInspiration />
    </aside>
  );
}
