import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { indexAt } from "../utils/reading";
import "./NormalReader.css";
export function NormalReader() {
  const {
    currentDocument,
    position,
    seekToPosition,
    pausePlayback,
    settings,
    speedReaderState,
    setSpeedReaderState,
    segments,
  } = useApp();
  const highlightRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const selectionAction = useRef<(play?: boolean) => boolean>(() => false);
  const dragging = useRef(false);
  const lastSelection = useRef("");
  useEffect(() => {
    let timer = 0;
    const changed = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!dragging.current) selectionAction.current();
      }, 250);
    };
    const released = () => {
      dragging.current = false;
      changed();
    };
    document.addEventListener("selectionchange", changed);
    document.addEventListener("pointerup", released);
    document.addEventListener("pointercancel", released);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", changed);
      document.removeEventListener("pointerup", released);
      document.removeEventListener("pointercancel", released);
    };
  }, []);
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
  selectionAction.current = () => false;
  if (!currentDocument)
    return (
      <div className="normal-reader empty">
        <div className="empty-message">选择文档或体验示例，开始阅读</div>
      </div>
    );
  const start = position,
    end = current?.end || 0;
  // Bound DOM text to one 8K section, rather than rebuilding an entire book per tick.
  const section = Math.floor(start / 8000) * 8000;
  const visibleStart =
    segments[indexAt(segments, Math.max(0, section - 40))]?.start || 0;
  const sectionEnd = Math.min(
    currentDocument.content.length,
    Math.max(section + 8100, end),
  );
  selectionAction.current = (play = false) => {
    const selection = window.getSelection();
    const root = textRef.current;
    if (!root || !selection || selection.isCollapsed || !selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return false;
    const prefix = document.createRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(range.startContainer, range.startOffset);
    const offset = visibleStart + prefix.toString().length;
    const key = `${currentDocument.id}:${offset}:${selection.toString()}`;
    if (!play && lastSelection.current === key) return false;
    lastSelection.current = key;
    seekToPosition(offset, play);
    return true;
  };
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
      <div className="reader-tools" style={{ backgroundColor: settings.backgroundColor }}>
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
      <div className="text-seek-controls">
        <span>选中文字即可定位 · 从第 {start + 1} 个字符继续</span>
        <button onClick={() => {
          if (!selectionAction.current(true)) setSpeedReaderState(prev => ({ ...prev, isPlaying: true }));
          window.getSelection()?.removeAllRanges();
        }}>从此处播放</button>
      </div>
      </div>
      <div className="normal-reader-content" onPointerDown={() => {
        dragging.current = true;
        lastSelection.current = "";
        pausePlayback();
      }} onKeyDown={() => pausePlayback()}>
        <span ref={textRef} className="normal-reader-text" tabIndex={0} aria-label="原文，选中文字定位播放">
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
