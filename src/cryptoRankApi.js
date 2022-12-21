import axios from "axios";
import puppeteer from 'puppeteer';
import LoggerInstance from "./loging";

export async function getTokensFromCryptoRank(limit = 100) {
  const url = 'https://api.cryptorank.io/v0/coins';
  const response = await fetch(url);
  const data = await response.json();
  return data.data;
}
export async function getTokenBySlugFromCryptoRank(slug) {
  const url = `https://api.cryptorank.io/v0/coins/${slug}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.data;
}

export const getTrendingCoinsFromCryptoRank = async () => {
  const json = await axios('https://api.cryptorank.io/v0/coins/trending/by-clicks?dateFrom=2022-11-11&limit=8&locale=en')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getExchangesFromCryptoRank = async () => {
  const json = await axios('https://api.cryptorank.io/v0/exchanges')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getNewsFromCryptoRank = async () => {
  const json = await axios('https://api.cryptorank.io/v0/news?lang=en&limit=50&offset=0&sourceIds=28,7,23,33,37,24,39,4,20,32,12,34,25,6,11,1,27,9,14,3,22,42,2,36,5,19,40,21,8,18')
    .then((response) => response)
    .catch(() => 'error');
  return json
}
export const getFundsFromCryptoRank = async (withSummary = false) => {
  const json = await axios(`https://api.cryptorank.io/v0/coin-funds?withSummary=${withSummary}`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getIdoPlatforms = async (isFull = true) => {
  const json = await axios(`https://api.cryptorank.io/v0/ido-platforms?isFull=${isFull}`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}
export const getTokensPlatformsFromCryptoRank = async () => {
  const json = await axios(`https://api.cryptorank.io/v0/tokens/token-platforms`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}
export const getCrowdSalesFromCryptoRank = async () => {
  const json = await axios(`https://api.cryptorank.io/v0/coins/crowdsaless`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}
export const getTokensByIdoPlatformsFromCryptoRank = async (idoPlatformId, lifeCycle = "crowdsale,inactive,funding,traded") => {
  const json = await axios(`https://api.cryptorank.io/v0/coins?idoPlatformIds=${idoPlatformId}&lifeCycle=${lifeCycle}`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getCategoriesFromCryptoRank = async () => {
  const json = await axios(`https://api.cryptorank.io/v0/coin-categories`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}
export const getTagsFromCryptoRank = async () => {
  const json = await axios(`https://api.cryptorank.io/v0/coin-tags`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}


// const browser = await puppeteer.launch({
//   headless: false,
//   timeout: 100000
// });

// export const getNextjsObj = async (link) => {
//   try {


//     const page = await browser.newPage();
//     await page.goto(link, {
//       waitUntil: 'networkidle0'
//     });
//     const select = await page.waitForSelector('#__NEXT_DATA__');
//     // LoggerInstance.logInfo(`getNextjsObj = ${JSON.stringify(select)} }`);

//     const resp = await page.evaluate(() => {
//       const nextObj = document.getElementById('__NEXT_DATA__');
//       const nextData = JSON.parse(nextObj.textContent);
//       return nextData;
//     });
//     //LoggerInstance.logInfo(`getNextjsObj = ${JSON.stringify(resp)} `)

//     return { funds: resp, browser };
//   } catch (error) {
//     LoggerInstance.logError(`ERROR gettingNextjsObj  ${link} \n\n ${error.message} \n\n ${error.stack}`)
//     return { browser };
//   }
// }

//https://api.cryptorank.io/v0/coin-funds?withSummary=true
//https://api.cryptorank.io/v0/analytics/ieo-platforms-roi
//https://api.cryptorank.io/v0/coins/crowdsales
//https://api.cryptorank.io/v0/news?lang=en&limit=50&offset=0&sourceIds=28,7,23,33,37,24,39,4,20,32,12,34,25,6,11,1,27,9,14,3,22,42,2,36,5,19,40,21
// https://api.cryptorank.io/v0/exchanges
//https://api.cryptorank.io/v0/search
// https://api.cryptorank.io/v0/coins?type=fiat&locale=en
//https://api.cryptorank.io/v0/ido-platforms?isFull=true
//https://api.cryptorank.io/v0/coin-categories
// https://api.cryptorank.io/v0/coin-tags
//https://api.cryptorank.io/v0/coins/trending/by-clicks?dateFrom=2022-12-07&limit=7&locale=en


//https://api.cryptorank.io/v0/coins?lifeCycle=funding,crowdsale,traded,inactive&withFundingRoundsData=true&onlyWithFundingRounds=true


//https://api.cryptorank.io/v0/global

//https://api.cryptorank.io/v0/fund-chart/crypto-fundraising-activity?groupBy=month&startDate=2020-12-14&endDate=2022-12-14


//https://api.cryptorank.io/v0/fund-chart/most-active-funds
//https://api.cryptorank.io/v0/fund-chart/fundraising-rounds-by-stage?endDate=2022-12-14
//https://api.cryptorank.io/v0/fund-chart/monthly-funding-investment-by-category?groupBy=month&endDate=2022-12-14
//https://api.cryptorank.io/v0/fund-chart/number-of-funding-rounds-by-investor-and-category?endDate=2022-12-14

//https://api.cryptorank.io/v0/coin-funds/
//https://api.cryptorank.io/v0/coin-funds/28/total-amount-co-investments
//https://api.cryptorank.io/v0/coin-funds/28/co-funds

//https://api.cryptorank.io/v0/charts/prices-by-coin?keys=matic-network,flow,sandbox,axie-infinity,decentraland,immutable-x,mask-network,harmony,safepal,mobox,alien-worlds,yield-guild-games,bloktopia,star-atlas,gamefi,super-farm,astrafer,boson-protocol,mines-of-dalarnia,wilder-world,guildfi,splinterlands,highstreet,derace,xdefi-wallet,cantinaroyale,wrapped-ncg,cudostoken,revv,cheqd,aurory,wombat,blockchainspace,quidd,sidus-heroes,tower,thetan-gem,defi-land,atari,stader,sport,chainguardians,mydefipet,dose,undead-blocks,genopets,epik-prime,klaycity,unicly,primate,blockchain-monster-hunt,jenny-metaverse-dao-token,rainmaker-games,perion,sidus-heroes-senate,sportium,xy-finance,froyo-games,lympo,plotx,avocado-dao-token,galaxy-fight-club,dappt,only1,utu,cryowar,freshcut,rebelbots,altava,dogami,drunk-robots,tune-fm,monox-protocol,unique-network,ost,solice,crypto-prophecies,zodium,mobland,wingriders,kyoko,warena,domi-online,defy,starly,envelop,madworld,mymasterwar,space-misfits,forest-knight,amasa,99-starz,legends-of-elumia,launchblock,good-games-guild,dehorizon,nova-finance,vera-defi,games-pad,kingdom-karnage&days=7
//https://api.cryptorank.io/v0/analytics/gainers-losers-for-coins-group?from=2022-12-13&fundId=28
//https://api.cryptorank.io/v0/analytics/volume-for-coins-group?fundId=28&from=2022-11-14
//https://api.cryptorank.io/v0/tokens/token-platforms