const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://backendnotes-rose.vercel.app/', { waitUntil: 'networkidle0' });
  
  const widths = await page.evaluate(() => {
    return {
      html: document.documentElement.getBoundingClientRect().width,
      body: document.body.getBoundingClientRect().width,
      app: document.querySelector('.app') ? document.querySelector('.app').getBoundingClientRect().width : null,
      mainContent: document.querySelector('.main-content') ? document.querySelector('.main-content').getBoundingClientRect().width : null,
      view: document.querySelector('.view') ? document.querySelector('.view').getBoundingClientRect().width : null,
    };
  });
  
  console.log('Desktop widths:', widths);

  await page.setViewport({ width: 390, height: 844 });
  await page.waitForTimeout(500); // wait for resize
  
  const mobileWidths = await page.evaluate(() => {
    return {
      html: document.documentElement.getBoundingClientRect().width,
      body: document.body.getBoundingClientRect().width,
      app: document.querySelector('.app') ? document.querySelector('.app').getBoundingClientRect().width : null,
      mainContent: document.querySelector('.main-content') ? document.querySelector('.main-content').getBoundingClientRect().width : null,
      view: document.querySelector('.view') ? document.querySelector('.view').getBoundingClientRect().width : null,
      chapter: document.querySelector('.chapter') ? document.querySelector('.chapter').getBoundingClientRect().width : null,
    };
  });
  
  console.log('Mobile widths:', mobileWidths);

  await browser.close();
})();
