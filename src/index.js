import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import { languages2 } from '../programming-langs2';
import { getTokens } from './coinmarketcup';
import {
  getGihubRepos,
  getMarkdownFromRepo,
  getPackageJsonFromRepo
} from './github';
import LoggerInstance from './loging';
import {
  addRepsoitoryToNotion,
  addTokenToNotion, getLastContentDowloadedTokenId, getLastRepositoryTokenId, getLastTokenId, getNotionTokensWithSites, getNotionTokensWithSourceCode
} from './notion';
import { getSiteData } from './siteScraper';

// ******************** DOWNLOAD TOKENS FROM COINMARKETCAP TO NOTION ***********************


async function migrateFromCoinmarketCap() {
  const requestLimitPerDay = 333;
  const limit = 99;
  try {
    await LoggerInstance.cleanLogs();
    for (let d = 0; d < requestLimitPerDay; d++) {
      await LoggerInstance.logInfo('NEW CYCLE: ' + d);
      const lastTokenId = await getLastTokenId();
      await LoggerInstance.logInfo(
        'migrateFromCoinmarketCap LAST TOKEN ID: ' + lastTokenId
      );
      const tokens = await getTokens(lastTokenId + 1, lastTokenId + limit);
      for (let i = 0; i < tokens.length; i++) {
        await LoggerInstance.logInfo(
          'migrateFromCoinmarketCap START ADDING TOKEN TO NOTION: ' +
            tokens[i].id +
            ` (${tokens[i].name} )`
        );
        await addTokenToNotion(tokens[i]);
        await LoggerInstance.logInfo(
          'migrateFromCoinmarketCap TOKEN ADDED SUCCESFULY: ' +
            ` (${tokens[i].name} )`
        );
      }
    }
    await LoggerInstance.logInfo('migrateFromCoinmarketCap DONE');
  } catch (error) {
    await LoggerInstance.logError(
      `migrateFromCoinmarketCap \n\n ${error.message}, \n\n ${error.stack}`
    );
    throw new Error("TOKEN NOT ADDED");
  }
}

// ******************** DOWNLOAD REPOS FROM GITHUB TO NOTION ***********************


async function downloadProjectRepositories() {
  const amountRequest = 1;
  const limit = 100;
  try {
    await LoggerInstance.cleanLogs();
    const lastTokenId = await getLastRepositoryTokenId();
    await LoggerInstance.logInfo(
      'downloadProjectRepositories: LAST TOKEN ID: ' + lastTokenId
    );
    for (let i = 0; i < amountRequest; i++) {

      const tokens = await getNotionTokensWithSourceCode(lastTokenId + 1, lastTokenId + limit);
      await LoggerInstance.logInfo(
        `getNotionTokensWithSourceCode: Length: ${tokens.length} \n\n ${JSON.stringify(tokens)}`
      );
      for (let j = 0; j < tokens.length; j++) {
        await LoggerInstance.logInfo(
          'downloadProjectRepositories PROCESSING: ' +
            `ID: ${tokens[j].properties.Id.number} TOKEN: ${tokens[j].properties.Name.title[0].text.content}`
        );
        const githubLinks =
          tokens[j].properties.SourceCode.rich_text[0].plain_text.split(',');
        await asyncForEach(githubLinks, async (link) => {
          await LoggerInstance.logInfo(
            'downloadProjectRepositories GETTING REPOS: ' + link
          );
          const repos = await getGihubRepos(link);
          if (repos && Array.isArray(repos)) {
            await LoggerInstance.makeReport(repos);
            await asyncForEach(repos, async (repo, index) => {
              await LoggerInstance.logInfo(
                `downloadProjectRepositories TRYING TO SAVE REPO TO NOTION ${repo.name}: \n\n` +
                  JSON.stringify(repo),
                false
              );
              await addRepsoitoryToNotion(tokens[j], repo);
            });
          } else {
            await LoggerInstance.logInfo(
              `downloadProjectRepositories NO REPOS FOR LINK: ${link}`
            );
          }
        });
      }
    }
    await LoggerInstance.logInfo('downloadProjectRepositories DONE');
  } catch (error) {
    await LoggerInstance.logError(
      `downloadProjectRepositories \n\n ${error.message} \n\n ${error.stack}`
    );
    throw new Error("TOKEN NOT ADDED");
  }
}


// ***************** UTILS ***************
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
async function generateJsonExtentationFile() {
  let tempObj = {};
  Object.entries(languages2).forEach(([key, value]) => {
    tempObj[value.defaultExtension] = { name: key, ids: value.ids };
    return tempObj;
  });
  await fs.writeFile(
    '/Users/andreivaulin/Projects/crypto-projects-notion-list/ext.json',
    JSON.stringify(tempObj)
  );
}

async function scrapSiteData() {
  const requestsAmount = 1;
  const limit = 100;
  try {
    await LoggerInstance.cleanLogs();
    const lastTokenId = await getLastContentDowloadedTokenId();
    await LoggerInstance.logInfo(
      'downloadProjectRepositories: LAST TOKEN ID: ' + lastTokenId
    );
    for (let i = 0; i < scrapAmountRequest2; i++) {
      await LoggerInstance.logInfo(
        'scrapSiteData NEW CYCLE: ' +
        ` offset: ${i * limit2 || 1} limit: ${limit2}`
      );
      const tokens = await getNotionTokensWithSites(lastTokenId + 1, lastTokenId + 100);
      let resp = {};
      for (let j = 0; j < tokens.length; j++) {
        await LoggerInstance.logInfo(
          'scrapSiteData PROCESSING: ' +
          `ID: ${tokens[j].properties.Id.number} TOKEN: ${tokens[j].properties.Name.title[0].text.content}`
        );
        const websites =
          tokens[j].properties.Website.rich_text[0].plain_text.split(',');

        await asyncForEach(websites, async (link) => {
          await LoggerInstance.logInfo(
            'getInformationFromSite: ' + link
          );
          resp = await getSiteData(link, tokens[j].properties.Name.title[0].text.content, tokens[j].properties.Id.number);

          // if (repos && Array.isArray(repos)) {
          //   await LoggerInstance.makeReport(repos);
          //   await asyncForEach(repos, async (repo, index) => {
          //     await LoggerInstance.logInfo(
          //       `scrapSiteData TRYING TO SAVE REPO TO NOTION ${repo.name}: \n\n` +
          //         JSON.stringify(repo),
          //       false
          //     );
          //     await addRepsoitoryToNotion(tokens[j], repo);
          //   });
          // } else {
          //   await LoggerInstance.logInfo(
          //     `scrapSiteData NO REPOS FOR LINK: ${link}`
          //   );
          // }
        });
      }
      resp.browser.close();
    }
    await LoggerInstance.logInfo('scrapSiteData DONE');
  } catch (error) {
    console.log(error);
    await LoggerInstance.logError(
      `scrapSiteData \n\n ${error.message} \n\n ${error.stack}`
    );
  }
}


// ***************** RUN ***************

// await migrateFromCoinmarketCap();
// await downloadProjectRepositories();
// await generateJsonExtentationFile();
// await scrapSiteData()






// **************** TESTS *****************

async function testRepo() {
  const links = ['https://github.com/casinocoin/casinocoin-mobile'];
  await asyncForEach(links, async (link) => {
    const repos = await getGihubRepos();
    await addRepsoitoryToNotion(repos[0]);
  });
}
