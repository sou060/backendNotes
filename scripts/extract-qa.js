const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('index.html', 'utf-8');
const $ = cheerio.load(html);

const chaptersMap = {};

$('.qa-card').each((i, el) => {
  const card = $(el);
  const chapterId = card.attr('data-chapter') || "unknown";
  
  if (!chaptersMap[chapterId]) {
    // Get the chapter title from the tag-chip, e.g., "Ch.1 · Core Java"
    const chipText = card.find('.tag-chip').text().trim();
    chaptersMap[chapterId] = {
      chapter: chapterId,
      title: chipText || `Chapter ${chapterId}`,
      cards: []
    };
  }
  
  const question = card.find('.qa-q__text').html();
  const fullAnswer = card.find('.full-answer').html();
  const verbalAnswer = card.find('.verbal-answer').html();
  const trapText = card.find('.follow-up-trap').html();

  chaptersMap[chapterId].cards.push({
    question: question ? question.trim() : null,
    fullAnswer: fullAnswer ? fullAnswer.trim() : null,
    verbalAnswer: verbalAnswer ? verbalAnswer.trim() : null,
    followUpTrap: trapText ? trapText.trim() : null
  });
});

// Convert map to array sorted by chapter number
const data = Object.values(chaptersMap).sort((a, b) => parseInt(a.chapter) - parseInt(b.chapter));

// Ensure data folder exists
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

fs.writeFileSync('data/qa-cards.json', JSON.stringify(data, null, 2));
console.log(`Extracted ${$('.qa-card').length} cards into data/qa-cards.json`);
