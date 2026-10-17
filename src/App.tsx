import { useApp } from "./context/AppContext";
import { loadAllProgress } from "./services/progressManager";
import { useDemoDocument } from "./hooks/useDemoDocument";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { DocumentList } from "./components/DocumentList";
import { NormalReader } from "./components/NormalReader";
import { SpeedReader } from "./components/SpeedReader";
import { BookmarkManager } from "./components/BookmarkManager";
import { ThemePicker } from "./components/ThemePicker";
import { Bookstore } from "./components/Bookstore";
import { Settings } from "./components/Settings";
import "./App.css";

function Toolbar() {
  const {
    documents,
    bookmarks,
    settings,
    currentDocument,
    position,
    notice,
    setNotice,
  } = useApp();
  const sample = useDemoDocument();
  const backup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            documents: documents.map((d) => ({ ...d, file: undefined })),
            bookmarks,
            settings,
            progress: {
              ...loadAllProgress(),
              ...(currentDocument
                ? {
                    [currentDocument.id]: {
                      documentId: currentDocument.id,
                      position,
                      lastReadAt: Date.now(),
                    },
                  }
                : {}),
            },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cybereader-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <header className="app-toolbar">
        <div>
          <strong>CybeReader</strong>
          <span>让阅读回到自己的节奏</span>
        </div>
        <div className="toolbar-actions">
          <ThemePicker />
          <Bookstore />
          <button onClick={sample}>体验示例</button>
          <button onClick={backup}>导出备份</button>
          <Settings />
        </div>
      </header>
      {notice && (
        <div className="app-notice" role="alert">
          {notice}
          <button onClick={() => setNotice("")}>关闭提示</button>
        </div>
      )}
    </>
  );
}
function App() {
  return (
    <AppProvider>
      <Layout>
        <Toolbar />
        <div className="app-container">
          <DocumentList />
          <div className="main-content">
            <div className="reader-container">
              <NormalReader />
            </div>
            <SpeedReader />
          </div>
          <BookmarkManager />
        </div>
      </Layout>
    </AppProvider>
  );
}

export default App;

import "./polish.css";

import "./2077.css";
