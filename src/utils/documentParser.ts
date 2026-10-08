export interface ParsedDocument {
  content: string;
  name: string;
}
export async function parseDocument(file: File): Promise<ParsedDocument> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("文件超过 20 MB，请拆分后导入");
  const ext = file.name.toLowerCase().split(".").pop();
  let content = "";
  if (ext === "txt") content = await file.text();
  else if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const pdf = await task.promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        pages.push(
          text.items.map((item) => ("str" in item ? item.str : "")).join(" "),
        );
        page.cleanup();
      }
      content = pages.join("\n");
    } finally {
      await task.destroy();
    }
  } else if (ext === "docx") {
    const { unzipSync, strFromU8 } = await import("fflate");
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => {
        if (entry.name !== "word/document.xml") return false;
        if (entry.originalSize > 5 * 1024 * 1024)
          throw new Error("DOCX 正文解压后超过 5 MB，请拆分文档");
        return true;
      },
    });
    const xml = entries["word/document.xml"];
    if (!xml) throw new Error("DOCX 缺少正文文件");
    const doc = new DOMParser().parseFromString(
      strFromU8(xml),
      "application/xml",
    );
    if (doc.querySelector("parsererror")) throw new Error("DOCX 正文 XML 损坏");
    content = Array.from(
      doc.getElementsByTagNameNS(
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "p",
      ),
    )
      .map((p) =>
        Array.from(
          p.getElementsByTagNameNS(
            "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            "t",
          ),
        )
          .map((t) => t.textContent || "")
          .join(""),
      )
      .join("\n");
  } else if (ext === "doc")
    throw new Error("不支持旧版 .doc，请先另存为 .docx 或 .txt");
  else throw new Error("支持 TXT、文字型 PDF、DOCX 文件");
  if (!content.trim())
    throw new Error("未提取到文字；扫描版 PDF 需要先进行 OCR");
  if (content.length > 1_000_000)
    throw new Error("文本超过 100 万字符，请拆分后导入");
  return { content, name: file.name };
}
