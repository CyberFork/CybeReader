import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.APP_URL || 'http://127.0.0.1:4177/cybereader/';
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
await fs.mkdir('/tmp/cybereader-selection-20261018',{recursive:true});
const results=[];
const sample='天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。👨‍👩‍👧‍👦é测试选择。'.repeat(500);
async function select(page,a,b,backward=false) {
  await page.locator('.normal-reader-text').evaluate((el,{a,b,backward})=>{
    const sources=[...el.querySelectorAll('[data-source-start]')];
    const locate=(target)=>{
      let consumed=0;
      for(const source of sources){
        const length=source.textContent.length;
        if(target<=consumed+length){
          const local=Math.max(0,target-consumed);
          const walker=document.createTreeWalker(source,NodeFilter.SHOW_TEXT);
          let node,offset=0,last=null;
          while(node=walker.nextNode()){
            last=node;
            if(local<=offset+node.length)return [node,local-offset];
            offset+=node.length;
          }
          if(last)return [last,last.length];
        }
        consumed+=length;
      }
      throw new Error(`source offset ${target} is outside ${consumed} characters`);
    };
    const start=locate(a),end=locate(b);
    const s=window.getSelection(); s.removeAllRanges();
    s.setBaseAndExtent(...(backward?end:start),...(backward?start:end));
    document.dispatchEvent(new Event('selectionchange'));
  },{a,b,backward});
  await page.waitForTimeout(400);
}
try {
 for (const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
  const page=await context.newPage();const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base,{waitUntil:'networkidle'});
  assert(!requests.some(u=>/library\/pg/.test(u)));
  await page.getByLabel('选择文档文件').setInputFiles({name:'selection.txt',mimeType:'text/plain',buffer:Buffer.from(sample)});
  await page.locator('.normal-reader-text').waitFor();
  // Mid-chunk exact offset, reverse selection, inside emoji grapheme.
  for(const [a,b,rev] of [[12,20,false],[17,29,true],[25,30,false]]) {
    await select(page,a,b,rev);
    const expected=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(sample)].filter(x=>x.index<=a).at(-1).index;
    assert((await page.locator('.text-seek-controls').innerText()).includes(`第 ${expected+1} 个字符`));
    assert(sample.slice(expected).startsWith(await page.locator('.speed-reader-text').innerText()));
  }
  await select(page,12,20);
  await page.getByRole('button',{name:'从此处播放',exact:true}).click();
  await page.getByRole('button',{name:'暂停',exact:true}).waitFor();
  await page.waitForTimeout(600);
  assert(!(await page.locator('.text-seek-controls').innerText()).includes('第 13 个字符'));
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  // Selection while playing pauses first, actual drag through browser pointer.
  await page.getByRole('button',{name:'播放',exact:true}).click();
  const trailing=page.locator('#original-text > [data-source-start]').last();
  await trailing.scrollIntoViewIfNeeded();
  const point=await trailing.evaluate(el=>{
    const viewport=document.querySelector('.normal-reader').getBoundingClientRect();
    const tools=document.querySelector('.reader-tools').getBoundingClientRect();
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),node=walker.nextNode();
    const range=document.createRange();range.selectNodeContents(node);
    const rect=[...range.getClientRects()].find(r=>r.top>tools.bottom+4&&r.bottom<viewport.bottom-4);
    if(!rect)throw new Error('no visible source text for pointer selection');
    return {x:rect.left+5,y:rect.top+rect.height/2};
  });
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+110,point.y,{steps:12});await page.mouse.up();
  await page.getByRole('button',{name:'播放',exact:true}).waitFor();
  // Long document: visible section offset is added, then persisted exactly.
  await page.getByRole('button',{name:'下一段',exact:true}).click();
  const content=await page.locator('.normal-reader-text').textContent();
  const before=Number((await page.locator('.text-seek-controls').innerText()).match(/第 (\d+)/)[1])-1;
  const leading=await page.locator('#original-text > [data-source-start]').first().textContent();
  const focused=await page.locator('.speed-reader-text').textContent();
  await select(page,leading.length+focused.length+60,leading.length+focused.length+68);
  const after=Number((await page.locator('.text-seek-controls').innerText()).match(/第 (\d+)/)[1])-1;
  assert(after>before);assert(content.includes(await page.locator('.speed-reader-text').innerText()));
  const selectedText=await page.locator('.speed-reader-text').innerText();
  await page.waitForTimeout(650);
  await page.getByRole('button',{name:'暖沙主题'}).click();
  const nav=await page.locator('.toolbar-actions').boundingBox(), themes=await page.locator('.theme-picker').boundingBox();
  assert(themes.x>=nav.x && themes.x+themes.width<=nav.x+nav.width+1);
  assert.equal(await page.locator('.normal-reader').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(243, 231, 206)');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.reload({waitUntil:'networkidle'});
  await page.getByLabel('阅读 selection.txt', {exact:true}).click();
  assert.equal(await page.locator('.speed-reader-text').innerText(),selectedText);
  assert.equal(await page.getByRole('button',{name:'暖沙主题'}).getAttribute('aria-pressed'),'true');
  // Library: source, import, repeat avoids duplicates, download exact data.
  await page.getByRole('button',{name:'书城',exact:true}).click();
  await page.getByLabel('搜索示例书籍').fill('老子');
  await page.getByRole('button',{name:'导入阅读',exact:true}).click();
  await page.getByLabel('阅读 老子 · Gutenberg.txt',{exact:true}).waitFor();
  assert((await page.locator('.normal-reader-text').textContent()).includes('道可道'));
  assert((await page.locator('.speed-reader-text').innerText()).startsWith('第一'));
  assert(await page.getByRole('button',{name:'从此处播放',exact:true}).isVisible());
  await page.getByRole('button',{name:'书城',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('link',{name:'下载 TXT',exact:true}).click();
  const download=await downloadPromise;assert.equal(download.suggestedFilename(),'pg24039.txt');
  await page.getByRole('button',{name:'导入阅读',exact:true}).click();
  assert.equal(await page.getByLabel('阅读 老子 · Gutenberg.txt',{exact:true}).count(),1);
  await page.getByRole('button',{name:'书城',exact:true}).click();
  await page.getByLabel('搜索示例书籍').fill('不存在的书');
  assert((await page.getByRole('dialog').innerText()).includes('示例书库里没有'));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog').open);
  for(const title of ['论语','三国演义']) {
    await page.getByRole('button',{name:'书城',exact:true}).click();
    await page.getByLabel('搜索示例书籍').fill(title);
    await page.getByRole('button',{name:'导入阅读',exact:true}).click();
    await page.getByLabel(`阅读 ${title} · Gutenberg.txt`,{exact:true}).waitFor();
    assert((await page.locator('.speed-reader-text').innerText()).trim().length>0);
  }
  await page.screenshot({path:`/tmp/cybereader-selection-20261018/${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  results.push({width,exactSelection:true,backwardSelection:true,graphemeSafe:true,realDragPauses:true,longTextOffset:true,persisted:true,themeAligned:true,bookImportDownload:true,noEarlyBookFetch:true,errors});
  await context.close();
 }
 const page=await browser.newPage();await page.goto(base);
 await page.route('**/library/pg24039.txt',r=>r.fulfill({status:503,body:'Unavailable'}));
 await page.getByRole('button',{name:'书城',exact:true}).click();
 await page.getByLabel('搜索示例书籍').fill('老子');await page.getByRole('button',{name:'导入阅读',exact:true}).click();
 await page.getByRole('alert').waitFor();assert((await page.getByRole('alert').innerText()).includes('下载失败'));
 await page.unroute('**/library/pg24039.txt');await page.getByRole('button',{name:'导入阅读',exact:true}).click();
 await page.getByLabel('阅读 老子 · Gutenberg.txt',{exact:true}).waitFor();
 results.push({downloadFailureAndRetry:true});
 console.log(JSON.stringify({base,results},null,2));
 await fs.writeFile('/tmp/cybereader-selection-20261018/browser-results.json',JSON.stringify({base,results},null,2));
} finally {await browser.close();}
