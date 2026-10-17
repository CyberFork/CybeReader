import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  Document,
  ReadingProgress,
  Bookmark,
  Settings,
  SpeedReaderState,
} from "../types";
import {
  loadDocuments,
  importDocument,
  deleteDocument,
} from "../services/fileManager";
import {
  loadAllProgress,
  updateProgress,
  removeProgress,
} from "../services/progressManager";
import { chunkText, indexAt, clamp } from "../utils/reading";
const DEFAULT_SETTINGS: Settings = {
  fontSize: 18,
  fontColor: "#d9eef5",
  backgroundColor: "#09151d",
  highlightColor: "#214f5b",
  speedReaderWindowWidth: 5,
  speedReaderPlaybackSpeed: 2,
};
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function normalizeSettings(s: Settings): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    fontSize: clamp(s.fontSize, 12, 32, 18),
    speedReaderWindowWidth: Math.floor(
      clamp(s.speedReaderWindowWidth, 1, 20, 5),
    ),
    speedReaderPlaybackSpeed: clamp(s.speedReaderPlaybackSpeed, 0.5, 20, 2),
  };
}
function useAppState() {
  const [documents, setDocuments] = useState<Document[]>(loadDocuments);
  const [currentDocument, setDocument] = useState<Document | null>(null);
  const [readingProgress, setReadingProgress] =
    useState<Record<string, ReadingProgress>>(loadAllProgress);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const data = stored<unknown>("speed_reader_bookmarks", []);
    return Array.isArray(data) ? data : [];
  });
  const [settings, setSettings] = useState<Settings>(() =>
    normalizeSettings(stored("speed_reader_settings", DEFAULT_SETTINGS)),
  );
  const [position, setPosition] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const segments = useMemo(
    () =>
      chunkText(
        currentDocument?.content || "",
        settings.speedReaderWindowWidth,
      ),
    [currentDocument?.content, settings.speedReaderWindowWidth],
  );
  const chunks = useMemo(() => segments.map((c) => c.text), [segments]);
  const currentIndex = indexAt(segments, position);
  const speedReaderState: SpeedReaderState = {
    isPlaying,
    currentIndex,
    chunks,
  };
  const setSpeedReaderState = (
    action: SpeedReaderState | ((prev: SpeedReaderState) => SpeedReaderState),
  ) => {
    const next =
      typeof action === "function" ? action(speedReaderState) : action;
    const index = Math.floor(
      clamp(next.currentIndex, 0, Math.max(0, chunks.length - 1), 0),
    );
    setPosition(index === currentIndex ? position : segments[index]?.start || 0);
    setPlaying(Boolean(next.isPlaying && chunks.length));
  };
  const pendingProgress = useRef<{ id: string; position: number } | null>(null);
  const flush = () => {
    const value = pendingProgress.current;
    if (value) {
      updateProgress(value.id, value.position);
      pendingProgress.current = null;
    }
  };
  const setCurrentDocument = (doc: Document | null) => {
    flush();
    setPlaying(false);
    setDocument(doc);
    setPosition(doc ? loadAllProgress()[doc.id]?.position || 0 : 0);
  };
  // A single timer owns playback. No callback-induced interval resets or duplicate readers.
  useEffect(() => {
    if (!isPlaying || !segments.length) return;
    const timer = window.setTimeout(() => {
      if (currentIndex >= segments.length - 1) setPlaying(false);
      else setPosition(segments[currentIndex + 1].start);
    }, 1000 / settings.speedReaderPlaybackSpeed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentIndex, segments, settings.speedReaderPlaybackSpeed]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  const updateReadingPosition = useCallback((id: string, next: number) => {
    updateProgress(id, next);
    setReadingProgress((prev) => ({
      ...prev,
      [id]: { documentId: id, position: next, lastReadAt: Date.now() },
    }));
  }, []);
  // Update a tiny ref per frame; batch durable writes and flush when leaving.
  useEffect(() => {
    if (currentDocument)
      pendingProgress.current = {
        id: currentDocument.id,
        position,
      };
  }, [currentDocument?.id, position]);
  useEffect(() => {
    const timer = window.setInterval(flush, 500);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  const persist = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      setNotice(
        "浏览器存储不可用或空间不足：本次更改仅保留在当前会话，请导出备份。",
      );
    }
  };
  const importDocumentFile = async (file: File, initialPosition = 0) => {
    const doc = await importDocument(file);
    setDocuments((prev) => [...prev, doc]);
    setCurrentDocument(doc);
    setPosition(Math.floor(clamp(initialPosition, 0, Math.max(0, doc.content.length - 1), 0)));
    setNotice("");
  };
  const removeDocument = (id: string) => {
    deleteDocument(id);
    if (pendingProgress.current?.id === id) pendingProgress.current = null;
    removeProgress(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (currentDocument?.id === id) setCurrentDocument(null);
    const next = bookmarks.filter((b) => b.documentId !== id);
    setBookmarks(next);
    persist("speed_reader_bookmarks", next);
  };
  const addBookmark = (bookmark: Omit<Bookmark, "id" | "createdAt">) => {
    const next = [
      ...bookmarks,
      { ...bookmark, id: crypto.randomUUID(), createdAt: Date.now() },
    ];
    setBookmarks(next);
    persist("speed_reader_bookmarks", next);
  };
  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
    const next = bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBookmarks(next);
    persist("speed_reader_bookmarks", next);
  };
  const deleteBookmark = (id: string) => {
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    persist("speed_reader_bookmarks", next);
  };
  const updateSettings = (updates: Partial<Settings>) => {
    const next = normalizeSettings({ ...settings, ...updates });
    setSettings(next);
    persist("speed_reader_settings", next);
  };
  const seekToPosition = (offset: number, play = false) => {
    const content = currentDocument?.content || "";
    const target = Math.floor(clamp(offset, 0, Math.max(0, content.length - 1), 0));
    const chunk = segments[indexAt(segments, target)];
    let safe = chunk?.start || 0;
    // DOM offsets use UTF-16; never start inside an emoji or combining sequence.
    for (const part of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(chunk?.text || "")) {
      if ((chunk?.start || 0) + part.index > target) break;
      safe = (chunk?.start || 0) + part.index;
    }
    setPlaying(play);
    setPosition(safe);
  };
  return {
    seekToPosition,
    pausePlayback: () => setPlaying(false),
    documents,
    currentDocument,
    setCurrentDocument,
    importDocumentFile,
    removeDocument,
    readingProgress,
    updateReadingPosition,
    bookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    settings,
    updateSettings,
    speedReaderState,
    setSpeedReaderState,
    segments,
    position,
    notice,
    setNotice,
  };
}
const AppContext = createContext<ReturnType<typeof useAppState> | undefined>(
  undefined,
);
export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}
export function useApp() {
  const state = useContext(AppContext);
  if (!state) throw new Error("useApp requires AppProvider");
  return state;
}
