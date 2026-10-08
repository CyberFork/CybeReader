import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { indexAt } from "../utils/reading";
import "./NormalReader.css";
export function NormalReader() {
  const {
    currentDocument,
    settings,
    speedReaderState,
    setSpeedReaderState,
    segments,
  } = useApp();
  const highlightRef = useRef<HTMLSpanElement>(null);
  const current = segments[speedReaderState.currentIndex];
  useEffect(() => {
    const el = highlightRef.current;
    if (!el) return;
    const container = el.closest(".normal-reader") as HTMLElement;
    if (
      container &&
      (el.offsetTop - container.scrollTop > container.clientHeight - 80 ||
        el.offsetTop < container.scrollTop + 30)
    )
      container.scrollTop = Math.max(
        0,
        el.offsetTop - container.clientHeight / 2,
      );
  }, [current?.start]);
  if (!currentDocument)
    return (
      <div className="normal-reader empty">
        <div className="empty-message">选择文档或体验示例，开始阅读</div>
      </div>
    );
  const start = current?.start || 0,
    end = current?.end || 0;
  // Bound DOM text to one 8K section, rather than rebuilding an entire book per tick.
  const section = Math.floor(start / 8000) * 8000;
  const visibleStart =
    segments[indexAt(segments, Math.max(0, section - 40))]?.start || 0;
  const sectionEnd = Math.min(
    currentDocument.content.length,
    Math.max(section + 8100, end),
  );
  const jump = (offset: number) =>
    setSpeedReaderState((prev) => ({
      ...prev,
      isPlaying: false,
      currentIndex: indexAt(segments, offset),
    }));
  return (
    <div
      className="normal-reader"
      style={{
        fontSize: settings.fontSize,
        color: settings.fontColor,
        backgroundColor: settings.backgroundColor,
      }}
    >
      <div className="reader-section-nav">
        <span>{currentDocument.name} · 原文</span>
        <div>
          <button
            onClick={() => jump(Math.max(0, section - 8000))}
            disabled={section === 0}
          >
            上一段
          </button>
          <button
            onClick={() => jump(section + 8000)}
            disabled={section + 8000 >= currentDocument.content.length}
          >
            下一段
          </button>
        </div>
      </div>
      <div className="normal-reader-content">
        <span className="normal-reader-text">
          {currentDocument.content.slice(visibleStart, start)}
          <span
            ref={highlightRef}
            className="highlight"
            style={{ backgroundColor: settings.highlightColor }}
          >
            {currentDocument.content.slice(start, end)}
          </span>
          {currentDocument.content.slice(end, sectionEnd)}
        </span>
      </div>
      {sectionEnd < currentDocument.content.length && (
        <small className="section-hint">
          长文分段渲染 · 当前约{" "}
          {Math.floor((start / currentDocument.content.length) * 100)}% ·
          下一段可继续查看原文
        </small>
      )}
    </div>
  );
}
