import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import "./DocumentList.css";

export function DocumentList() {
  const {
    documents,
    currentDocument,
    setCurrentDocument,
    importDocumentFile,
    removeDocument,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      await importDocumentFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setError(
        "导入文档失败：" +
          (error instanceof Error ? error.message : "未知错误"),
      );
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>文档列表</h2>
        <button
          disabled={busy}
          onClick={handleImportClick}
          className="import-button"
        >
          {busy ? "解析中…" : "导入文档"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          aria-label="选择文档文件"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
      <p className="import-hint">TXT / PDF / DOCX · 仅在浏览器处理</p>
      <div className="document-list-content">
        {documents.length === 0 ? (
          <div className="empty-state">暂无文档，请导入文档开始阅读</div>
        ) : (
          <ul className="document-items">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className={`document-item ${currentDocument?.id === doc.id ? "active" : ""}`}
                tabIndex={0}
                aria-label={`阅读 ${doc.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCurrentDocument(doc);
                  }
                }}
                onClick={() => setCurrentDocument(doc)}
              >
                <div className="document-item-name">{doc.name}</div>
                <div className="document-item-meta">
                  <span className="document-item-type">
                    {doc.type.toUpperCase()}
                  </span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("确定要删除这个文档吗？")) {
                        try {
                          removeDocument(doc.id);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "删除失败");
                        }
                      }
                    }}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
