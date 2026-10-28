import { useEffect, useLayoutEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { indexAt } from "../utils/reading";
import "./NormalReader.css";
import { ReadingStart } from "./ReadingStart";
import { focusReaderRegion } from "../utils/readerFocus";
import { SpeedReader } from "./SpeedReader";
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
  const focusRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
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
  useLayoutEffect(() => {
    const el = focusRef.current;
    if (!el) return;
    const container = el.closest(".normal-reader") as HTMLElement;
    if (!container) return;
    const viewport = container.getBoundingClientRect();
    const focus = el.getBoundingClientRect();
    const delta = focus.top + focus.height / 2 - (viewport.top + viewport.height / 2);
    if (Math.abs(delta) > 1) container.scrollTop += delta;
  }, [position, current?.end]);
  selectionAction.current = () => false;
  if (!currentDocument)
    return (
      <div className="normal-reader empty">
        <ReadingStart />
      </div>
    );
  const start = position,
    end = current?.end || 0;
  // Keep a bounded, moving context window around the focus frame. The whole book
  // never enters the DOM, but the reader always sees text before and after it.
  const section = Math.floor(start / 8000) * 8000;
  const contextStart = Math.max(0, start - 4000);
  const visibleStart =
    segments[indexAt(segments, contextStart)]?.start || 0;
  const sectionEnd = Math.min(
    currentDocument.content.length,
    Math.max(start + 4100, end),
  );
  const sourceOffset = (node: Node, offset: number) => {
    const element = node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
    const source = element?.closest<HTMLElement>("[data-source-start]");
    if (!source || !textRef.current?.contains(source)) return null;
    const prefix = document.createRange();
    prefix.selectNodeContents(source);
    try {
      prefix.setEnd(node, offset);
    } catch {
      return null;
    }
    return Number(source.dataset.sourceStart) + prefix.toString().length;
  };
  selectionAction.current = (play = false) => {
    const selection = window.getSelection();
    const root = textRef.current;
    if (!root || !selection || selection.isCollapsed || !selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return false;
    const offset = sourceOffset(range.startContainer, range.startOffset);
    if (offset === null) return false;
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
      id="original-reader"
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
          focusReaderRegion("focus");
        }}>从此处播放</button>
      </div>
      </div>
      <div className="normal-reader-content" onPointerDown={(event) => {
        if ((event.target as Element).closest("[data-reader-ui]")) return;
        dragging.current = true;
        lastSelection.current = "";
        pausePlayback();
      }} onKeyDown={(event) => {
        if (!(event.target as Element).closest("[data-reader-ui]")) pausePlayback();
      }}>
        <div id="original-text" ref={textRef} className="normal-reader-text" tabIndex={0} aria-label="流式原文，选中文字定位播放">
          <span data-source-start={visibleStart}>
            {currentDocument.content.slice(visibleStart, start)}
          </span>
          <div ref={focusRef} className="inline-focus-anchor" data-reader-ui="true">
            <SpeedReader sourceStart={start} />
          </div>
          <span data-source-start={end}>
            {currentDocument.content.slice(end, sectionEnd)}
          </span>
        </div>
      </div>
      {sectionEnd < currentDocument.content.length && (
        <small className="section-hint">
          上下文随阅读位置流动 · 当前约{" "}
          {Math.floor((start / currentDocument.content.length) * 100)}% ·
          下一段可继续查看原文
        </small>
      )}
    </div>
  );
}
