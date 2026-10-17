import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Bookmark } from "../types";
import "./BookmarkManager.css";

export function BookmarkManager() {
  const {
    currentDocument,
    bookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    position,
    seekToPosition,
  } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const currentBookmarks = currentDocument
    ? bookmarks.filter((bm) => bm.documentId === currentDocument.id)
    : [];

  const handleAddBookmark = () => {
    if (!currentDocument) return;

    // 获取当前阅读位置（从速读状态）
    const text = currentDocument.content.substring(position, position + 50);

    addBookmark({
      documentId: currentDocument.id,
      position,
      text,
    });
  };

  const handleEditNote = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditNote(bookmark.note || "");
  };

  const handleSaveNote = (id: string) => {
    updateBookmark(id, { note: editNote });
    setEditingId(null);
    setEditNote("");
  };

  const handleJumpToBookmark = (bookmark: Bookmark) => {
    if (!currentDocument) return;

    // 跳转到书签位置
    seekToPosition(bookmark.position);
  };

  if (!currentDocument) {
    return (
      <div className="bookmark-manager empty">
        <div className="empty-message">请选择一个文档</div>
      </div>
    );
  }

  return (
    <div className="bookmark-manager">
      <div className="bookmark-manager-header">
        <h3>书签/笔记</h3>
        <button onClick={handleAddBookmark} className="add-bookmark-button">
          添加书签
        </button>
      </div>
      <div className="bookmark-list">
        {currentBookmarks.length === 0 ? (
          <div className="empty-state">暂无书签</div>
        ) : (
          currentBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-item">
              <div className="bookmark-text">{bookmark.text}</div>
              {editingId === bookmark.id ? (
                <div className="bookmark-edit">
                  <textarea
                    aria-label="书签笔记"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="输入笔记内容..."
                    rows={3}
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleSaveNote(bookmark.id)}>
                      保存
                    </button>
                    <button onClick={() => setEditingId(null)}>取消</button>
                  </div>
                </div>
              ) : (
                <>
                  {bookmark.note && (
                    <div className="bookmark-note">{bookmark.note}</div>
                  )}
                  <div className="bookmark-actions">
                    <button onClick={() => handleJumpToBookmark(bookmark)}>
                      跳转
                    </button>
                    <button onClick={() => handleEditNote(bookmark)}>
                      {bookmark.note ? "编辑笔记" : "添加笔记"}
                    </button>
                    <button onClick={() => deleteBookmark(bookmark.id)}>
                      删除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
