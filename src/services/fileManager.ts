import { Document } from "../types";
import { parseDocument } from "../utils/documentParser";

const DOCUMENTS_STORAGE_KEY = "speed_reader_documents";

/**
 * 从localStorage加载文档列表
 */
export function loadDocuments(): Document[] {
  try {
    const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored);
    return Array.isArray(data)
      ? data.filter(
          (doc) =>
            typeof doc.id === "string" && typeof doc.content === "string",
        )
      : [];
  } catch (error) {
    console.error("加载文档列表失败:", error);
    return [];
  }
}

/**
 * 保存文档列表到localStorage
 */
export function saveDocuments(documents: Document[]): void {
  try {
    // 移除File对象，因为无法序列化
    const serializable = documents.map((doc) => ({
      ...doc,
      file: undefined,
    }));
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    throw new Error(
      "浏览器存储空间不足或被禁用，文档未保存。请删除不用的文档或拆分文件。",
    );
  }
}

/**
 * 导入文档
 */
export async function importDocument(file: File): Promise<Document> {
  const parsed = await parseDocument(file);

  const document: Document = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: parsed.name,
    type: getFileType(file.name),
    content: parsed.content,
    file,
    createdAt: Date.now(),
  };

  const documents = loadDocuments();
  documents.push(document);
  saveDocuments(documents);

  return document;
}

/**
 * 删除文档
 */
export function deleteDocument(documentId: string): void {
  const documents = loadDocuments();
  const filtered = documents.filter((doc) => doc.id !== documentId);
  saveDocuments(filtered);
}

/**
 * 获取文档
 */
export function getDocument(documentId: string): Document | undefined {
  const documents = loadDocuments();
  return documents.find((doc) => doc.id === documentId);
}

/**
 * 根据文件名判断文件类型
 */
function getFileType(fileName: string): Document["type"] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".docx")) return "docx";
  return "txt"; // 默认
}
