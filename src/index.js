import { getTokens } from './coinmarketcup';

async function index() {
  console.log('*************************');
  const tokens = await getTokens(1, 1).then((r) => console.log(r));

  // for (let i = 0; i < tokens.length; i++) {
  //   const item = feedItems[i];
  //   await addTokenToNotion(item);
  // }
}

index();
