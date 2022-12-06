// import dotenv from 'dotenv';
// import { Client, LogLevel } from '@notionhq/client';

// dotenv.config();

// const {
//   NOTION_API_TOKEN,
//   NOTION_TOKENS_DATABASE_ID,
//   NOTION_GITHUB_DATABASE_ID,
//   CI,
// } = process.env;

// const logLevel = CI ? LogLevel.INFO : LogLevel.DEBUG;

// export async function getTokensIdFromNotion() {
//   const notion = new Client({
//     auth: NOTION_API_TOKEN,
//     logLevel,
//   });

//   let response;
//   try {
//     response = await notion.databases.query({
//       database_id: NOTION_TOKENS_DATABASE_ID,
//       // filter: {
//       //   or: [
//       //     {
//       //       property: 'Enabled',
//       //       checkbox: {
//       //         equals: true,
//       //       },
//       //     },
//       //   ],
//       // },
//     });
//   } catch (err) {
//     console.error(err);
//     return [];
//   }

//   const tokenIds = response.results.map((item) => ({
//     id: item.properties.Id,
//     name: item.properties.Name,
//     github: item.properties.SourceCode,
//   }));

//   return tokenIds;
// }

// export async function addTokenToNotion(notionItem) {
//   const {
//     title,
//     link,
//     categories,
//     creator,
//     content,
//     contentSnippet,
//     description,
//     image,
//   } = notionItem;

//   const notion = new Client({
//     auth: NOTION_API_TOKEN,
//     logLevel,
//   });

//   try {
//     await notion.pages.create({
//       parent: {
//         database_id: NOTION_TOKENS_DATABASE_ID,
//       },
//       cover: {
//         type: 'external',
//         external: {
//           url: image,
//         },
//       },
//       properties: {
//         Title: {
//           title: [
//             {
//               text: {
//                 content: title,
//               },
//             },
//           ],
//         },
//         Link: {
//           url: link,
//         },
//         Categories: {
//           multi_select: categories.map((r) => ({ name: r })),
//         },
//         Creator: {
//           rich_text: [
//             {
//               type: 'text',
//               text: {
//                 content: creator,
//               },
//             },
//           ],
//         },
//         ContentSnippet: {
//           rich_text: [
//             {
//               type: 'text',
//               text: {
//                 content: contentSnippet.substring(0, 1000),
//               },
//             },
//           ],
//         },
//         Description: {
//           rich_text: [
//             {
//               type: 'text',
//               text: {
//                 content: description ? JSON.stringify(description) : '',
//               },
//             },
//           ],
//         },
//       },
//       children: [
//         {
//           object: 'block',
//           type: 'embed',
//           embed: {
//             url: link,
//           },
//         },
//       ],
//     });
//   } catch (err) {
//     console.error(err);
//   }
// }

// // format:
// // block_full_width: false
// // block_height: 930
// // block_page_width: true
// // block_preserve_scale: false
// // block_width: 672
// // display_source: "https://news.bitcoin.com/nigerian-fintech-founder-african-fintechs-have-a-greater-scale-potential-than-other-tech-startups/"

// // format?: {
// //   block_width: number
// //   block_height: number
// //   display_source: string
// //   block_full_width: boolean
// //   block_page_width: boolean
// //   block_aspect_ratio: number
// //   block_preserve_scale: boolean
// // }
// // file_ids?: string[]
// // }
// // export async function getExistingPages(items) {
// //   const notion = new Client({
// //     auth: NOTION_API_TOKEN,
// //     logLevel,
// //   });
// //   const response = await notion.databases.query({
// //     database_id: NOTION_READER_DATABASE_ID,
// //     or: items.map((item) => ({
// //       property: 'Link',
// //       text: {
// //         equals: item.link,
// //       },
// //     })),
// //   });

// //   return response.results;
// // }

// // export async function deleteOldUnreadFeedItemsFromNotion() {
// //   const notion = new Client({
// //     auth: NOTION_API_TOKEN,
// //     logLevel,
// //   });

// //   // Create a datetime which is 30 days earlier than the current time
// //   const fetchBeforeDate = new Date();
// //   fetchBeforeDate.setDate(fetchBeforeDate.getDate() - 5);

// //   // Query the feed reader database
// //   // and fetch only those items that are unread or created before last 30 days
// //   let response;
// //   try {
// //     response = await notion.databases.query({
// //       database_id: NOTION_READER_DATABASE_ID,
// //       filter: {
// //         and: [
// //           {
// //             property: 'Created At',
// //             date: {
// //               on_or_before: fetchBeforeDate.toJSON(),
// //             },
// //           },
// //           {
// //             property: 'Read',
// //             checkbox: {
// //               equals: false,
// //             },
// //           },
// //         ],
// //       },
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     return;
// //   }

// //   // Get the page IDs from the response
// //   const feedItemsIds = response.results.map((item) => item.id);

// //   for (let i = 0; i < feedItemsIds.length; i++) {
// //     const id = feedItemsIds[i];
// //     try {
// //       await notion.pages.update({
// //         page_id: id,
// //         archived: true,
// //       });
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   }
// // }
