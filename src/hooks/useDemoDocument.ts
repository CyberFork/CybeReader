import { useApp } from "../context/AppContext";
import { DEMO_TEXT } from "../demo";

/** Open the existing sample rather than creating copies or resetting progress. */
export function useDemoDocument() {
  const { documents, setCurrentDocument, importDocumentFile, setNotice } = useApp();
  return async () => {
    const existing = documents.find(
      (doc) => doc.name === "CybeReader 示例.txt" && doc.content === DEMO_TEXT,
    );
    if (existing) {
      setCurrentDocument(existing);
      return;
    }
    try {
      await importDocumentFile(
        new File([DEMO_TEXT], "CybeReader 示例.txt", { type: "text/plain" }),
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "无法载入示例");
    }
  };
}
