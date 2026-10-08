import { useState } from "react";
import { useApp } from "../context/AppContext";
import "./SpeedReader.css";

export function SpeedReader() {
  const {
    currentDocument,
    settings,
    speedReaderState,
    setSpeedReaderState,
    updateSettings,
  } = useApp();

  const [isEditingSpeed, setIsEditingSpeed] = useState(false);
  const [isEditingWidth, setIsEditingWidth] = useState(false);
  const [tempSpeed, setTempSpeed] = useState(
    settings.speedReaderPlaybackSpeed.toString(),
  );
  const [tempWidth, setTempWidth] = useState(
    settings.speedReaderWindowWidth.toString(),
  );

  const handlePlayPause = () => {
    setSpeedReaderState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleStop = () => {
    // 停止时重置到开始位置
    setSpeedReaderState({
      isPlaying: false,
      currentIndex: 0,
      chunks: speedReaderState.chunks,
    });
  };

  const handlePrevious = () => {
    if (speedReaderState.currentIndex > 0) {
      setSpeedReaderState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }));
    }
  };

  const handleNext = () => {
    if (speedReaderState.currentIndex < speedReaderState.chunks.length - 1) {
      setSpeedReaderState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    }
  };

  const currentChunk =
    speedReaderState.chunks[speedReaderState.currentIndex] || "";
  const progress =
    speedReaderState.chunks.length > 0
      ? ((speedReaderState.currentIndex + 1) / speedReaderState.chunks.length) *
        100
      : 0;

  if (!currentDocument) {
    return (
      <div className="speed-reader empty">
        <div className="empty-message">请选择一个文档开始速读</div>
      </div>
    );
  }

  return (
    <div
      className="speed-reader"
      tabIndex={0}
      aria-label="速读控制区"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === " ") {
          e.preventDefault();
          handlePlayPause();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevious();
        }
      }}
    >
      <div
        className="speed-reader-display"
        style={{
          backgroundColor: settings.backgroundColor,
        }}
      >
        <div
          className="speed-reader-text"
          style={{
            fontSize: `${settings.fontSize * 2}px`,
            color: settings.fontColor,
          }}
        >
          {currentChunk}
        </div>
      </div>
      <div className="speed-reader-controls">
        <div className="control-buttons">
          <button
            onClick={handlePrevious}
            disabled={speedReaderState.currentIndex === 0}
          >
            上一个
          </button>
          <button
            onClick={handlePlayPause}
            aria-pressed={speedReaderState.isPlaying}
          >
            {speedReaderState.isPlaying ? "暂停" : "播放"}
          </button>
          <button onClick={handleStop}>停止</button>
          <button
            onClick={handleNext}
            disabled={
              speedReaderState.currentIndex >=
              speedReaderState.chunks.length - 1
            }
          >
            下一个
          </button>
        </div>
        <div className="progress-info">
          <div
            className="progress-bar"
            role="progressbar"
            aria-label="阅读进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            {speedReaderState.currentIndex + 1} /{" "}
            {speedReaderState.chunks.length}
          </div>
        </div>
        <div className="speed-info">
          <div className="speed-control-item">
            <label>
              速度:
              {isEditingSpeed ? (
                <div className="inline-edit">
                  <input
                    type="number"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={tempSpeed}
                    onChange={(e) => setTempSpeed(e.target.value)}
                    onBlur={() => {
                      const value = parseFloat(tempSpeed);
                      if (value > 0 && value <= 20) {
                        updateSettings({ speedReaderPlaybackSpeed: value });
                      } else {
                        setTempSpeed(
                          settings.speedReaderPlaybackSpeed.toString(),
                        );
                      }
                      setIsEditingSpeed(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = parseFloat(tempSpeed);
                        if (value > 0 && value <= 20) {
                          updateSettings({ speedReaderPlaybackSpeed: value });
                        } else {
                          setTempSpeed(
                            settings.speedReaderPlaybackSpeed.toString(),
                          );
                        }
                        setIsEditingSpeed(false);
                      } else if (e.key === "Escape") {
                        setTempSpeed(
                          settings.speedReaderPlaybackSpeed.toString(),
                        );
                        setIsEditingSpeed(false);
                      }
                    }}
                    autoFocus
                    className="speed-input"
                  />
                  <span> 窗口/秒</span>
                </div>
              ) : (
                <div className="value-with-buttons">
                  <button
                    type="button"
                    className="editable-value"
                    aria-label="编辑播放速度"
                    onClick={() => {
                      setIsEditingSpeed(true);
                      setTempSpeed(
                        settings.speedReaderPlaybackSpeed.toString(),
                      );
                    }}
                  >
                    {settings.speedReaderPlaybackSpeed} 窗口/秒
                  </button>
                  <div className="arrow-buttons">
                    <button
                      className="arrow-btn arrow-up"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = Math.min(
                          20,
                          settings.speedReaderPlaybackSpeed + 0.5,
                        );
                        updateSettings({ speedReaderPlaybackSpeed: newValue });
                      }}
                      title="增加速度"
                      aria-label="增加速度"
                    >
                      ▲
                    </button>
                    <button
                      className="arrow-btn arrow-down"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = Math.max(
                          0.5,
                          settings.speedReaderPlaybackSpeed - 0.5,
                        );
                        updateSettings({ speedReaderPlaybackSpeed: newValue });
                      }}
                      title="减少速度"
                      aria-label="减少速度"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
            </label>
          </div>
          <div className="speed-multiply">×</div>
          <div className="speed-control-item">
            <label>
              窗口宽度:
              {isEditingWidth ? (
                <div className="inline-edit">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempWidth}
                    onChange={(e) => setTempWidth(e.target.value)}
                    onBlur={() => {
                      const value = parseInt(tempWidth);
                      if (value >= 1 && value <= 20) {
                        updateSettings({ speedReaderWindowWidth: value });
                      } else {
                        setTempWidth(
                          settings.speedReaderWindowWidth.toString(),
                        );
                      }
                      setIsEditingWidth(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = parseInt(tempWidth);
                        if (value >= 1 && value <= 20) {
                          updateSettings({ speedReaderWindowWidth: value });
                        } else {
                          setTempWidth(
                            settings.speedReaderWindowWidth.toString(),
                          );
                        }
                        setIsEditingWidth(false);
                      } else if (e.key === "Escape") {
                        setTempWidth(
                          settings.speedReaderWindowWidth.toString(),
                        );
                        setIsEditingWidth(false);
                      }
                    }}
                    autoFocus
                    className="speed-input"
                  />
                  <span> 字符</span>
                </div>
              ) : (
                <div className="value-with-buttons">
                  <button
                    type="button"
                    className="editable-value"
                    aria-label="编辑窗口宽度"
                    onClick={() => {
                      setIsEditingWidth(true);
                      setTempWidth(settings.speedReaderWindowWidth.toString());
                    }}
                  >
                    {settings.speedReaderWindowWidth} 字符
                  </button>
                  <div className="arrow-buttons">
                    <button
                      className="arrow-btn arrow-up"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = Math.min(
                          20,
                          settings.speedReaderWindowWidth + 1,
                        );
                        updateSettings({ speedReaderWindowWidth: newValue });
                      }}
                      title="增加宽度"
                      aria-label="增加宽度"
                    >
                      ▲
                    </button>
                    <button
                      className="arrow-btn arrow-down"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = Math.max(
                          1,
                          settings.speedReaderWindowWidth - 1,
                        );
                        updateSettings({ speedReaderWindowWidth: newValue });
                      }}
                      title="减少宽度"
                      aria-label="减少宽度"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
            </label>
          </div>
          <div className="speed-result">
            <div className="speed-result-item">
              ={" "}
              {Math.round(
                settings.speedReaderPlaybackSpeed *
                  settings.speedReaderWindowWidth,
              )}{" "}
              字符/s
            </div>
            <div className="speed-result-item">
              ={" "}
              {Math.round(
                settings.speedReaderPlaybackSpeed *
                  settings.speedReaderWindowWidth *
                  60,
              )}{" "}
              字符/min
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
