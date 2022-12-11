import puppeteer from 'puppeteer-core';
import { getTokens } from './coinmarketcup';
import {
  getGihubRepos,
  getMarkdownFromRepo,
  getPackageJsonFromRepo,
} from './github';
import {
  addTokenToNotion,
  getLastToken,
  getNotionTokensWithSourceCode,
  saveRepsoitoryToNotion,
} from './notion';

const requestLimitPerDay = 333 - 90;
async function migrateFromCoinmarketCap() {
  try {
    for (let d = 0; d < requestLimitPerDay; d++) {
      console.log('*********************New Cycle****************************');
      const lastTokenId = await getLastToken();
      const tokens = await getTokens(lastTokenId + 1, lastTokenId + 98);
      for (let i = 0; i < tokens.length; i++) {
        await addTokenToNotion(tokens[i]);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

// migrateFromCoinmarketCap();

// async function getSitePrintScreen() {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('https://www.google.com');
//   await page.screenshot({ path: 'google.png' });

//   await browser.close();
// }

const amountRequest = 1;
const limit = 3;
async function downloadProjectRepositories() {
  for (let i = 0; i < amountRequest; i++) {
    const tokens = await getNotionTokensWithSourceCode(i * 10 || 1, limit);

    for (let j = 0; j < tokens.results.length; j++) {
      console.log(
        tokens.results[j].properties.Id.number,
        tokens.results[j].properties.Name.title[0].text.content,
        'Processsing*****'
      );
      const githubLinks =
        tokens.results[j].properties.SourceCode.rich_text[0].plain_text.split(
          ','
        );
      let repos = [];
      await asyncForEach(githubLinks, async (link) => {
        const rep = await getGihubRepos(link);
        repos = [...rep, ...repos];
      });

      for (let k = 0; k < repos.length; k++) {
        await saveRepsoitoryToNotion(tokens.results[j], repos[k]);
      }
    }
  }
}
downloadProjectRepositories();

function getArrray(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
