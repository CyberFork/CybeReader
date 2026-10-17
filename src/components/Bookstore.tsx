import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import books from "../library.json";

export function Bookstore() {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const { importDocumentFile, documents, setCurrentDocument, pausePlayback } = useApp();
  const close = () => { request.current?.abort(); dialog.current?.close(); };
  const load = async (book: typeof books[number]) => {
    const name = `${book.title} · Gutenberg.txt`;
    const existing = documents.find(d => d.name === name);
    if (existing) { setCurrentDocument(existing); close(); return; }
    setBusy(book.id); setError("");
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${book.file}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`下载失败（${response.status}）`);
      const data = await response.arrayBuffer();
      if (controller.signal.aborted) return;
      if (data.byteLength !== book.bytes) throw new Error("书籍文件不完整，请重试");
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), n => n.toString(16).padStart(2,"0")).join("");
      if (hash !== book.sha256) throw new Error("书籍校验失败，请刷新后重试");
      const text = new TextDecoder().decode(data);
      const marker = /\*\*\* START OF[^\n]*\n/.exec(text);
      const markerEnd = marker ? marker.index + marker[0].length : 0;
      const start = Math.max(markerEnd, text.indexOf(book.bodyStart, markerEnd));
      if (controller.signal.aborted) return;
      await importDocumentFile(new File([text], name, { type: "text/plain" }), start);
      dialog.current?.close();
    } catch (e) {
      if (dialog.current?.open) setError(controller.signal.aborted ? "载入超时，请重试；也可从原站下载 TXT 后导入。" : e instanceof Error ? e.message : "载入失败，请重试");
    } finally { clearTimeout(timeout); setBusy(""); request.current = null; }
  };
  return <>
    <button onClick={() => { pausePlayback(); setError(""); dialog.current?.showModal(); }}>书城</button>
    <dialog ref={dialog} className="bookstore" aria-labelledby="bookstore-title" onCancel={close} onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); close(); } }} onClose={() => request.current?.abort()}>
      <div className="bookstore-header"><h2 id="bookstore-title">书城 · 经典示例</h2><button onClick={close} aria-label="关闭书城">关闭</button></div>
      <p>选一本，直接导入阅读。第三方文本来自 Project Gutenberg；本站提供固定快照，不是实时全站搜索。仅下载所选书籍，不上传你的文档。</p>
      <input type="search" aria-label="搜索示例书籍" placeholder="书名或作者" value={query} onChange={e => setQuery(e.target.value)} />
      {error && <p className="import-error" role="alert">{error}</p>}
      {busy && <p className="bookstore-progress" role="status" aria-live="polite">正在下载并校验原文，完成后自动打开。无需再次点击。</p>}
      <div className="bookstore-list" aria-busy={Boolean(busy)}>
        {books.filter(b => `${b.title}${b.author}`.includes(query.trim())).map(book => <article key={book.id}>
          <h3>{book.title}</h3><p>{book.author} · 中文原版（繁体） · TXT · {Math.ceil(book.bytes / 1024)} KB</p>
          <div className="bookstore-actions"><button disabled={Boolean(busy)} onClick={() => load(book)}>{busy === book.id ? "正在导入…" : "导入阅读"}</button>
          <a href={book.source} target="_blank" rel="noopener noreferrer">原站与授权 ↗</a>
          <a href={`${import.meta.env.BASE_URL}${book.file}`} download>下载 TXT</a></div>
        </article>)}
        {!books.some(b => `${b.title}${b.author}`.includes(query.trim())) && <p>示例书库里没有这本书。可以从其他合法来源下载 TXT，再通过“导入文档”打开。</p>}
      </div>
      <small>原站标注美国公版；其他地区请按当地规则使用。全文保留原站声明与许可，导入后从正文开始，向前翻阅可查看原始说明。再次导入会打开已有副本，不覆盖阅读进度。</small>
    </dialog>
  </>;
}
