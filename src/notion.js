import dotenv from 'dotenv';
import { Client, LogLevel } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

dotenv.config();

const {
  NOTION_API_TOKEN,
  NOTION_TOKENS_DATABASE_ID,
  NOTION_GITHUB_DATABASE_ID,
} = process.env;

const notion = new Client({
  auth: NOTION_API_TOKEN,
});

export async function addTokenToNotion(notionItem) {
  console.log(notionItem.id, '******************************************');

  try {
    const tags1 = notionItem['tag-names'] ? notionItem['tag-names'] : [];
    const tags2 = notionItem.self_reported_tags
      ? notionItem.self_reported_tags
      : [];
    const tags = [...new Set([...tags1, ...tags2])].map((tag) => {
      return { name: tag };
    });
    await notion.pages.create({
      parent: {
        database_id: NOTION_TOKENS_DATABASE_ID,
      },
      icon: {
        external: {
          url: notionItem.logo,
        },
      },
      //   cover: {
      //     type: 'external',
      //     external: {
      //       url: image,
      //     },
      //   },
      properties: {
        Id: {
          number: notionItem.id,
        },
        Name: {
          title: [
            {
              text: {
                content: `${notionItem.name} (${notionItem.symbol})`,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.description || '',
              },
            },
          ],
        },
        Tags: {
          multi_select: tags,
        },
        Category: {
          select: {
            name: notionItem.category
              ? capitalizeFirstLetter(notionItem.category)
              : '',
          },
        },
        Platform: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.platform
                  ? `${notionItem.platform.name} (${notionItem.platform.symbol})`
                  : 'No Platform',
              },
            },
          ],
        },
        Website: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.website.join(', ') || '',
              },
            },
          ],
        },
        Documentation: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.technical_doc.join(', ') || '',
              },
            },
          ],
        },
        SourceCode: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.source_code.join(', ') || '',
              },
            },
          ],
        },
        Twitter: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.twitter.join(', ') || '',
              },
            },
          ],
        },
        Reddit: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.reddit.join(', ') || '',
              },
            },
          ],
        },
        MessageBoard: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.message_board.join(', ') || '',
              },
            },
          ],
        },
        Announcement: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.announcement.join(', ') || '',
              },
            },
          ],
        },
        Сhat: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.chat.join(', ') || '',
              },
            },
          ],
        },
        Explorer: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.urls.explorer.join(', ') || '',
              },
            },
          ],
        },
        Slug: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: notionItem.slug,
              },
            },
          ],
        },
        DateLanched: {
          date: {
            start: notionItem.date_lanched || notionItem.date_added,
          },
        },
        // children: [
        //   {
        //     object: 'block',
        //     type: 'embed',
        //     embed: {
        //       url: link,
        //     },
        //   },
        // ],
      },
    });
  } catch (err) {
    console.error(err);
  }
  console.log('**********added*********');
}

export async function getLastToken() {
  let response;
  try {
    response = await notion.databases.query({
      database_id: NOTION_TOKENS_DATABASE_ID,
      sorts: [
        {
          property: 'Id',
          direction: 'descending',
        },
      ],
      page_size: 1,
      // filter: {
      //   or: [
      //     {
      //       property: 'Enabled',
      //       checkbox: {
      //         equals: true,
      //       },
      //     },
      //   ],
      // },
    });
  } catch (err) {
    console.error(err);
    return response;
  }

  //   const tokenIds = response.results.map((item) => ({
  //     id: item.properties.Id.number,
  //   }));

  return response.results[0].properties.Id.number;
}

export async function getNotionTokensWithSourceCode(startId = 0, limit = 100) {
  let response;
  try {
    response = await notion.databases.query({
      database_id: NOTION_TOKENS_DATABASE_ID,
      page_size: limit,
      filter: {
        and: [
          {
            property: 'Id',
            number: {
              greater_than: startId,
            },
          },
          {
            property: 'Id',
            number: {
              less_than: limit,
            },
          },
          {
            property: 'SourceCode',
            rich_text: {
              is_not_empty: true,
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error(err);
  }
  //7291,6845, 6831,6780, 7509, 7546
  //
  //   const tokenIds = response.results.map((item) => ({
  //     id: item.properties.Id.number,
  //   }));

  return response;
}

const n2m = new NotionToMarkdown({ notionClient: notion });

async function addContent(pageId) {
  console.log(pageId);
}

async function addSitePicture(id) {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        children: {
          checkbox: true,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }
}

//capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
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
