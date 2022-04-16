const chromium = require('chrome-aws-lambda');

(async()=>{
  browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  
  let page = await browser.newPage();
  
  await page.goto(event.url || 'https://example.com');
  
  result = await page.title();
})()
