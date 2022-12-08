import CoinMarketCap from './coinmarketcuptApi';
import dotenv from 'dotenv';
dotenv.config();

const { COINMARKETCAP_API_TOKEN } = process.env;
const coinmarketcap = new CoinMarketCap(COINMARKETCAP_API_TOKEN);

//get tokens from coinmarketcap api
export async function getTokens(offset = 1, limit = 2) {
  let url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${getArrray(
    offset,
    limit
  ).join(',')}&CMC_PRO_API_KEY=${COINMARKETCAP_API_TOKEN}`;
  let items = {};
  let resp = {};
  try {
    resp = await fetch(url);
    items = await resp.json();
    if (
      items.status &&
      items.status.error_code === 400 &&
      items.status.error_message.indexOf('Invalid value') >= 0
    ) {
      const ecludedIds = items.status.error_message
        .split(' ')
        .slice(-1)[0]
        .replaceAll('"', '')
        .split(',');
      ecludedIds.forEach((id) => {
        url = url.replace(`,${id}`, '').replace(`${id},`, '');
      });
      resp = await fetch(url);
      items = await resp.json();
    }
  } catch (err) {
    console.log('*******************************', err);
  }

  return Object.values(items.data);
}

let amap = async (arr, fun) =>
  await Promise.all(arr.map(async (v) => await fun(v)));

function getArrray(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
} 
