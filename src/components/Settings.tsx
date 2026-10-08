import type { ChangeEvent } from "react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./Settings.css";

export function Settings() {
  const { settings, updateSettings } = useApp();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button,input")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "Tab" && panel) {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>("button,input"),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      triggerRef.current?.focus();
    };
  }, [isOpen]);
  const handleFontSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ fontSize: parseInt(e.target.value) });
  };

  const handleFontColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ fontColor: e.target.value });
  };

  const handleBackgroundColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ backgroundColor: e.target.value });
  };

  const handleHighlightColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSettings({ highlightColor: e.target.value });
  };

  const handleWindowWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 20) {
      updateSettings({ speedReaderWindowWidth: value });
    }
  };

  const handlePlaybackSpeedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value > 0 && value <= 20) {
      updateSettings({ speedReaderPlaybackSpeed: value });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        设置
      </button>
      {isOpen && (
        <div className="settings-overlay" onClick={() => setIsOpen(false)}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="settings-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-header">
              <h2 id="settings-title">设置</h2>
              <button
                aria-label="关闭设置"
                className="close-button"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3>阅读设置</h3>
                <div className="setting-group">
                  <label>
                    字体大小: {settings.fontSize}px
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={settings.fontSize}
                      onChange={handleFontSizeChange}
                    />
                  </label>
                </div>
                <div className="setting-group">
                  <label>
                    字体颜色:
                    <input
                      type="color"
                      value={settings.fontColor}
                      onChange={handleFontColorChange}
                    />
                  </label>
                </div>
                <div className="setting-group">
                  <label>
                    背景颜色:
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={handleBackgroundColorChange}
                    />
                  </label>
                </div>
                <div className="setting-group">
                  <label>
                    高亮颜色:
                    <input
                      type="color"
                      value={settings.highlightColor}
                      onChange={handleHighlightColorChange}
                    />
                  </label>
                </div>
              </div>

              <div className="settings-section speed-reader-settings">
                <h3>速读设置</h3>
                <div className="setting-group">
                  <label>
                    窗口宽度: {settings.speedReaderWindowWidth} 字符
                    <div className="setting-input-group">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={settings.speedReaderWindowWidth}
                        onChange={handleWindowWidthChange}
                        className="setting-slider"
                      />
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={settings.speedReaderWindowWidth}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 20) {
                            updateSettings({ speedReaderWindowWidth: value });
                          }
                        }}
                        className="setting-number-input"
                      />
                    </div>
                  </label>
                </div>
                <div className="setting-group">
                  <label>
                    播放速度: {settings.speedReaderPlaybackSpeed} 窗口/秒
                    <div className="setting-input-group">
                      <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={settings.speedReaderPlaybackSpeed}
                        onChange={handlePlaybackSpeedChange}
                        className="setting-slider"
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={settings.speedReaderPlaybackSpeed}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > 0 && value <= 20) {
                            updateSettings({ speedReaderPlaybackSpeed: value });
                          }
                        }}
                        className="setting-number-input"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
