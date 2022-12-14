import fs from 'fs/promises';
import { languages2 } from '../programming-langs2';
import { getTokens } from './coinmarketcup';
import { getCrowdSalesFromCryptoRank, getIdoPlatforms, getTagsFromCryptoRank, getTokensFromCryptoRank } from "./cryptoRankApi";
import {
  getGihubRepos,
  getMarkdownFromRepo, getOpenAIProjects, getPackageJsonFromRepo
} from './github';
import LoggerInstance from './loging';
import { addAIProjectToNotion, addCoinmarketcupTokenToNotion, addFundToNotion, addIDOtoNotion, addRepsoitoryToNotion, getLastContentDowloadedTokenId, getLastRepositoryTokenId, getLastTokenId, getNotionTokensWithSites, getNotionTokensWithSourceCode } from './notion';
import { getSiteData } from './siteScraper';


// **************************** MAIN **********************

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
        await addCoinmarketcupTokenToNotion(tokens[i]);
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
            await LoggerInstance.makeReportForGitRepository(repos);
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
          //   await LoggerInstance.makeReportForGitRepository(repos);
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

async function migrateFromCryptoRank() {
  try {
    await LoggerInstance.cleanLogs();
    let fundsMap = {};
    let idoMap = {};
    const funds = await getFundsFromCryptoRank();
    await asyncForEach(funds, async (item) => {

      const pageId = await addFundToNotion(item);
      fundsMap[item.id] = pageId;
    });
    const idoPlatforms = await getIdoPlatforms();
    await asyncForEach(idoPlatforms, async (item) => {

      const pageId = await addIDOtoNotion(item);

    });
    const tags = getTagsFromCryptoRank();
    const crowdsales = getCrowdSalesFromCryptoRank();
    const tokens = getTokensFromCryptoRank();




    //const tokensByIdoPlatforms = getTokensByIdoPlatformsFromCryptoRank(108);

    // const resp = await getNextjsObj("https://cryptorank.io/funds");
    // //LoggerInstance.logInfo(`migrateFromCryptoRank ${JSON.stringify(Object.keys(resp))}`);
    // const funds = resp.funds.props.pageProps.funds.map(r => {
    //   return {
    //     name: r.name,
    //     slug: r.slug,
    //     id: r.id,
    //   }
    // })
    // await asyncForEach(funds.slice(0, 1), async (item) => {
    //   const fund = await getNextjsObj(`https://cryptorank.io/funds/${item.slug}`);
    //   //await addFundToNotion(item);
    // })
    // await LoggerInstance.logInfo(`migrateFromCryptoRank ${JSON.stringify(funds)}`);
    // resp.browser.close();
    await LoggerInstance.logInfo('migrateFromCryptoRank DONE');
  } catch (error) {
    await LoggerInstance.logError(
      `migrateFromCryptoRank \n\n ${error.message}, \n\n ${error.stack}`
    );
  }
}

async function getOpenAIprojects() {
  try {
    await LoggerInstance.cleanLogs();
    const projects = await getOpenAIProjects();
    await LoggerInstance.logInfo('getOpenAIprojects Total AI Projects: ' + projects.length);
    await asyncForEach(projects, async (item) => {
      await addAIProjectToNotion(item);
    });
    await LoggerInstance.logInfo('getOpenAIprojects DONE');
  } catch (error) {
    await LoggerInstance.logError(
      `getOpenAIprojects \n\n ${error.message}, \n\n ${error.stack}`
    );
  }
}



// ***************** RUN ***************

// await migrateFromCoinmarketCap();
// await downloadProjectRepositories();
// await generateJsonExtentationFile();
// await scrapSiteData()
// await migrateFromCryptoRank();
await getOpenAIprojects();





// **************** TESTS *****************


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

async function testRepo() {
  const links = ['https://github.com/casinocoin/casinocoin-mobile'];
  await asyncForEach(links, async (link) => {
    const repos = await getGihubRepos();
    await addRepsoitoryToNotion(repos[0]);
  });
}
