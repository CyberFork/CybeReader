import { ReadingProgress } from "../types";

const PROGRESS_STORAGE_KEY = "speed_reader_progress";

/**
 * 加载所有阅读进度
 */
export function loadAllProgress(): Record<string, ReadingProgress> {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) return {};
    const value = JSON.parse(stored);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch (error) {
    console.error("加载阅读进度失败:", error);
    return {};
  }
}

/**
 * 保存阅读进度
 */
export function saveProgress(progress: ReadingProgress): void {
  try {
    const allProgress = loadAllProgress();
    allProgress[progress.documentId] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("保存阅读进度失败:", error);
  }
}

/**
 * 获取文档的阅读进度
 */
export function getProgress(documentId: string): ReadingProgress | null {
  const allProgress = loadAllProgress();
  return allProgress[documentId] || null;
}

/**
 * 更新阅读位置
 */
export function updateProgress(documentId: string, position: number): void {
  const progress: ReadingProgress = {
    documentId,
    position,
    lastReadAt: Date.now(),
  };
  saveProgress(progress);
}

export function removeProgress(documentId: string): void {
  try {
    const data = loadAllProgress();
    delete data[documentId];
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* Deletion remains possible when progress storage is unavailable. */
  }
}
