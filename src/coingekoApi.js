import axios from 'axios';

export const getCryptoData = async () => {
  const json = await axios('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getGlobalData = async () => {
  const json = await axios('https://api.coingecko.com/api/v3/global')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getSearch = async (id) => {
  const json = await axios(`https://api.coingecko.com/api/v3/search?query=${id}`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getCoinList = async () => {
  const json = await axios('https://api.coingecko.com/api/v3/coins/list?include_platform=false')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getTrendingCoins = async () => {
  const json = await axios('https://api.coingecko.com/api/v3/search/trending')
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getCoinInfo = async (id) => {
  const json = await axios(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&market_data=true&community_data=true&developer_data=true&sparkline=false`)
    .then((response) => response)
    .catch(() => 'error');
  return json
}

export const getExchanges = async (id) => {
  const json = await axios('https://api.coingecko.com/api/v3/exchanges?per_page=250&page=1')
    .then((response) => response)
    .catch(() => 'error');
  return json;
}