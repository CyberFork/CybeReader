import { useDemoDocument } from "../hooks/useDemoDocument";

export function ReadingStart() {
  const openDemo = useDemoDocument();
  return (
    <section className="reading-start" aria-labelledby="reading-start-title">
      <p className="reading-start-kicker">开始一段阅读</p>
      <h2 id="reading-start-title">找到位置，开始阅读。</h2>
      <p>导入文档或从书城选书，也可以先试读示例。</p>
      <button className="reading-start-action" onClick={openDemo}>用示例开始</button>
      <ol>
        <li><strong>定位</strong><span>拖选原文，暂停并定位。</span></li>
        <li><strong>专注</strong><span>从此处播放，进入速读。</span></li>
        <li><strong>回看</strong><span>回看原文，或保存书签。</span></li>
      </ol>
      <small>TXT / 文字型 PDF / DOCX · 文档在浏览器本地处理</small>
    </section>
  );
}
