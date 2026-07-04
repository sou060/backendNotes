const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const templatePath = path.join(__dirname, '../src/template.html');
const html = fs.readFileSync(templatePath, 'utf-8');
const $ = cheerio.load(html, { decodeEntities: false });

// 1. Extract CSS
const styleTag = $('style').first();
const cssContent = styleTag.html();
if (cssContent) {
  fs.writeFileSync(path.join(__dirname, '../src/styles.css'), cssContent);
  styleTag.replaceWith('<link rel="stylesheet" href="./styles.css" />');
  console.log('Extracted styles.css');
}

// 2. Extract Chapters
const notesDir = path.join(__dirname, '../data/notes');
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

let chaptersExtracted = 0;
const chapters = [];

$('#view-notes .chapter').each((i, el) => {
  const chapterDiv = $(el);
  const chapterId = chapterDiv.attr('data-chapter');
  
  // Save HTML content of the chapter
  const chapterHtml = $.html(chapterDiv);
  fs.writeFileSync(path.join(notesDir, `chapter-${chapterId}.html`), chapterHtml);
  chaptersExtracted++;
});

// Remove all chapters from #view-notes and replace with container
if (chaptersExtracted > 0) {
  // Find the exact place to put the container. 
  // It should be after the page-head inside #view-notes
  $('#view-notes .chapter').remove();
  // We'll append it, but wait, there might be other elements in view-notes.
  // Actually, we can just append it to view-notes.
  $('#view-notes').append('<div id="notes-container"></div>');
  console.log(`Extracted ${chaptersExtracted} chapters to data/notes/`);
}

// 3. Extract JS
// Grab all inline <script> tags that do not have a src attribute
let jsContent = '';
$('script').each((i, el) => {
  const scriptTag = $(el);
  if (!scriptTag.attr('src')) {
    jsContent += scriptTag.html() + '\n\n';
    scriptTag.remove();
  }
});

if (jsContent) {
  fs.writeFileSync(path.join(__dirname, '../src/app.js'), jsContent);
  $('body').append('<script src="./app.js"></script>');
  console.log('Extracted app.js');
}

// 4. Save template.html
fs.writeFileSync(templatePath, $.html());
console.log('Updated src/template.html');
