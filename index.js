const ExcelJS = require('exceljs');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const bot = new Telegraf("5188469759:AAHSkx5VoZvobDknn_KxSfcqR6WAuMMEOg0");
const playwright = require('playwright')
// const { chromium } = require('playwright-core');
const chromium = require('chrome-aws-lambda');
const scrollElement = 'document.getElementsByClassName("oitems")[1]'
const fs = require('fs');
const { google } = require('googleapis');
const urls = ["https://loot.farm/"];
let alias = {};
alias[urls[0]] = "URL1";
alias[urls[1]] = "URL2";
var express = require('express');
var app = express();
const puppeteer= require('puppeteer')

let page3 = []
const analysisData = (data) => {
  const resultArray = [];
  for (let i = 0; i < data.length; i++) {
    const dataAnalysis = data[i].split(",");
    resultArray.push({
      name: dataAnalysis[0],
      price: parseFloat(dataAnalysis[1])
    })

  }
  return resultArray;
}
const filterObject = (arr) => {
  var result = arr.reduce((unique, o) => {
    if (!unique.some(obj => obj.name === o.name && obj.price === o.price)) {
      unique.push(o);
    }
    return unique;
  }, []);
  return result
}
const check = (e) => {
  if (e === 'FN') {
    return ' (Factory New)'
  } else if (e === 'MW') {
    return ' (Minimal Wear)'
  } else if (e === 'FT') {
    return ' (Field-Tested)'
  } else if (e === 'WW') {
    return ' (Well-Worn)'
  } else if (e === 'BS') {
    return ' (Battle-Scarred)'
  } else if (e === 'NP') {
    return ' (Not-Painted)'
  } else return "";
}
async function crawlPage2() {

  // page1 la etofun
  const data1 = [];
  for (let i = 0; i <= 618; i++) {
    const result = await axios.get(`https://www.etopfun.com/api/schema/bcitemlist.do?appid=730&rows=12&page=${i}&quality=&rarity=&exterior=&lang=en`);
    data1.push(result.data.datas.list)
  }
  const page1 = [];
  // console.log(data1);
  for (let i = 0; i < 618; i++) {
    for (let j = 0; j < 12; j++) {
      page1.push({
        name: data1[i][j].name,
        price: data1[i][j].value
      })
    }
  }
  let etofun = filterObject(page1);
  console.log(etofun);

  // data la loot.farm
  let data = [];
  const browser = await puppeteer.launch({ headless: true,
    args: ['--no-sandbox'],slowMo:0});
  // let browser = await playwright.chromium.launch({ headless: false, slowMo: 0 })
  // browser = await chromium.puppeteer.launch({
  //   args: chromium.args,
  //   executablePath: await chromium.executablePath,
  //   headless: chromium.headless,
  //   ignoreHTTPSErrors: true,
  // })
  let page = await browser.newPage()
  await page.goto(urls[0])
  await page.waitForSelector(".itemwrap")
  let previousHeight
  while (true) {
    try {
      previousHeight = await page.evaluate(`${scrollElement}.scrollHeight`)
      console.log(`Scroll ${alias[urls[0]]} to ${previousHeight}`)
      await page.evaluate(`${scrollElement}.scrollTo(0, ${scrollElement}.scrollHeight)`)
      await page.waitForFunction(`${scrollElement}.scrollHeight > ${previousHeight}`, 69, { timeout: 30000 })
    } catch (e) {
      if (e instanceof playwright.errors.TimeoutError) {
        console.log(`Finished scrolling ${alias[urls[0]]}`)
        break
      } else {
        data = await page.$$eval('.itemblock', (options) =>
          options.map((option) => option.getAttribute('data-name') + "," + option.getAttribute('data-p') / 100))
        let lootfarm = filterObject(analysisData(data));
        console.log(lootfarm);
        await browser.close();
      }
    }
  }
  // data = await page.$$eval('.itemblock', (options) =>
  //   options.map((option) => option.getAttribute('data-name') + "," + option.getAttribute('data-p') / 100))
  // let lootfarm = filterObject(analysisData(data));
  // console.log(lootfarm);
  // await browser.close();

  // arr la tradeit
  browser = await puppeteer.launch({ headless: true,
    args: ['--no-sandbox']});
  // browser = await playwright.firefox.launch({ headless: false, slowMo: 0 })
  // browser = await chromium.puppeteer.launch({
  //   args: chromium.args,
  //   executablePath: await chromium.executablePath,
  //   headless: chromium.headless,
  //   ignoreHTTPSErrors: true,
  // })
  page = await browser.newPage()
  await page.goto("https://old.tradeit.gg/")
  const response = await page.evaluate(async () => {
    return await fetch("https://inventory.tradeit.gg/sinv/730")
      .then(r => r.ok ? r.json() : Promise.reject(r))
  })
  let arr = [];
  for (var i = 0; i < response.length; i++) {
    for (var key in response[i]['730'].items) {
      arr.push({
        name: response[i]['730'].items[key].il.replace("https://tradeit.gg/csgo/store?search=", "") + check(response[i]['730'].items[key].e),
        price: response[i]['730'].items[key].p / 100
      });
    }
  }
  // console.log(arr);
  let tradeit = filterObject(arr);
  console.log(tradeit);
  await browser.close();

  // xuat ra excel etofun vs loot.farm
  // let lootData = analysisData(data);
  let excel1 = [];
  let table1 = [];
  let table2 = [];
  let table3 = [];

  // excel giua eto va loot
  for (let i = 0; i < etofun.length; i++) {
    let tmp = 0;
    for (let j = 0; j < lootfarm.length; j++) {
      if (etofun[i].name === lootfarm[j].name) {
        tmp++;
        table1.push({
          'name': etofun[i].name, 'etofun_price': etofun[i].price, 'lootfarm_price': lootfarm[j].price,
          'eto_loot': etofun[i].price / lootfarm[j].price, 'loot_eto': lootfarm[j].price / etofun[i].price
        })
      }
    }
    if (tmp == 0) {
      table1.push({ 'name': etofun[i].name, 'etofun_price': etofun[i].price, 'lootfarm_price': 0, 'eto_loot': 0, 'loot_eto': 0 })
    }
  }

  for (let i = 0; i < lootfarm.length; i++) {
    let tmp = 0;
    for (let j = 0; j < etofun.length; j++) {
      if (lootfarm[i].name === etofun[j].name) {
        tmp++;
        break;
      }
    }
    if (tmp == 0) {
      table1.push({ 'name': lootfarm[i].name, 'etofun_price': 0, 'lootfarm_price': lootfarm[i].price, 'eto_loot': 0, 'loot_eto': 0 })
    }
  }

  // excel giua eto va tradeit
  for (let i = 0; i < etofun.length; i++) {
    let tmp = 0;
    for (let j = 0; j < tradeit.length; j++) {
      if (etofun[i].name === tradeit[j].name) {
        tmp++;
        table2.push({
          'name': etofun[i].name, 'etofun_price': etofun[i].price, 'tradeit_price': tradeit[j].price,
          'eto_tradeit': etofun[i].price / tradeit[j].price, 'tradeit_eto': tradeit[j].price / etofun[i].price
        })
      }
    }
    if (tmp == 0) {
      table2.push({ 'name': etofun[i].name, 'etofun_price': etofun[i].price, 'tradeit_price': 0, 'eto_tradeit': 0, 'tradeit_eto': 0 })
    }
  }

  for (let i = 0; i < tradeit.length; i++) {
    let tmp = 0;
    for (let j = 0; j < etofun.length; j++) {
      if (tradeit[i].name === etofun[j].name) {
        tmp++;
        break;
      }
    }
    if (tmp == 0) {
      table2.push({ 'name': tradeit[i].name, 'etofun_price': 0, 'tradeit_price': tradeit[i].price, 'eto_tradeit': 0, 'tradeit_eto': 0 })
    }
  }

  // loot vs tradeit
  for (let i = 0; i < lootfarm.length; i++) {
    let tmp = 0;
    for (let j = 0; j < tradeit.length; j++) {
      if (lootfarm[i].name === tradeit[j].name) {
        tmp++;
        table3.push({
          'name': lootfarm[i].name, 'lootfarm_price': lootfarm[i].price, 'tradeit_price': tradeit[j].price,
          'loot_tradeit': lootfarm[i].price / tradeit[j].price, 'tradeit_loot': tradeit[j].price / lootfarm[i].price
        })
      }
    }
    if (tmp == 0) {
      table3.push({ 'name': lootfarm[i].name, 'lootfarm_price': lootfarm[i].price, 'tradeit_price': 0, 'loot_tradeit': 0, 'tradeit_loot': 0 })
    }
  }

  for (let i = 0; i < tradeit.length; i++) {
    let tmp = 0;
    for (let j = 0; j < lootfarm.length; j++) {
      if (tradeit[i].name === lootfarm[j].name) {
        tmp++;
        break;
      }
    }
    if (tmp == 0) {
      table3.push({ 'name': tradeit[i].name, 'lootfarm_price': 0, 'tradeit_price': tradeit[i].price, 'loot_tradeit': 0, 'tradeit_loot': 0 })
    }
  }

  const workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("etop_loot");
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 32 },
    { header: 'etop', key: 'etofun_price', width: 32 },
    { header: 'loot', key: 'lootfarm_price', width: 30 },
    { header: 'etop/loot', key: 'eto_loot', width: 30 },
    { header: 'loot/etop', key: 'loot_eto', width: 30 },

  ];
  worksheet.addRows(table1);

  let worksheet2 = workbook.addWorksheet("etop_tradeit");
  worksheet2.columns = [
    { header: 'Name', key: 'name', width: 32 },
    { header: 'etop', key: 'etofun_price', width: 32 },
    { header: 'tradeit', key: 'tradeit_price', width: 30 },
    { header: 'etop/tradeit', key: 'eto_tradeit', width: 30 },
    { header: 'tradeit/etop', key: 'tradeit_eto', width: 30 },

  ];
  worksheet2.addRows(table2);

  let worksheet3 = workbook.addWorksheet("loot_tradeit");
  worksheet3.columns = [
    { header: 'Name', key: 'name', width: 32 },
    { header: 'loot', key: 'lootfarm_price', width: 32 },
    { header: 'tradeit', key: 'tradeit_price', width: 30 },
    { header: 'loot/tradeit', key: 'loot_tradeit', width: 30 },
    { header: 'tradeit/loot', key: 'tradeit_loot', width: 30 },

  ];
  worksheet3.addRows(table3);
  await workbook.xlsx.writeFile("./data/data.xlsx")
  const file = './auth.json';

  const scope = ['https://www.googleapis.com/auth/drive'];

  const auth = new google.auth.GoogleAuth({
    keyFile: file,
    scopes: scope
  });
  const drive = google.drive({
    version: 'v3',
    auth
  })
  let fileMetadata = {
    'name': 'data.xlsx',
    'parents': ['18K_pWTnEJv6yipPsylhd1b9amGvc4YCJ']
  }
  var media = {
    mimeType: 'application/vnd.ms-excel',
    body: fs.createReadStream('data/data.xlsx')
  };
  // create request
  let res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  })
  if (res.status == 200) {
    return res.data.id
  }
}
// crawlPage2()


app.listen(process.env.PORT || 5000, (req, res) => {
  console.log("server chay o port 9000");
})

// app.use(function (req, res) {
//   var delayed = new DelayedResponse(req, res);
//   slowFunction(delayed.wait());
// });
// const extendTimeoutMiddleware = (req, res, next) => {
//   const space = ' ';
//   let isFinished = false;
//   let isDataSent = false;

//   // Only extend the timeout for API requests
//   if (!req.url.includes('/')) {
//     next();
//     return;
//   }

//   res.once('finish', () => {
//     isFinished = true;
//   });

//   res.once('end', () => {
//     isFinished = true;
//   });

//   res.once('close', () => {
//     isFinished = true;
//   });

//   res.on('data', (data) => {
//     // Look for something other than our blank space to indicate that real
//     // data is now being sent back to the client.
//     if (data !== space) {
//       isDataSent = true;
//     }
//   });

//   const waitAndSend = () => {
//     setTimeout(() => {
//       // If the response hasn't finished and hasn't sent any data back....
//       if (!isFinished && !isDataSent) {
//         // Need to write the status code/headers if they haven't been sent yet.
//         if (!res.headersSent) {
//           res.writeHead(202);
//         }

//         res.write(space);

//         // Wait another 15 seconds
//         waitAndSend();
//       }
//     }, 15000);
//   };

//   waitAndSend();
//   next();
// };

// app.use(extendTimeoutMiddleware);

app.get('/', async (req, res) => {
  console.log("hello");
  let id = await crawlPage2();
  console.log(id);
  res.end('https://docs.google.com/spreadsheets/d/' + id)
  // return res.json({status:'success',data:"hello"});
})

// bot.hears('crawl', async ctx => {
//   console.log(ctx.from)
//   let animalMessage = `crawling...`;
//   bot.telegram.sendMessage(ctx.chat.id,animalMessage)
//   let id = await crawlPage2();
//   console.log(id);
//   bot.telegram.sendMessage(ctx.chat.id, 'https://docs.google.com/spreadsheets/d/' + id, {
//   })
// })

// bot.launch();