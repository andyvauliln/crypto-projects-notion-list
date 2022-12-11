import { Client, LogLevel } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import util from 'util';
import { getDescriptions } from './NotionParser';

dotenv.config();

const { NOTION_API_TOKEN, NOTION_TOKENS_DATABASE_ID, NOTION_JS_DATABASE_ID } =
  process.env;

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
                content: notionItem.description
                  ? notionItem.description.slice(0, 2000)
                  : '',
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

export async function saveRepsoitoryToNotion(token, repository) {
  try {
    if (repository.name !== 'copay-lite') {
      return;
    }
    const readmeBlocks = generateReadme(repository.readme);
    try {
      await fs.writeFile(
        `/Users/andreivaulin/Projects/crypto-projects-notion-list/${repository.name}.json`,
        JSON.stringify(readmeBlocks)
      );
      // file written successfully
    } catch (err) {
      console.error(err);
    }

    const packageDescription = getPackageDesriptionBlock(
      repository.pakageDescriptions
    );
    console.log('Start processing', repository.name);
    let notionObj = {
      parent: {
        database_id: NOTION_JS_DATABASE_ID,
      },
      icon: {
        external: {
          url: token.icon.external.url,
        },
      },
      properties: {
        Id: {
          number: token.properties.Id.number,
        },
        RepositoryName: {
          title: [
            {
              text: {
                content: repository.name,
              },
            },
          ],
        },
        ProjectName: {
          relation: [
            {
              id: token.id,
            },
          ],
        },
        Repository: {
          url: repository.url,
        },
        Topics: {
          multi_select: repository.topics,
        },
        IsFork: {
          checkbox: repository.isFork,
        },
        Description: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: repository.description
                  ? repository.description.slice(0, 2000)
                  : '',
              },
            },
          ],
        },
        Packages: {
          multi_select: repository.packages
            .map((r) => {
              return { name: r };
            })
            .slice(0, 100),
        },
        Language: { select: { name: repository.language } },
        HomePage: {
          url: repository.homepage || null,
        },
        Commits: {
          number: repository.commits,
        },
        Stars: {
          number: repository.stars,
        },
        TotalFiles: {
          number: repository.files.totalFiles,
        },
        TotalJSFiles: {
          number: repository.files.totalJsFiles,
        },
        Forks: {
          number: repository.forks,
        },
        LastCommitDate: {
          date: {
            start: repository.lastCommitDate.slice(0, 10),
          },
        },
      },
      children: [
        packageDescription,
        ...repository.files.blocks,
        ...readmeBlocks,
      ],
    };
    //notionObj.children = notionObj.children.slice(0, 100);
    //console.log(notionObj.children.length, 'children length');
    // notionObj.children = [
    //   {
    //     toggle: {
    //       rich_text: [
    //         {
    //           type: 'text',
    //           text: { content: 'Support', link: null },
    //           annotations: { bold: true },
    //         },
    //       ],
    //       color: 'default',
    //       children: [
    //         {
    //           object: 'block',
    //           type: 'paragraph',
    //           paragraph: {
    //             rich_text: [
    //               {
    //                 type: 'text',
    //                 annotations: {
    //                   bold: false,
    //                   strikethrough: false,
    //                   underline: false,
    //                   italic: false,
    //                   code: false,
    //                   color: 'default',
    //                 },
    //                 text: { content: 'Please see ' },
    //               },
    //               {
    //                 type: 'text',
    //                 annotations: {
    //                   bold: false,
    //                   strikethrough: false,
    //                   underline: false,
    //                   italic: false,
    //                   code: false,
    //                   color: 'default',
    //                 },
    //                 text: {
    //                   content: 'Support requests',
    //                   link: { type: 'url', url: 'CONTRIBUTING.md#support' },
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //       ],
    //     },
    //   },
    // ];
    const createdPage = await notion.pages.create(notionObj);
    // console.log(createdPage, 'createdPage');
    console.log('**********Saved*********', repository.name);
  } catch (err) {
    console.error(err);
  }
}

function generateReadme(repository) {
  const blocks = markdownToBlocks(repository);
  const indexes = [];
  blocks.forEach((item, index) => {
    if (item.type === 'heading_2') {
      indexes.push(index);
    }
  });
  let chunked_arr = [];
  if (indexes.length > 0 && indexes[0] < blocks.length) {
    chunked_arr = [...chunked_arr, ...blocks.slice(0, indexes[0])];
    for (let i = 0; i < indexes.length; i++) {
      const size = indexes[i + 1] || blocks.length;

      const arr = blocks.slice(indexes[i] + 1, size);

      if (arr.length) {
        if (arr.length > 100) {
          const subArr = [];
          for (let j = 0; j < arr.length; j += 100) {
            console.log('***************************************************');
            console.dir(arr.slice(j, j + 100), { depth: null });
            subArr.push({
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: '',
                      link: null,
                    },
                  },
                ],
                color: 'default',
                children: arr.slice(j, j + 100),
              },
            });
          }
          chunked_arr.push({
            toggle: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content:
                      blocks[indexes[i]].heading_2.rich_text[0].text.content,
                    link: null,
                  },
                  annotations: {
                    bold: true,
                  },
                },
              ],
              color: 'default',
              children: subArr,
            },
          });
        } else {
          chunked_arr.push({
            toggle: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content:
                      blocks[indexes[i]].heading_2.rich_text[0].text.content,
                    link: null,
                  },
                  annotations: {
                    bold: true,
                  },
                },
              ],
              color: 'default',
              children: arr,
            },
          });
        }
      }
    }
  } else {
    chunked_arr = blocks.slice(0, 100);
  }
  //console.dir(chunked_arr, { depth: null });
  return chunked_arr;
}

function getPackageDesriptionBlock(packageObj) {
  const pd = Object.entries(packageObj).map(([key, value]) => {
    return `${key}: "${value}"`;
  });
  return {
    type: 'code',
    code: {
      rich_text: chunkContent(pd, 10).map((item) => {
        return {
          type: 'text',
          text: {
            content: item.join('\n'),
          },
        };
      }),
      language: 'javascript',
    },
  };
}

function chunkContent(files, size) {
  const chunked_arr = [];
  let index = 0;
  while (index < files.length) {
    chunked_arr.push(files.slice(index, size + index));
    index += size;
  }
  return chunked_arr;
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

  return response;
}

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

//create asyc function to get data from github
// function getGithubData() {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const response = await axios.get(
//         'https://api.github.com/users/notion',
//         {
//           headers: {

// }

// function to get data from github
function getGithubData() {
  console.dir('', { depth: nu });
}
