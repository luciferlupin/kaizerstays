"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  Phone,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";

type InteractionMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  kind: "NOTE" | "DRAFT";
};

type InteractionThread = {
  id: string;
  reservationId?: string;
  guestName: string;
  contact?: string;
  channel: "EMAIL" | "WHATSAPP" | "PHONE" | "OTA" | "INTERNAL";
  subject: string;
  status: "OPEN" | "RESOLVED";
  updatedAt: string;
  messages: InteractionMessage[];
};

const STORAGE_KEY = "kaizerstays_guest_interactions_v1";

function loadThreads(): InteractionThread[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function channelIcon(channel: InteractionThread["channel"]) {
  if (channel === "EMAIL") return <Mail size={15} />;
  if (channel === "PHONE") return <Phone size={15} />;
  return <MessageCircle size={15} />;
}

export default function MessagesClient() {
  const { reservations, currentUser, addActivity } = useAppState();
  const [threads, setThreads] = useState<InteractionThread[]>(loadThreads);
  const [selectedId, setSelectedId] = useState(() => loadThreads()[0]?.id || "");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newReservationId, setNewReservationId] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newChannel, setNewChannel] = useState<InteractionThread["channel"]>("PHONE");
  const [newSubject, setNewSubject] = useState("");
  const [composer, setComposer] = useState("");
  const [composerKind, setComposerKind] = useState<InteractionMessage["kind"]>("NOTE");

  const persist = (nextThreads: InteractionThread[]) => {
    setThreads(nextThreads);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextThreads));
  };

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) =>
      `${thread.guestName} ${thread.subject} ${thread.contact || ""}`.toLowerCase().includes(query)
    );
  }, [search, threads]);
  const selectedThread = threads.find((thread) => thread.id === selectedId) || filteredThreads[0];

  const chooseReservation = (reservationId: string) => {
    setNewReservationId(reservationId);
    const reservation = reservations.find((item) => item.id === reservationId);
    if (!reservation) return;
    setNewGuestName(reservation.guestName);
    setNewContact(reservation.guestPhone || reservation.guestEmail || "");
    setNewSubject(`Stay ${reservation.confirmationNumber}`);
    setNewChannel(reservation.bookingSource === "BOOKING_COM" || reservation.bookingSource === "AGODA" ? "OTA" : "PHONE");
  };

  const createThread = () => {
    if (!newGuestName.trim() || !newSubject.trim()) return;
    const now = new Date().toISOString();
    const thread: InteractionThread = {
      id: `thread_${Date.now()}`,
      reservationId: newReservationId || undefined,
      guestName: newGuestName.trim(),
      contact: newContact.trim() || undefined,
      channel: newChannel,
      subject: newSubject.trim(),
      status: "OPEN",
      updatedAt: now,
      messages: [],
    };
    persist([thread, ...threads]);
    setSelectedId(thread.id);
    setShowNew(false);
    setNewReservationId("");
    setNewGuestName("");
    setNewContact("");
    setNewSubject("");
    addActivity("Guest Interaction Opened", "message", thread.id, `${thread.guestName}: ${thread.subject}`);
  };

  const addMessage = () => {
    if (!selectedThread || !composer.trim()) return;
    const now = new Date().toISOString();
    const message: InteractionMessage = {
      id: `message_${Date.now()}`,
      author: currentUser?.name || "Hotel user",
      body: composer.trim(),
      createdAt: now,
      kind: composerKind,
    };
    const next = threads.map((thread) =>
      thread.id === selectedThread.id
        ? { ...thread, updatedAt: now, status: "OPEN" as const, messages: [...thread.messages, message] }
        : thread
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    persist(next);
    setComposer("");
    addActivity(
      composerKind === "DRAFT" ? "Guest Reply Drafted" : "Guest Interaction Noted",
      "message",
      selectedThread.id,
      `${selectedThread.guestName}: ${selectedThread.subject}`
    );
  };

  const toggleResolved = () => {
    if (!selectedThread) return;
    const status = selectedThread.status === "OPEN" ? "RESOLVED" : "OPEN";
    persist(threads.map((thread) => thread.id === selectedThread.id ? { ...thread, status, updatedAt: new Date().toISOString() } : thread));
    addActivity("Guest Interaction Updated", "message", selectedThread.id, `${selectedThread.subject} marked ${status.toLowerCase()}`);
  };

  const contactLink = selectedThread?.channel === "EMAIL" && selectedThread.contact
    ? `mailto:${selectedThread.contact}`
    : selectedThread?.channel === "WHATSAPP" && selectedThread.contact
      ? `https://wa.me/${selectedThread.contact.replace(/\D/g, "")}`
      : selectedThread?.channel === "PHONE" && selectedThread.contact
        ? `tel:${selectedThread.contact}`
        : "";

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}><MessageCircle size={25} className="text-primary" /> Guest Inbox</h1>
          <p className="page-description">Keep calls, emails, OTA follow-ups and reply drafts linked to each guest stay.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew((open) => !open)}><MessageSquarePlus size={16} /> New interaction</button>
      </div>

      <div className="card" style={{ padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px", borderColor: "rgba(255,149,0,.35)" }}>
        <ShieldAlert size={18} className="text-warning" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div className="text-sm"><strong>Safe interaction log.</strong> Notes and drafts are saved in this browser. External delivery and OTA inbox sync remain off until an approved email, WhatsApp or OTA messaging provider is connected.</div>
      </div>

      {showNew && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Start a guest interaction</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Link reservation (optional)</label>
              <select className="form-select" value={newReservationId} onChange={(event) => chooseReservation(event.target.value)}>
                <option value="">Unlinked interaction</option>
                {reservations.filter((reservation) => reservation.status !== "CANCELLED").map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.guestName} · {reservation.confirmationNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select className="form-select" value={newChannel} onChange={(event) => setNewChannel(event.target.value as InteractionThread["channel"])}>
                <option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="OTA">OTA portal</option><option value="INTERNAL">Internal</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Guest name *</label><input className="form-input" value={newGuestName} onChange={(event) => setNewGuestName(event.target.value)} /></div>
            <div className="form-group"><label className="form-label">Contact</label><input className="form-input" placeholder="Phone or email" value={newContact} onChange={(event) => setNewContact(event.target.value)} /></div>
            <div className="form-group"><label className="form-label">Subject *</label><input className="form-input" placeholder="Late arrival, airport pickup…" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createThread} disabled={!newGuestName.trim() || !newSubject.trim()}>Create interaction</button>
          </div>
        </div>
      )}

      <div className="card guest-inbox-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 34%) 1fr", minHeight: "560px", overflow: "hidden" }}>
        <aside style={{ borderRight: "1px solid var(--color-border)", minWidth: 0 }}>
          <div style={{ padding: "14px", borderBottom: "1px solid var(--color-border)", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "26px", top: "25px", color: "var(--color-text-tertiary)" }} />
            <input className="form-input" placeholder="Search guest or subject" value={search} onChange={(event) => setSearch(event.target.value)} style={{ paddingLeft: "34px" }} />
          </div>
          {filteredThreads.length === 0 ? (
            <div style={{ padding: "42px 22px", textAlign: "center" }}><MessageCircle size={28} className="text-tertiary" style={{ margin: "0 auto 10px" }} /><div className="font-semibold text-sm">No guest interactions yet</div><p className="text-xs text-secondary" style={{ marginTop: "4px" }}>Create one after a call, email, OTA follow-up or shift handover.</p></div>
          ) : filteredThreads.map((thread) => (
            <button key={thread.id} onClick={() => setSelectedId(thread.id)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", border: 0, borderBottom: "1px solid var(--color-border-subtle)", background: selectedThread?.id === thread.id ? "var(--color-primary-light)" : "white", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}><span className="font-semibold text-sm">{thread.guestName}</span><span className={`badge ${thread.status === "OPEN" ? "badge-warning" : "badge-success"}`}>{thread.status}</span></div>
              <div className="text-xs text-secondary" style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "5px" }}>{channelIcon(thread.channel)} {thread.channel} · {thread.subject}</div>
            </button>
          ))}
        </aside>

        <section style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          {!selectedThread ? (
            <div style={{ margin: "auto", textAlign: "center", padding: "30px" }}><MessageCircle size={34} className="text-tertiary" style={{ margin: "0 auto 10px" }} /><h3 style={{ fontSize: "16px" }}>Select or create an interaction</h3></div>
          ) : (
            <>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div><h3 style={{ fontSize: "16px", fontWeight: 700 }}>{selectedThread.subject}</h3><div className="text-xs text-secondary">{selectedThread.guestName} · {selectedThread.contact || "No contact saved"}</div></div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {contactLink && <a className="btn btn-secondary btn-sm" href={contactLink} target={selectedThread.channel === "WHATSAPP" ? "_blank" : undefined} rel="noreferrer"><ExternalLink size={14} /> Open {selectedThread.channel.toLowerCase()}</a>}
                  <button className="btn btn-secondary btn-sm" onClick={toggleResolved}><CheckCircle2 size={14} /> {selectedThread.status === "OPEN" ? "Resolve" : "Reopen"}</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", background: "var(--color-bg-secondary)" }}>
                {selectedThread.messages.length === 0 ? <p className="text-sm text-secondary" style={{ textAlign: "center", marginTop: "60px" }}>No notes or drafts in this interaction.</p> : selectedThread.messages.map((message) => (
                  <div key={message.id} className="card" style={{ padding: "14px", marginBottom: "10px", maxWidth: "78%", marginLeft: message.kind === "DRAFT" ? "auto" : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}><span className={`badge ${message.kind === "DRAFT" ? "badge-info" : "badge-default"}`}>{message.kind === "DRAFT" ? "REPLY DRAFT" : "INTERACTION NOTE"}</span><span className="text-xs text-secondary">{new Date(message.createdAt).toLocaleString("en-IN")}</span></div>
                    <p className="text-sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{message.body}</p><div className="text-xs text-secondary" style={{ marginTop: "7px" }}>{message.author}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 16px", borderTop: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", gap: "14px", marginBottom: "8px" }}>
                  <label className="text-xs"><input type="radio" checked={composerKind === "NOTE"} onChange={() => setComposerKind("NOTE")} /> Interaction note</label>
                  <label className="text-xs"><input type="radio" checked={composerKind === "DRAFT"} onChange={() => setComposerKind("DRAFT")} /> Reply draft</label>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}><textarea className="form-textarea" rows={3} placeholder={composerKind === "DRAFT" ? "Write a reply to copy into the connected channel…" : "Record what the guest said and the action taken…"} value={composer} onChange={(event) => setComposer(event.target.value)} /><button className="btn btn-primary" onClick={addMessage} disabled={!composer.trim()}><Send size={16} /> Save</button></div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
