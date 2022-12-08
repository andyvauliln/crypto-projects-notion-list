'use strict';
import qs from 'qs';

const BASE_URL = 'https://pro-api.coinmarketcap.com';

export default class CoinMarketCap {
  /**
   *
   * @param {String} apiKey API key for accessing the CoinMarketCap API
   * @param {Object=} Options Options for the CoinMarketCap instance
   * @param {String=} options.version  Version of API. Defaults to 'v2'
   * @param {Function=} options.fetcher fetch function to use. Defaults to node-fetch
   * @param {Object=} options.config = Configuration for fetch request
   *
   */
  constructor(apiKey, { version = 'v1', config = {} } = {}) {
    this.apiKey = '5eea9bc2-0439-4ec3-a22f-012d33c6346a';
    this.config = Object.assign(
      {},
      {
        method: 'GET',
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'Accept-Encoding': 'deflate, gzip',
        },
      },
      config
    );

    this.url = `${BASE_URL}/${version}`;
  }

  /**
   * Get a paginated list of all cryptocurrencies by CoinMarketCap ID.
   *
   * @param {Object=} options Options for the request:
   * @param {String=} [options.listingStatus="active"] active or inactive coins
   * @param {Number|String=} [options.start=1] Return results from rank start and above
   * @param {Number|String=} options.limit Only returns limit number of results
   * @param {String[]|String=} options.symbol Comma separated list of symbols, will ignore the other options
   * @param {String=} [options.sort="id"] Sort results by the options at https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
   *
   * @example
   * const client = new CoinMarketCap('api key')
   * client.getIdMap().then(console.log).catch(console.error)
   * client.getIdMap({listingStatus: 'inactive', limit: 10}).then(console.log).catch(console.error)
   * client.getIdMap({symbol: 'BTC,ETH'}).then(console.log).catch(console.error)
   * client.getIdMap({symbol: ['BTC', 'ETH']}).then(console.log).catch(console.error)
   * client.getIdMap({sort: 'cmc_rank'}).then(console.log).catch(console.error)
   */
  getIdMap(args = {}) {
    let { listingStatus, start, limit, symbol, sort } = args;

    if (symbol instanceof Array) {
      symbol = symbol.join(',');
    }

    return createRequest({
      url: `${this.url}/cryptocurrency/map`,
      config: this.config,
      query: { listing_status: listingStatus, start, limit, symbol, sort },
    });
  }

  /**
   * Get static metadata for one or more cryptocurrencies.
   * Either id or symbol is required, but passing in both is not allowed.
   *
   * @param {Object=} options Options for the request:
   * @param {Array|String|Number=} options.id One or more comma separated cryptocurrency IDs
   * @param {String[]|String} options.symbol One or more comma separated cryptocurrency symbols
   *
   * @example
   * const client = new CoinMarketCap('api key')
   * client.getMetadata({id: '1'}).then(console.log).catch(console.error)
   * client.getMetadata({id: [1, 2]}).then(console.log).catch(console.error)
   * client.getMetadata({symbol: 'BTC,ETH'}).then(console.log).catch(console.error)
   * client.getMetadata({symbol: ['BTC', 'ETH']}).then(console.log).catch(console.error)
   */
  async getMetadata(args = {}) {
    return await createRequest({
      url: `${this.url}/cryptocurrency/info`,
      config: this.config,
      query: sanitizeIdAndSymbol(args.id, args.symbol),
    });
  }
}

const sanitizeIdAndSymbol = (id, symbol) => {
  if (id && symbol) {
    throw new Error('ID and symbol cannot be passed in at the same time.');
  }

  if (!id && !symbol) {
    throw new Error('Either ID or symbol is required to be passed in.');
  }

  if (id instanceof Array) {
    id = id.join(',');
  }

  if (symbol instanceof Array) {
    symbol = symbol.join(',');
  }

  return { id, symbol };
};

const createRequest = async (args = {}) => {
  const { url, config, query } = args;

  return (
    await fetch(`${url}${query ? `?${qs.stringify(query)}` : ''}`, config)
  ).json();
};
