// DuoMate Realtime Multi-Device Cloud Sync Engine
// Connects Aadhavan (Phone & Laptop) and Narmatha (Phone & Laptop) across the internet

const DEFAULT_SYNC_TOPIC = "duomate_sync_aadhavan_narmatha_vlsi";

export type SyncEventType =
  | "TASKS_SYNC"
  | "NOTEPAD_SYNC"
  | "NOTES_LIST_SYNC"
  | "CHAT_MESSAGE"
  | "CALENDAR_SYNC"
  | "CHECKLIST_SYNC"
  | "TIMER_SYNC"
  | "ROADMAP_SYNC"
  | "SYNC_REQUEST"
  | "SYNC_RESPONSE";

export interface SyncPayload<T = any> {
  type: SyncEventType;
  payload: T;
  senderDeviceId: string;
  senderName: string;
  timestamp: number;
}

export type CloudSyncStatus = "connected" | "connecting" | "offline";

let eventSource: EventSource | null = null;
let currentStatus: CloudSyncStatus = "connecting";
const statusListeners = new Set<(status: CloudSyncStatus) => void>();

export function getSyncTopic(): string {
  if (typeof window === "undefined") return DEFAULT_SYNC_TOPIC;
  return localStorage.getItem("duomate_sync_topic") || DEFAULT_SYNC_TOPIC;
}

export function setSyncTopic(topic: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("duomate_sync_topic", topic.trim().toLowerCase());
    initCloudSync(); // Re-connect with new topic
  }
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "dev_server";
  let id = localStorage.getItem("duomate_device_id");
  if (!id) {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    id = `dev_${isMobile ? "mobile" : "pc"}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("duomate_device_id", id);
  }
  return id;
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return currentStatus;
}

export function subscribeCloudSyncStatus(cb: (status: CloudSyncStatus) => void): () => void {
  statusListeners.add(cb);
  cb(currentStatus);
  return () => statusListeners.delete(cb);
}

function updateStatus(newStatus: CloudSyncStatus) {
  currentStatus = newStatus;
  statusListeners.forEach((fn) => fn(newStatus));
}

/**
 * Broadcast an update to all other devices across the internet
 */
export async function broadcastCloudSync(type: SyncEventType, payload: any) {
  if (typeof window === "undefined") return;

  const activeUser = localStorage.getItem("duomate_active_user") || "Partner";
  const messageData: SyncPayload = {
    type,
    payload,
    senderDeviceId: getDeviceId(),
    senderName: activeUser === "aadhavan" ? "Aadhavan" : "Narmatha",
    timestamp: Date.now(),
  };

  const topic = getSyncTopic();
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        Title: "DuoMate Cloud Sync",
        Priority: "default",
      },
      body: JSON.stringify(messageData),
    });
  } catch (err) {
    console.warn("Cloud sync broadcast failed:", err);
  }
}

/**
 * Handles incoming sync event and updates local storage & triggers local UI re-renders
 */
function handleIncomingSync(data: SyncPayload) {
  if (!data || data.senderDeviceId === getDeviceId()) return;

  switch (data.type) {
    case "TASKS_SYNC":
      if (Array.isArray(data.payload)) {
        localStorage.setItem("duomate_tasks", JSON.stringify(data.payload));
        window.dispatchEvent(new Event("duomate_task_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "NOTEPAD_SYNC":
      if (data.payload && typeof data.payload === "object") {
        if (data.payload.text !== undefined) {
          localStorage.setItem("duomate_shared_notepad", data.payload.text);
        }
        if (data.payload.meta) {
          localStorage.setItem("duomate_shared_notepad_meta", JSON.stringify(data.payload.meta));
        }
        window.dispatchEvent(new Event("duomate_notes_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "NOTES_LIST_SYNC":
      if (Array.isArray(data.payload)) {
        localStorage.setItem("duomate_shared_notes_list", JSON.stringify(data.payload));
        window.dispatchEvent(new Event("duomate_notes_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "CHAT_MESSAGE":
      if (data.payload && data.payload.id) {
        try {
          const raw = localStorage.getItem("duomate_chat_messages") || "[]";
          const msgs = JSON.parse(raw);
          if (!msgs.some((m: any) => m.id === data.payload.id)) {
            msgs.push(data.payload);
            localStorage.setItem("duomate_chat_messages", JSON.stringify(msgs));
            window.dispatchEvent(new Event("duomate_chat_updated"));
            window.dispatchEvent(new Event("storage"));
          }
        } catch {}
      }
      break;

    case "CALENDAR_SYNC":
      if (Array.isArray(data.payload)) {
        localStorage.setItem("duomate_calendar_events", JSON.stringify(data.payload));
        window.dispatchEvent(new Event("duomate_calendar_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "CHECKLIST_SYNC":
      if (data.payload && data.payload.user && Array.isArray(data.payload.items)) {
        localStorage.setItem(
          `duomate_checklist_${data.payload.user}`,
          JSON.stringify(data.payload.items)
        );
        window.dispatchEvent(new Event("duomate_checklist_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "TIMER_SYNC":
      if (data.payload && data.payload.id) {
        try {
          const raw = localStorage.getItem("duomate_study_sessions") || "[]";
          const sessions = JSON.parse(raw);
          if (!sessions.some((s: any) => s.id === data.payload.id)) {
            sessions.unshift(data.payload);
            localStorage.setItem("duomate_study_sessions", JSON.stringify(sessions));
            window.dispatchEvent(new Event("duomate_timer_updated"));
            window.dispatchEvent(new Event("storage"));
          }
        } catch {}
      }
      break;

    case "ROADMAP_SYNC":
      if (data.payload && data.payload.key && data.payload.progress) {
        localStorage.setItem(data.payload.key, JSON.stringify(data.payload.progress));
        window.dispatchEvent(new Event("duomate_roadmap_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      break;

    case "SYNC_REQUEST":
      // A peer device requested a full state sync; send back our current local snapshot
      sendFullCloudSnapshot();
      break;

    case "SYNC_RESPONSE":
      if (data.payload && typeof data.payload === "object") {
        applyFullSnapshot(data.payload);
      }
      break;
  }
}

/**
 * Builds and broadcasts a complete snapshot of all workspace data
 */
export function sendFullCloudSnapshot() {
  if (typeof window === "undefined") return;

  const snapshot: Record<string, any> = {};
  const keys = [
    "duomate_tasks",
    "duomate_shared_notepad",
    "duomate_shared_notepad_meta",
    "duomate_shared_notes_list",
    "duomate_chat_messages",
    "duomate_calendar_events",
    "duomate_checklist_aadhavan",
    "duomate_checklist_narmatha",
    "duomate_study_sessions",
    "duomate_roadmap_gate_aadhavan",
    "duomate_roadmap_gate_narmatha",
    "duomate_roadmap_vlsi_aadhavan",
    "duomate_roadmap_vlsi_narmatha",
  ];

  keys.forEach((k) => {
    const val = localStorage.getItem(k);
    if (val) {
      try {
        snapshot[k] = JSON.parse(val);
      } catch {
        snapshot[k] = val;
      }
    }
  });

  // Only broadcast if we actually have some data
  if (Object.keys(snapshot).length > 0) {
    broadcastCloudSync("SYNC_RESPONSE", snapshot);
  }
}

/**
 * Applies a full snapshot from a peer into this device's storage
 */
function applyFullSnapshot(snapshot: Record<string, any>) {
  let changed = false;
  Object.entries(snapshot).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      const strVal = typeof val === "string" ? val : JSON.stringify(val);
      const existing = localStorage.getItem(key);
      if (existing !== strVal) {
        localStorage.setItem(key, strVal);
        changed = true;
      }
    }
  });

  if (changed) {
    window.dispatchEvent(new Event("duomate_task_updated"));
    window.dispatchEvent(new Event("duomate_notes_updated"));
    window.dispatchEvent(new Event("duomate_chat_updated"));
    window.dispatchEvent(new Event("duomate_calendar_updated"));
    window.dispatchEvent(new Event("duomate_checklist_updated"));
    window.dispatchEvent(new Event("duomate_timer_updated"));
    window.dispatchEvent(new Event("duomate_roadmap_updated"));
    window.dispatchEvent(new Event("storage"));
  }
}

/**
 * Request full state from active peers across the cloud
 */
export function requestFullCloudSync() {
  broadcastCloudSync("SYNC_REQUEST", { requestedAt: Date.now() });
}

/**
 * Initialize real-time cloud sync listener via Server-Sent Events (SSE)
 */
export function initCloudSync() {
  if (typeof window === "undefined") return;

  if (eventSource) {
    try {
      eventSource.close();
    } catch {}
    eventSource = null;
  }

  const topic = getSyncTopic();
  updateStatus("connecting");

  // 1. First, poll recent messages to catch up on any updates while offline
  fetch(`https://ntfy.sh/${topic}/json?poll=1`)
    .then((res) => res.text())
    .then((text) => {
      const lines = text.trim().split("\n");
      lines.forEach((line) => {
        if (!line.trim()) return;
        try {
          const item = JSON.parse(line);
          if (item && item.message) {
            const data: SyncPayload = JSON.parse(item.message);
            handleIncomingSync(data);
          }
        } catch {}
      });
      // After processing backlog, ask active peers for latest state
      requestFullCloudSync();
    })
    .catch(() => {});

  // 2. Open live real-time SSE stream
  try {
    eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);

    eventSource.onopen = () => {
      updateStatus("connected");
    };

    eventSource.onmessage = (event) => {
      if (!event.data) return;
      try {
        const item = JSON.parse(event.data);
        if (item && item.message) {
          const data: SyncPayload = JSON.parse(item.message);
          handleIncomingSync(data);
        }
      } catch (err) {
        console.warn("Error parsing sync message:", err);
      }
    };

    eventSource.onerror = () => {
      updateStatus("offline");
    };
  } catch (err) {
    console.warn("Failed to initialize SSE EventSource:", err);
    updateStatus("offline");
  }
}
