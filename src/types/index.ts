export interface Document {
  id: string;
  name: string;
  type: "txt" | "pdf" | "doc" | "docx";
  content: string;
  file?: File;
  createdAt: number;
}

export interface ReadingProgress {
  documentId: string;
  position: number; // 当前阅读位置（字符索引）
  lastReadAt: number;
}

export interface Bookmark {
  id: string;
  documentId: string;
  position: number;
  text: string; // 书签位置的文本片段
  note?: string; // 笔记内容，如果有则为笔记，无则为书签
  createdAt: number;
}

export interface Settings {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  highlightColor: string; // 高亮提取框颜色
  speedReaderWindowWidth: number; // 1-20
  speedReaderPlaybackSpeed: number; // windows/second
}

export interface SpeedReaderState {
  isPlaying: boolean;
  currentIndex: number;
  chunks: string[];
}
