import { Client, LogLevel } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import util from 'util';
import ext from '../ext.json';
import LoggerInstance from './loging.js';
import { markdownToBlocks } from './notionParserJs/index.js';

dotenv.config();

const { NOTION_API_TOKEN, NOTION_TOKENS_DATABASE_ID, NOTION_JS_DATABASE_ID } =
  process.env;

const notionLoging = (logLevel, message, extraInfo) => {
  if (logLevel === 'error' || logLevel === 'warn') {
    LoggerInstance.logError(
      `\n NOTION ERROR\n\n${message}\n\n ${JSON.stringify(extraInfo)}`
    );
  }
  // else {
  //   LoggerInstance.logInfo(
  //     `\n NOTION LOGLEVEL: ${logLevel} \n\n${message} \n\n ${JSON.stringify(
  //       extraInfo
  //     )}`,
  //     false
  //   );
  // }
};
const notion = new Client({
  auth: NOTION_API_TOKEN,
  logLevel: LogLevel.DEBUG,
  // logger: notionLoging,
});

//************************  GETTERS  ************************** */
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
  } catch (error) {
    await LoggerInstance.logError(
      `getNotionTokensWithSourceCode (${startId}, ${limit}):\n\n ${error.message} \n\n ${error.stack}`
    );
    return [];
  }

  return response.results || [];
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
    });
  } catch (error) {
    await LoggerInstance.logError(
      `getLastToken:\n\n ${error.message} \n\n ${error.stack}`
    );
  }

  return response.results[0].properties.Id.number;
}

//*********************  SETTERS  ***************************** */
export async function addTokenToNotion(notionItem) {
  let notionObj = {};
  try {
    const tags1 = notionItem['tag-names'] ? notionItem['tag-names'] : [];
    const tags2 = notionItem.self_reported_tags
      ? notionItem.self_reported_tags
      : [];
    const tags = [...new Set([...tags1, ...tags2])].map((tag) => {
      return { name: tag };
    });
    const notionObj = {
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
      },
    };
    await LoggerInstance.logInfo(
      `NOTION TOKEN OBJ ${notionItem.id}) ${notionItem.name
      }\n\n: ${JSON.stringify(notionObj)}`,
      false
    );
    await notion.pages.create(notionObj);
  } catch (error) {
    await LoggerInstance.logError(
      `addTokenToNotion  (${notionItem.id}) ${notionItem.name}:\n\n ${error.message} \n\n ${error.stack}`
    );
  }
}

export async function addRepsoitoryToNotion(token, repository) {
  let notionObj = {};
  try {
    const readmeBlocks = await generateNotionReadmeBlocks(
      repository.readme,
      repository.name
    );
    const files = await generateNotionFilesBlocks(
      repository.files,
      repository.name,
      repository.url
    );
    const packageDescription = await generatePackageDesriptionBlocks(
      repository.packageDescr,
      repository.name
    );
    const devPackageDescription = await generatePackageDesriptionBlocks(
      repository.devPackagesDescr,
      repository.name
    );

    notionObj = {
      parent: {
        database_id: NOTION_JS_DATABASE_ID,
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
        License: {
          select: {
            name: repository.license
              ? capitalizeFirstLetter(repository.license)
              : 'No License',
          },
        },
        Topics: {
          multi_select:
            repository.topics && Array.isArray(repository.topics)
              ? repository.topics.map((r) => {
                return { name: r };
              })
              : [],
        },
        Keywords: {
          multi_select:
            repository.keywords && Array.isArray(repository.keywords)
              ? repository.keywords.map((r) => {
                return { name: r };
              })
              : [],
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
          multi_select:
            repository.packages && Array.isArray(repository.packages)
              ? repository.packages
                .map((r) => {
                  return { name: r };
                })
                .slice(0, 100)
              : [],
        },
        DevPackages: {
          multi_select:
            repository.devPackages && Array.isArray(repository.devPackages)
              ? repository.devPackages
                .map((r) => {
                  return { name: r };
                })
                .slice(0, 100)
              : [],
        },
        Language: { select: { name: repository.language || 'null' } },
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
          number: files.totalFiles,
        },
        TotalLanguageFiles: {
          number: files.totalLanguageFiles,
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
        // packageDescription,
        // devPackageDescription,
        files.filesBlock,
        {
          embed: {
            url: 'https://raw.githubusercontent.com/andyvauliln/dapps-sdk/master/README.md',
            // external: {
            //   url: 'https://dexe.network/Dexe-DAO-Memo.pdf',
            // },
          },
        },
        // ...readmeBlocks,
      ],
    };
    const createdPage = await notion.pages.create(notionObj);
    if (createdPage && createdPage.id) {
      await LoggerInstance.logInfo(
        'addRepsoitoryToNotion SAVIED TO NOTION: ' + repository.name
      );
      await LoggerInstance.makeReport(repository);
    }
  } catch (error) {
    await LoggerInstance.logError(
      `addRepsoitoryToNotion(repoName: ${repository.name}) \n\n${repository.url
      }\n\n\n${JSON.stringify(notionObj)} \n\n  ${error.message} \n\n ${error.stack
      }`
    );
    await LoggerInstance.makeReport(repository, error.message);
  }
}

//******************** GENERATE NOTION BLOCKS CONTENT ************** */

function generateExtentionData(item) {
  return ext[item.replace('.', '')] || {};
}

export async function generateNotionFilesBlocks(files, repo, url) {
  const filesBlock = {};
  let totalLanguageFiles = 0;
  let totalFiles = 0;
  let heading_2 = {
    heading_2: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Files',
          },
        },
      ],
      children: [],
      is_toggleable: true,
    },
  };
  try {
    let heading_3 = {
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: '',
              link: null,
            },
          },
        ],
        children: [],
        color: 'default',
        is_toggleable: true,
      },
    };
    let text = {
      type: 'text',
      text: {
        content: 'Files',
      },
    };
    let paragraph = {
      paragraph: {
        rich_text: [],
      },
    };
    const file = '/src/github.js\n';
    totalFiles += 4;
    heading_3.heading_3.rich_text[0].text.content = `[${3}] ${'.js'} ${"JavaScript"}`;
    text.text.content = file;
    text.text.link = { url: `${url}/blob/${repo.default_branch || 'master'}/${file}` };

    paragraph.paragraph.rich_text = createRangeArray(0, 99).map((i) => text);
    heading_3.heading_3.children.push(paragraph);
    heading_2.heading_2.children.push(heading_3);

    // Object.entries(files).forEach(([key, value]) => {
    //   const fileDescr = generateExtentionData(key);
    //   if (
    //     fileDescr.name &&
    //     repo.language &&
    //     fileDescr.name.toLowerCase() === repo.language.toLowerCase()
    //   ) {
    //     totalLanguageFiles = value.count;
    //   }
    //   if (fileDescr.name) {
    //     const file = "/src/github.js"
    //     totalFiles += value.count;
    //     let h3 = heading_3;
    //     h3.heading_3.rich_text[0].text.content = `[${value.count}] ${key} ${
    //       fileDescr.name || ''
    //     }`;
    //     let p = paragraph;
    //     let t = text;
    //     t.text.content = file;
    //     t.text.link = `${url}/blob/${repo.default_branch || 'master'}/${file}`;

    //     h3.heading_3.rich_text[0].text.content = `[${value.count}] ${key} ${
    //       fileDescr.name || ''
    //     }`;

    //     for (let i = 0; i < value.files.length; i += 100) {
    //       value.files.slice(i * 100, i * 100 + 100).forEach((file) => {
    //         let t = text;
    //         t.text.content = file;
    //         t.text.link = `${url}/blob/${
    //           repo.default_branch || 'master'
    //         }/${file}`;
    //         p.paragraph.children.push(t);
    //       });
    //       h3.heading_3.children.push(p);
    //     }
    //     heading_2.heading_2.children.push(h3);
    //   }
    // });

    return { totalFiles, totalLanguageFiles, filesBlock: heading_2 };
  } catch (error) {
    await LoggerInstance.logError(
      `generateNotionFilesBlocks ${repo}:\n\n ${files} \n\n ${error.message} \n\n ${error.stack}`
    );
    return { totalLanguageFiles, totalFiles, filesBlock };
  }
}

function createRangeArray(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

export async function generateNotionReadmeBlocks(readme, repo) {
  let blocks = [];
  const indexes = [];

  try {
    blocks = markdownToBlocks(readme);

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
    return chunked_arr;
  } catch (error) {
    await LoggerInstance.logError(
      `generateNotionReadmeBlocks ${repo}:\n\n ${JSON.stringify(
        readme
      )} \n\n  ${error.message} \n\n ${error.stack}`
    );
    return [];
  }
}

export async function generatePackageDesriptionBlocks(packageObj, repo) {
  if (!packageObj) return [];

  try {
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
  } catch (error) {
    await LoggerInstance.logError(
      `generatePackageDesriptionBlocks ${repo}: \n\n ${JSON.stringify(
        packageObj
      )} \n\n ${error.message} \n\n ${error.stack}`
    );
  }
}

//****************************** HELPERS ********************* */

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
  } catch (error) {
    await LoggerInstance.logError(
      `addSitePicture ${id}:\n\n  ${error.message} \n\n ${error.stack}`
    );
  }
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Missed Token Ids   7291,6845, 6831,6780, 7509, 7546
