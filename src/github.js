import dotenv from 'dotenv';
import { Octokit } from 'octokit';
import { getDescriptions } from './NotionParser';

dotenv.config();

const { GITHUB_API_TOKEN } = process.env;

const octokit = new Octokit({
  auth: GITHUB_API_TOKEN,
});

export async function getGihubRepos(
  githubLink,
  laguages = 'language:javascript'
) {
  const owner = githubLink.split('/')[3];
  const resp = await octokit.rest.search.repos({
    q: `${laguages}+user:${owner}+fork:true`,
    per_page: 300,
  });
  //console.log(resp.data.items[0], 'response data');

  const repos = [];
  await asyncForEach(resp.data.items, async function (item) {
    let packages = await getPackageJsonFromRepo(item.html_url);
    const filesData = generateNotionBlockForFiles(
      await getGithubRepoFiles(owner, item.name)
    );
    let descr = '';
    if (packages && packages.dependencies) {
      descr = packages.description;
      packages = packages.dependencies;
    } else {
      return;
    }
    const repo = {
      name: item.name,
      language: item.language,
      stars: item.stargazers_count,
      forks: item.forks_count,
      isFork: item.fork,
      url: item.html_url,
      topics: item.topics,
      description: item.description || descr,
      commits: await getTotalCommits(owner, item.name),
      packages: Object.keys(packages),
      pakageDescriptions: await getPakageDescriptions(Object.keys(packages)),
      readme: await getMarkdownFromRepo(item.html_url),
      lastCommitDate: item.pushed_at,
      homepage: item.homepage,
      files: filesData,
    };
    //console.log(repo, 'REPO********************');
    repos.push(repo);
  });
  return repos;
}

async function getGithubRepoFiles(owner, repo) {
  // console.log(
  //   `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=true`
  // );
  const files = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true',
    {
      owner: owner,
      repo: repo,
      tree_sha: 'master',
    }
  );
  return generateFileTypesMap(
    files.data.tree.filter((r) => r.type !== 'tree').map((file) => file.path)
  );
}

// function to get file type
function generateFileTypesMap(files) {
  const types = {};
  files.forEach((file) => {
    const fileParts = file.split('/')[file.split('/').length - 1].split('.');

    if (fileParts.length === 1) {
      types[fileParts[0]] = types[fileParts[0]]
        ? [...types[fileParts[0]], file]
        : [file];
    } else if (fileParts.length === 2 && fileParts[0] === '') {
      types['.' + fileParts[1]] = types['.' + fileParts[1]]
        ? [...types['.' + fileParts[1]], file]
        : [file];
    } else {
      types[fileParts[fileParts.length - 1]] = types[
        fileParts[fileParts.length - 1]
      ]
        ? [...types[fileParts[fileParts.length - 1]], file]
        : [file];
    }
  });

  let obj = {};
  Object.keys(types).forEach((key) => {
    obj[key] = { count: types[key].length, files: types[key] };
  });

  //console.log(obj, 'FILES IN REPO');
  return obj;
}
function generateNotionBlockForFiles(files) {
  const blocks = [];
  let totalJsFiles = 0;
  let totalFiles = 0;
  Object.entries(files).forEach(([key, value]) => {
    if (key === 'js') {
      totalJsFiles = value.count;
    }
    totalFiles += value.count;
    // console.log(key, value);
    blocks.push({
      toggle: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `${key} (${value.count})`,
              link: null,
            },
            annotations: {
              bold: true,
            },
          },
        ],
        color: 'default',
        children: chunkContent(value.files, 30).map((files) => {
          return {
            type: 'code',
            code: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `  path: "${files.join('\n  path: ')}"`,
                  },
                },
              ],
              language: 'javascript',
            },
          };
        }),
      },
    });
  });
  return { totalJsFiles, totalFiles, blocks };
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

//function to calculate same values in array
function calculateSameValues(arr) {
  const counts = {};
  arr.forEach(function (x) {
    counts[x] = (counts[x] || 0) + 1;
  });
  return counts;
}

async function getPackageJsonFromRepo(githubLink) {
  const resp = await getGithubContent(githubLink, 'package.json');
  //console.log(JSON.parse(resp), 'package.json');
  return JSON.parse(resp) || {};
}
async function getMarkdownFromRepo(githubLink) {
  const resp = await getGithubContent(githubLink, 'README.md');
  //console.log(resp, 'README.md');
  return resp;
}

async function getPakageDescriptions(pakages) {
  const packageInfo = await getDescriptions(pakages);
  //console.log(packageInfo, 'package info');
  return packageInfo;
}

async function getGithubContent(githubLink, path) {
  try {
    const owner = githubLink.split('/')[3];
    const repo = githubLink.split('/')[4];
    const resp = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: owner,
        repo: repo,
        path: path,
      }
    );
    if (resp && resp.data && resp.data.content) {
      return atob(resp.data.content);
    }
    return '';
  } catch (error) {
    console.error(error);
    return '';
  }
}

async function getTotalCommits(owner, repo) {
  const resp = await octokit.request(
    'GET /repos/{owner}/{repo}/commits?per_page=100',
    {
      owner: owner,
      repo: repo,
    }
  );
  if (resp.headers['link']) {
    const pages = resp.headers['link']
      .split(',')[1]
      .match(/.*page=(?<page_num>\d+)/).groups.page_num;
    const resp2 = await octokit.request(
      'GET /repos/{owner}/{repo}/commits?per_page=100&page=' + pages,
      {
        owner: owner,
        repo: repo,
      }
    );
    return resp2.data.length + (pages - 1) * 100;
  } else {
    return resp.data.length;
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
