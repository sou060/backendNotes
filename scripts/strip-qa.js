const fs = require('fs');

const html = fs.readFileSync('src/template.html', 'utf-8');

const startIndex = html.indexOf('<div class="qa-card"');
if (startIndex === -1) {
  console.log("Could not find start of qa-cards");
  process.exit(1);
}

// Find the end of qa-list which is right before </section>
const sectionEndIndex = html.indexOf('</section>', startIndex);

// But wait, the cards are inside <div id="qa-list">, so the closing </div> of qa-list comes right before </section>
const qaListEndIndex = html.lastIndexOf('</div>', sectionEndIndex);

if (qaListEndIndex === -1) {
  console.log("Could not find end of qa-list");
  process.exit(1);
}

const beforeCards = html.substring(0, startIndex);
const afterCards = html.substring(qaListEndIndex); // this includes the closing </div> of qa-list

const newHtml = beforeCards + '<!-- INJECT_QA_CARDS -->\n' + afterCards;

fs.writeFileSync('src/template.html', newHtml);
console.log("Stripped QA cards from src/template.html");
