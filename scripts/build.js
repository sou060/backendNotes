const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/qa-cards.json');
const templatePath = path.join(__dirname, '../src/template.html');
const outputPath = path.join(__dirname, '../index.html');

console.log('Loading QA data...');
const qaData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('Building HTML...');
let cardsHtml = '';

qaData.forEach(chapterData => {
  const chapter = chapterData.chapter;
  chapterData.cards.forEach(card => {
    // Generate the HTML for a single card
    const trapHtml = card.followUpTrap ? `\n<div class="follow-up-trap">\n${card.followUpTrap}\n</div>` : '';
    const verbalHtml = card.verbalAnswer ? `\n<p class="verbal-answer">${card.verbalAnswer}</p>` : '';
    const fullAnswerHtml = card.fullAnswer ? `\n<div class="full-answer">\n${card.fullAnswer}\n</div>` : '';
    
    // Fallback if tag title doesn't exist
    let tagChip = `Ch.${chapter}`;
    if (chapterData.title) {
      // e.g. "Ch.1 · Core Java"
      tagChip = chapterData.title.split(':')[0]; // Sometimes it includes a colon like "Ch.1 · Core Java Fundamentals: The Building Blocks"
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
  });
});

console.log('Loading template...');
let template = fs.readFileSync(templatePath, 'utf-8');

// Replace placeholder
template = template.replace('<!-- INJECT_QA_CARDS -->', cardsHtml);

console.log('Writing index.html...');
fs.writeFileSync(outputPath, template);

console.log('Done! index.html built successfully.');
