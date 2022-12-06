import CoinMarketCap from './coinmarketcuptApi';

const { COINMARKETCAP_API_TOKEN } = process.env;
const coinmarketcap = new CoinMarketCap(COINMARKETCAP_API_TOKEN);

//get tokens from coinmarketcap api
export async function getTokens(offset = 1, limit = 1) {
  return coinmarketcap.getIdMap({ limit: limit, sort: 'id', start: 1 });
}
