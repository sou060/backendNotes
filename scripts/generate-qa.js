const fs = require('fs');
const cheerio = require('cheerio');

const qaFile = 'data/qa-cards.json';
let qaData = JSON.parse(fs.readFileSync(qaFile, 'utf-8'));

// First, clean up the top-level mistakes I just made
qaData = qaData.filter(c => c.cards !== undefined);

let nextId = 0;
// Find max ID correctly
qaData.forEach(chapterData => {
  chapterData.cards.forEach(card => {
    if (card.id) {
      const idNum = parseInt(card.id.split('-').pop(), 10);
      if (!isNaN(idNum) && idNum > nextId) nextId = idNum;
    }
  });
});
nextId++;

function getChapterData(chapterNum) {
  let ch = qaData.find(c => c.chapter === String(chapterNum));
  if (!ch) {
    ch = { chapter: String(chapterNum), tag: "General", cards: [] };
    qaData.push(ch);
  }
  return ch;
}

// Function to generate flashcards from a chapter
function extractFlashcardsFromChapter(chapterNum, tag) {
  const chapterPath = `data/notes/chapter-${chapterNum}.html`;
  if (!fs.existsSync(chapterPath)) return;
  const html = fs.readFileSync(chapterPath, 'utf-8');
  const $ = cheerio.load(html);

  const chData = getChapterData(chapterNum);
  chData.tag = tag; // Ensure tag is updated

  $('.note-section').each((i, sec) => {
    const title = $(sec).find('h3').text().replace(/^[\d\.]+\s*/, '').trim();
    if (!title) return;

    let content = '';
    $(sec).find('.note-para, .note-list').each((j, el) => {
      content += $.html(el);
    });

    if (content) {
      chData.cards.push({
        id: `qa-${chapterNum}-${nextId++}`,
        question: `Explain the concept of: ${title}`,
        shortAnswer: `Overview of ${title}`,
        fullAnswer: content,
        confidence: 0,
        starred: false
      });
    }
  });
}

extractFlashcardsFromChapter(2, "OOP");
extractFlashcardsFromChapter(3, "Collections");
extractFlashcardsFromChapter(4, "Multithreading");

// Manual "Guess the output" cards
const guessCards = [
  {
    chapter: "1",
    tag: "Core Java",
    question: "Guess the output: Streams and Lazy Evaluation\n\n```java\nStream<Integer> s = Stream.of(1, 2, 3)\n    .peek(n -> System.out.print(n + \" \"));\nSystem.out.println(\"Done\");\n```",
    shortAnswer: "Only \"Done\" is printed.",
    fullAnswer: "Output is simply: `Done`\n\nBecause Streams are **lazy**, intermediate operations (like `peek`, `map`, `filter`) are not executed until a **terminal operation** (like `collect`, `forEach`, `count`) is invoked. Since there is no terminal operation on the stream, `peek` never runs."
  },
  {
    chapter: "3",
    tag: "Collections",
    question: "Guess the output: ConcurrentModificationException\n\n```java\nList<String> list = new ArrayList<>(Arrays.asList(\"A\", \"B\", \"C\"));\nfor (String s : list) {\n    if (s.equals(\"B\")) {\n        list.remove(s);\n    }\n}\nSystem.out.println(list);\n```",
    shortAnswer: "Throws ConcurrentModificationException",
    fullAnswer: "Output: `ConcurrentModificationException` is thrown at runtime.\n\nThe enhanced for-loop uses an Iterator under the hood. Modifying the list directly (`list.remove(s)`) instead of using `iterator.remove()` causes the list's internal `modCount` to misalign with the iterator's expected count, triggering a fast-fail exception on the next iteration."
  },
  {
    chapter: "3",
    tag: "Collections",
    question: "Guess the output: Set behavior with mutable objects\n\n```java\nSet<StringBuilder> set = new HashSet<>();\nStringBuilder sb = new StringBuilder(\"Java\");\nset.add(sb);\nsb.append(\"8\");\nSystem.out.println(set.contains(sb));\n```",
    shortAnswer: "It prints false or causes unexpected behavior.",
    fullAnswer: "Output: `false` (usually).\n\nWhen `sb` was added to the `HashSet`, its hashcode was calculated and it was placed in a specific bucket. When we mutated it (`sb.append(\"8\")`), its content changed, but its position in the set did not update. When calling `contains()`, the Set recalculates the hash and looks in a *different* bucket, resulting in `false`.\n\n**Rule of thumb:** Never mutate an object after using it as a key in a Map or adding it to a Set!"
  },
  {
    chapter: "4",
    tag: "Multithreading",
    question: "Guess the output: ExecutorService Shutdown\n\n```java\nExecutorService executor = Executors.newFixedThreadPool(1);\nexecutor.submit(() -> System.out.print(\"Task \"));\nexecutor.shutdownNow();\nexecutor.submit(() -> System.out.print(\"Task2 \"));\n```",
    shortAnswer: "Prints 'Task ' and then throws RejectedExecutionException.",
    fullAnswer: "Output: `RejectedExecutionException` is thrown.\n\nAfter `shutdown()` or `shutdownNow()` is called on an `ExecutorService`, it enters a shutdown state and cannot accept any new tasks. The second `submit()` call is immediately rejected."
  },
  {
    chapter: "4",
    tag: "Multithreading",
    question: "Guess the output: Thread.start() vs Thread.run()\n\n```java\nThread t = new Thread(() -> {\n    System.out.print(Thread.currentThread().getName() + \" \");\n});\nt.run();\nt.start();\n```",
    shortAnswer: "Prints \"main Thread-0\"",
    fullAnswer: "Output: `main Thread-0 ` (Assuming default thread names)\n\nCalling `t.run()` executes the run method synchronously on the *current* thread (which is `main`). Calling `t.start()` actually creates a new OS-level thread and executes the run method inside that new thread (`Thread-0`)."
  }
];

guessCards.forEach(card => {
  const chData = getChapterData(card.chapter);
  chData.cards.push({
    id: `qa-${card.chapter}-${nextId++}`,
    question: card.question,
    shortAnswer: card.shortAnswer,
    fullAnswer: card.fullAnswer,
    confidence: 0,
    starred: false
  });
});

fs.writeFileSync(qaFile, JSON.stringify(qaData, null, 2));
console.log('Fixed and added flashcards correctly.');
