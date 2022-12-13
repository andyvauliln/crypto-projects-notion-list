import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
import { languages2 } from '../programming-langs2';
import { getTokens } from './coinmarketcup';
import {
  getGihubRepos,
  getMarkdownFromRepo,
  getPackageJsonFromRepo,
} from './github';
import LoggerInstance from './loging';
import {
  addRepsoitoryToNotion,
  addTokenToNotion,
  getLastToken,
  getNotionTokensWithSourceCode,
} from './notion';

// ******************** DOWNLOAD TOKENS FROM COINMARKETCAP TO NOTION ***********************

const requestLimitPerDay = 333 - 90;
async function migrateFromCoinmarketCap() {
  try {
    await LoggerInstance.cleanLogs();
    for (let d = 0; d < requestLimitPerDay; d++) {
      await LoggerInstance.logInfo('NEW CYCLE: ' + d);
      const lastTokenId = await getLastToken();
      await LoggerInstance.logInfo(
        'migrateFromCoinmarketCap LAST TOKEN ID: ' + lastTokenId
      );
      const tokens = await getTokens(lastTokenId + 1, lastTokenId + 98);
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
  }
}

// ******************** DOWNLOAD REPOS FROM GITHUB TO NOTION ***********************

const amountRequest = 1;
const limit = 50;
async function downloadProjectRepositories() {
  try {
    await LoggerInstance.cleanLogs();
    for (let i = 0; i < amountRequest; i++) {
      await LoggerInstance.logInfo(
        'downloadProjectRepositories NEW CYCLE: ' +
          ` offset: ${i * limit || 1} limit: ${limit}`
      );
      const tokens = await getNotionTokensWithSourceCode(i * limit || 1, limit);

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
    console.log(error);
    await LoggerInstance.logError(
      `downloadProjectRepositories \n\n ${error.message} \n\n ${error.stack}`
    );
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

// ***************** UTILS ***************
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// ***************** RUN ***************

// await migrateFromCoinmarketCap();
await downloadProjectRepositories();
//await generateJsonExtentationFile();

// **************** TESTS *****************

async function testRepo() {
  const links = ['https://github.com/casinocoin/casinocoin-mobile'];
  await asyncForEach(links, async (link) => {
    const repos = await getGihubRepos();
    await addRepsoitoryToNotion(repos[0]);
  });
}
