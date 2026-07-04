const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dataPath = path.join(__dirname, '../data/qa-cards.json');
const notesDirPath = path.join(__dirname, '../data/notes');
const templatePath = path.join(__dirname, '../src/template.html');
const outputPath = path.join(__dirname, '../index.html');
const searchIndexPath = path.join(__dirname, '../search-index.json');

console.log('Loading QA data...');
const qaData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const searchIndex = [];

console.log('Building HTML and generating QA search index...');
let cardsHtml = '';

qaData.forEach(chapterData => {
  const chapter = chapterData.chapter;
  chapterData.cards.forEach((card, idx) => {
    // Generate the HTML for a single card
    const trapHtml = card.followUpTrap ? `\n<div class="follow-up-trap">\n${card.followUpTrap}\n</div>` : '';
    const verbalHtml = card.verbalAnswer ? `\n<p class="verbal-answer">${card.verbalAnswer}</p>` : '';
    const fullAnswerHtml = card.fullAnswer ? `\n<div class="full-answer">\n${card.fullAnswer}\n</div>` : '';
    
    // Fallback if tag title doesn't exist
    let tagChip = `Ch.${chapter}`;
    if (chapterData.title) {
      tagChip = chapterData.title.split(':')[0];
    }

    const html = `<div class="qa-card" data-chapter="${chapter}">
<button class="qa-q" onclick="toggleQA(this)">
<span class="tag-chip small">${tagChip}</span>
<span class="qa-q__text">${card.question}</span>
<svg class="chev" height="16" viewBox="0 0 24 24" width="16">
<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path>
</svg>
</button>
<div class="qa-a">${fullAnswerHtml}${verbalHtml}${trapHtml}
</div>
</div>`;
    cardsHtml += html + '\n';

    // Index QA Card
    const qaContent = [
      card.question || '', 
      card.fullAnswer ? cheerio.load(card.fullAnswer).text() : '',
      card.verbalAnswer || '',
      card.followUpTrap ? cheerio.load(card.followUpTrap).text() : ''
    ].join(' ').replace(/\s+/g, ' ').trim();

    searchIndex.push({
      id: `qa-ch${chapter}-${idx}`,
      chapter: parseInt(chapter),
      title: `Q: ${card.question}`,
      text: qaContent,
      type: 'qa'
    });
  });
});

console.log('Generating Notes search index...');
const noteFiles = fs.readdirSync(notesDirPath).filter(f => f.endsWith('.html'));
noteFiles.forEach(file => {
  const chapterId = file.replace('chapter-', '').replace('.html', '');
  const html = fs.readFileSync(path.join(notesDirPath, file), 'utf-8');
  const $ = cheerio.load(html);
  
  // We index each section inside a chapter (h3)
  // But a simple approach is to index paragraphs and table rows.
  // Let's index the entire chapter as a few chunks, or by section.
  $('h3').each((i, el) => {
    const title = $(el).text().trim();
    let content = '';
    let nextEl = $(el).next();
    
    while (nextEl.length && nextEl[0].tagName !== 'h3') {
      content += ' ' + nextEl.text().trim();
      nextEl = nextEl.next();
    }
    
    content = content.replace(/\s+/g, ' ').trim();
    if (content.length > 0) {
      searchIndex.push({
        id: `note-ch${chapterId}-sec${i}`,
        chapter: parseInt(chapterId),
        title: title,
        text: content,
        type: 'note'
      });
    }
  });
});

console.log('Writing search-index.json...');
fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex));

console.log('Loading template...');
let template = fs.readFileSync(templatePath, 'utf-8');
template = template.replace('<!-- INJECT_QA_CARDS -->', cardsHtml);

console.log('Writing index.html...');
fs.writeFileSync(outputPath, template);

// Copy static assets
console.log('Copying static assets...');
fs.copyFileSync(path.join(__dirname, '../src/styles.css'), path.join(__dirname, '../styles.css'));
fs.copyFileSync(path.join(__dirname, '../src/app.js'), path.join(__dirname, '../app.js'));

const outNotesDir = path.join(__dirname, '../notes');
if (!fs.existsSync(outNotesDir)) {
  fs.mkdirSync(outNotesDir);
}
noteFiles.forEach(file => {
  fs.copyFileSync(path.join(notesDirPath, file), path.join(outNotesDir, file));
});

console.log('Done! Build successfully.');
