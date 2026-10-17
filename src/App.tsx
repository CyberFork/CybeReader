import { useApp } from "./context/AppContext";
import { loadAllProgress } from "./services/progressManager";
import { DEMO_TEXT } from "./demo";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { DocumentList } from "./components/DocumentList";
import { NormalReader } from "./components/NormalReader";
import { SpeedReader } from "./components/SpeedReader";
import { BookmarkManager } from "./components/BookmarkManager";
import { Settings } from "./components/Settings";
import "./App.css";

function Toolbar() {
  const {
    importDocumentFile,
    documents,
    bookmarks,
    settings,
    currentDocument,
    position,
    notice,
    setNotice,
  } = useApp();
  const sample = async () => {
    try {
      await importDocumentFile(
        new File([DEMO_TEXT], "CybeReader 示例.txt", { type: "text/plain" }),
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "无法载入示例");
    }
  };
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
        <div>
          <button onClick={sample}>体验示例</button>
          <button onClick={backup}>导出备份</button>
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
        <Settings />
      </Layout>
    </AppProvider>
  );
}

export default App;

import "./polish.css";

import "./2077.css";
