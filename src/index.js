import { getTokens } from './coinmarketcup';
import {
  addTokenToNotion,
  getLastToken,
  getNotionTokensWithSourceCode,
} from './notion';
import {
  getGihubRepos,
  getPackageJsonFromRepo,
  getMarkdownFromRepo,
} from './github';
import puppeteer from 'puppeteer-core';

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
const limit = 10;
async function generateUIList() {
  for (let i = 0; i < amountRequest; i++) {
    const tokens = await getNotionTokensWithSourceCode(i * 10 || 1, limit);
    console.log(
      tokens.results[0].properties.SourceCode.rich_text[0].plain_text
    );

    for (let j = 0; j < tokens.results.length; j++) {
      const githubLinks =
        tokens.results[j].properties.SourceCode.rich_text[0].plain_text.split(
          ','
        );
      let repos = [];
      console.log(githubLinks, 'LINKS ARR********************************');
      await asyncForEach(githubLinks, async (link) => {
        console.log(link, 'LINK*************************************');
        const rep = await getGihubRepos(link);
        repos = [...rep, ...repos];
      });
      console.log(repos, 'END************************************************');

      // for (let k = 0; k < repos.length; k++) {
      //   console.log(repos[k], 'REPO*************************************');
      //   const getPackageJson = await getPackageJsonFromRepo(repos[k]);
      //   console.log(getPackageJson);
      //   const getMarkdown = await getMarkdownFromRepo(repos[k]);
      //   console.log(getMarkdown);
      //   await saveGitFilesToNotion(
      //     getPackageJson,
      //     getMarkdown,
      //     tokens[j],
      //     repos[k]
      //   );
      // }
    }
  }
}
generateUIList();

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