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

const notion = new Client({
  auth: NOTION_API_TOKEN,
  logLevel: LogLevel.DEBUG,
});

//************************  GETTERS  ************************** */
export async function getNotionTokensWithSites(startId = 0, limit = 100) {
  let response;
  try {
    response = await notion.databases.query({
      database_id: NOTION_TOKENS_DATABASE_ID,
      sorts: [
        {
          property: 'Id',
          direction: 'ascending',
        },
      ],
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
            property: 'Website',
            rich_text: {
              is_not_empty: true,
            },
          },
        ],
      },
    });
    return response.results || [];
  } catch (error) {
    await LoggerInstance.logError(
      `getNotionTokensWithSites (${startId}, ${limit}):\n\n ${error.message} \n\n ${error.stack}`
    );
    return [];
  }

}
export async function getNotionTokensWithSourceCode(startId = 0, limit = 100) {
  let response;
  try {
    response = await notion.databases.query({
      database_id: NOTION_TOKENS_DATABASE_ID,
      page_size: limit,
      sorts: [
        {
          property: 'Id',
          direction: 'ascending',
        },
      ],
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
export async function getLastTokenId() {
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
      `getLastTokenId:\n\n ${error.message} \n\n ${error.stack}`
    );
    return null;
  }

  return response.results[0].properties.Id.number;
}
export async function getLastContentDowloadedTokenId() {
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
      filter: {
        property: 'IsContetDownloaded',
        checkbox: {
          equal: true,
        },
      },
      page_size: 1,
    });
  } catch (error) {
    await LoggerInstance.logError(
      `getLastContentDowloadedTokenId:\n\n ${error.message} \n\n ${error.stack}`
    );
    return null;
  }

  return response.results[0].properties.Id.number;
}
export async function getLastRepositoryTokenId() {
  let response;
  try {
    response = await notion.databases.query({
      database_id: NOTION_JS_DATABASE_ID,
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
      `getLastTokenId:\n\n ${error.message} \n\n ${error.stack}`
    );
    return null;
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
    throw new Error("TOKEN NOT ADDED")
  }
}

export async function addRepsoitoryToNotion(token, repository) {
  let notionObj = {};
  try {
    const readmeBlocks = await generateNotionReadmeBlocks(
      repository.readme,
      repository.name
    );
    const files = generateNotionFilesBlocks(
      repository.files,
      repository
    );
    const packageDescription = await generatePackageDesriptionBlocks(
      repository.packageDescr,
      repository.name
    );
    const devPackageDescription = await generatePackageDesriptionBlocks(
      repository.devPackagesDescr,
      repository.name,
      "dev"
    );



    notionObj = {
      parent: {
        database_id: NOTION_JS_DATABASE_ID,
      },
      icon: {
        external: {
          url: getTypeIcon(repository.language),
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
        Languages: {
          multi_select:
            repository.languages && Array.isArray(repository.languages)
              ? repository.languages.map((r) => {
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
        FileTypes: {
          multi_select: files.fileTypes,
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
        packageDescription,
        devPackageDescription,
        files.filesBlock,
        // {
        //   embed: {
        //     url: 'https://raw.githubusercontent.com/andyvauliln/dapps-sdk/master/README.md',
        //     // external: {
        //     //   url: 'https://dexe.network/Dexe-DAO-Memo.pdf',
        //     // },
        //   },
        // },
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
      `addRepsoitoryToNotion(repoName: ${token.properties.Id.number} - ${repository.name}) \n\n${repository.url
      }\n\n\n${JSON.stringify(notionObj)} \n\n  ${error.message} \n\n ${error.stack
      }`
    );
    await LoggerInstance.makeReport(repository, error.message);
    throw new Error(`REPO NOT ADDED ${token.properties.Id.number}`);
  }
}

export async function addSiteContentToNotion(token, repository) {
  let notionObj = {};
  try {
    const readmeBlocks = await generateNotionReadmeBlocks(
      repository.readme,
      repository.name
    );
    const files = generateNotionFilesBlocks(
      repository.files,
      repository
    );
    const packageDescription = await generatePackageDesriptionBlocks(
      repository.packageDescr,
      repository.name
    );
    const devPackageDescription = await generatePackageDesriptionBlocks(
      repository.devPackagesDescr,
      repository.name,
      "dev"
    );


    const response = await notion.pages.update({
      page_id: id,
      properties: {
        children: {
          checkbox: true,
        },
      },
    });

    notionObj = {
      parent: {
        database_id: NOTION_JS_DATABASE_ID,
      },
      icon: {
        external: {
          url: getTypeIcon(repository.language),
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
        Languages: {
          multi_select:
            repository.languages && Array.isArray(repository.languages)
              ? repository.languages.map((r) => {
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
        FileTypes: {
          multi_select: files.fileTypes,
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
        packageDescription,
        devPackageDescription,
        files.filesBlock,
        // {
        //   embed: {
        //     url: 'https://raw.githubusercontent.com/andyvauliln/dapps-sdk/master/README.md',
        //     // external: {
        //     //   url: 'https://dexe.network/Dexe-DAO-Memo.pdf',
        //     // },
        //   },
        // },
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
      `addRepsoitoryToNotion(repoName: ${token.properties.Id.number} - ${repository.name}) \n\n${repository.url
      }\n\n\n${JSON.stringify(notionObj)} \n\n  ${error.message} \n\n ${error.stack
      }`
    );
    await LoggerInstance.makeReport(repository, error.message);
    throw new Error(`REPO NOT ADDED ${token.properties.Id.number}`);
  }
}

//******************** GENERATE NOTION BLOCKS CONTENT ************** */


// TODO: add github language scheme
export function generateNotionFilesBlocks(files, repo) {
  const filesBlock = {};
  let totalLanguageFiles = 0;
  let totalFiles = 0;
  let fileTypes = Object.keys(files).map((key) => { return { name: key } });
  fileTypes = fileTypes.slice(0, 100);
  let heading_2 = getNotionBlocks('heading_2');

  try {

    Object.entries(files).sort((a, b) => b[1].count - a[1].count).forEach(([key, value]) => {
      const fileDescr = getExtentionData(key);
      if (
        fileDescr.name &&
        repo.language &&
        fileDescr.name.toLowerCase() === repo.language.toLowerCase()
      ) {
        totalLanguageFiles = value.count;
      }
      // if (fileDescr.name) {
      totalFiles += value.count;
      let heading_3 = getNotionBlocks('heading_3');

      heading_3.heading_3.rich_text[0].text.content = `[${value.count}] ${key} ${!fileDescr.name || key === fileDescr.name ? '' : "(" + fileDescr.name + ")"}`;
      heading_3.heading_3.color = "green"
      for (let i = 0; i < value.files.length; i += 100) {
        let paragraph = getNotionBlocks('paragraph');
        value.files.slice(i * 100, i * 100 + 100).forEach((file) => {
          let text = getNotionBlocks('text');
          text.text.content = "/" + file + "\n";
          text.text.link = { url: `${repo.url}/blob/${repo.default_branch || 'master'}/${file}` };
          paragraph.paragraph.color = "default";
          paragraph.paragraph.rich_text.push(text);
        });
        heading_3.heading_3.children.push(paragraph);
      }
      heading_2.heading_2.children.push(heading_3);
      // }
    });
    heading_2.heading_2.rich_text[0].text.content = `[${totalFiles}] Files`;
    heading_2.heading_2.color = "yellow";
    return { totalFiles, totalLanguageFiles, fileTypes, filesBlock: heading_2 };
  } catch (error) {
    LoggerInstance.logError(
      `generateNotionFilesBlocks ${repo}:\n\n ${files} \n\n ${error.message} \n\n ${error.stack}`
    );
    return { totalLanguageFiles, totalFiles, fileTypes, filesBlock };
  }
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

export async function generatePackageDesriptionBlocks(packageObj, repo, type = "app") {
  let heading_2 = getNotionBlocks("heading_2");
  heading_2.heading_2.color = "yellow";
  heading_2.heading_2.rich_text[0].text.content = type === "dev" ? `[${Object.keys(packageObj).length}] Dev Packages Desciption` : `[${Object.keys(packageObj).length}] Packages Desciption`;
  if (!packageObj) return heading_2;

  try {
    const rows = Object.entries(packageObj).map(([key, value]) => {
      return `"${key}" : "${value}"`;
    });
    let code = getNotionBlocks("code");
    code.code.rich_text = rows.map((item) => {
      let text = getNotionBlocks("text");
      text.text.content = item + "\n";
      return text;

    }).slice(0, 100);
    heading_2.heading_2.children = [code];

    return heading_2;
  } catch (error) {
    await LoggerInstance.logError(
      `generatePackageDesriptionBlocks ${repo}: \n\n ${JSON.stringify(
        packageObj
      )} \n\n ${error.message} \n\n ${error.stack}`
    );
  }
}

//****************************** HELPERS ********************* */


function getTypeIcon(language) {
  const lng = language.toLowerCase();
  let iconLanguage = lng;
  if (lng === "javascript") {
    iconLanguage = "js"
  }
  if (lng === "objective-c") {
    iconLanguage = "objectivec"
  }
  const url = `https://raw.githubusercontent.com/vscode-icons/vscode-icons/a6526a9b865babf8d661779a5d1fff67672fce89/icons/file_type_${iconLanguage}.svg`
  return url;
}
function getExtentionData(item) {
  return (item[0] === "." ? ext[item.slice(-(item.length - 1))] : ext[item]) || {};
}

function getNotionBlocks(type) {
  if (type === "heading_2") {
    return {
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: '',
            },
          },
        ],
        children: [],
        is_toggleable: true,
      },
    };
  };
  if (type === "heading_3") {
    return {
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: '',
            },
          },
        ],
        children: [],
        is_toggleable: true,
      },
    };
  };
  if (type === "paragraph") {
    return {
      paragraph: {
        rich_text: [],
      },
    };
  };
  if (type === "text") {
    return {
      type: 'text',
      text: {
        content: '',
      },
    };
  };
  if (type === "code") {
    return {
      type: 'code',
      code: {
        rich_text: [],
        language: 'javascript',
      },
    };
  };
  return null;
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
