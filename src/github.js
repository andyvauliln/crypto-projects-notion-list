import dotenv from 'dotenv';
import { getDescriptions } from 'npm-description';
import { Octokit } from 'octokit';
import LoggerInstance from './loging';

dotenv.config();

const { GITHUB_API_TOKEN } = process.env;

const octokit = new Octokit({
  auth: GITHUB_API_TOKEN,
});

// languages support js
// [purescipt, elm, typescript, coffescript, nim, haxe,  amber, clojure, scala, ceylon, PharoJS, svelte, Haste, mint, dart]

export async function getGihubRepos(
  githubLink,
  laguages = ''
) {
  const repos = [];
  const owner = githubLink.split('/')[3];
  const url = `https://api.github.com/search/repositories?q=${laguages}+user:${owner}+fork:true&per_page=300`;
  try {
    await LoggerInstance.logInfo(`getGihubRepos - SEARCHING BY URL: \n ${url}`);
    const resp = await octokit.rest.search.repos({
      q: `${laguages}+user:${owner}+fork:true`,
      per_page: 300,
    });
    await LoggerInstance.logInfo(
      `getGihubRepos - USER  ${owner}  HAS: ${
        resp.data ? resp.data.items.length : 0
      } REPOS \n\n ${JSON.stringify(resp?.data?.items)}`
    );

    await asyncForEach(resp.data.items, async function (item, index) {
      await LoggerInstance.logInfo(
        `getGihubRepos - REPO OBJ FOR OWNER: ${owner}, REPO: ${
          item.name
        }: \n\n ${JSON.stringify(item)}`,
        false
      );

      const packages = await getPackageJsonFromRepo(item.html_url);
      if (!packages) return;

      const readme = await getMarkdownFromRepo(item.html_url);
      const filesData = await getGithubRepoFiles(
        owner,
        item.name,
        item.default_branch
      );
      const languages = await getRepositoryLanguages(owner, item.name);

      const descr = parsePackageJson(packages, 'description');
      const projectPackages = parsePackageJson(packages, 'dependencies');
      const devPackages = parsePackageJson(packages, 'devDependencies');
      const keywords = parsePackageJson(packages, 'keywords');
      const license = parsePackageJson(packages, 'license');

      const repo = {
        name: item.name,
        language: item.language || languages[0] || "",
        languages: languages.length > 0 ? languages : item.language ? [item.language] : [],
        stars: item.stargazers_count,
        forks: item.forks_count,
        isFork: item.fork,
        url: item.html_url,
        topics: item.topics,
        description: item.description || descr,
        lastCommitDate: item.pushed_at,
        homepage: item.homepage,
        keywords: keywords ? keywords : [],
        license: license ? license : '',
        files: filesData,
        readme: readme,
        default_branch: item.default_branch,
        commits: await getTotalCommits(owner, item.name),
        devPackages: devPackages ? Object.keys(devPackages) : [],
        packages: projectPackages ? Object.keys(projectPackages) : [],
        devPackagesDescr: devPackages
          ? await getPackageDescr(Object.keys(devPackages), item.name)
          : null,
        packageDescr: projectPackages
          ? await getPackageDescr(Object.keys(projectPackages), item.name)
          : null,
      };
      if (repo) {
        repos.push(repo);
      }
    });
    return repos;
  } catch (error) {
    await LoggerInstance.logError(
      `getGihubRepos(${githubLink}) \n\n ${error.message}\n\n${error.stack}`
    );
  }
}

export async function getGithubRepoFiles(
  owner,
  repo,
  branch = 'master',
  counter = 1
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=true`;
  try {
    await LoggerInstance.logInfo(
      `getGithubRepoFiles ${repo} SEARCHING BY URL: \n\n ${url}`
    );

    const files = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true',
      {
        owner: owner,
        repo: repo,
        tree_sha: branch,
      }
    );

    return await generateFileTypesMap(
      files.data.tree.filter((r) => r.type !== 'tree').map((file) => file.path),
      repo
    );
  } catch (error) {
    if (counter >= 2) {
      await LoggerInstance.logError(
        `getGithubRepoFiles(${owner}, ${repo}) \n\n CAN'T GET FILES FROM REPO !!!\n\n${url}`
      );
      return [];
    }
    return await getGithubRepoFiles(owner, repo, 'main', counter + 1);
  }
}
const notAllowedFormats = [".png", ".jpg", ".eot", ".ttf", ".woff", ".woff2", ".lock", ".jpeg", ".gif", ".icns", ".svg", ".ico", ".webp", ".gitkeep", ".map", ".gitignore"]
export async function generateFileTypesMap(files, repo) {
  const types = {};
  try {
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
        types["." + fileParts[fileParts.length - 1]] = types["." + fileParts[fileParts.length - 1]]
          ? [...types["." + fileParts[fileParts.length - 1]], file]
          : [file];
      }
      // else {
      //   types[fileParts.slice(-2).join(".")] = types["." + fileParts.slice(-2).join(".")]
      //     ? [...types["." + fileParts.slice(-2).join(".")], file]
      //     : [file];
      // }
    });

    let obj = {};
    Object.keys(types).forEach((key) => {
      if (notAllowedFormats.indexOf(key) === -1) {
        obj[key] = { count: types[key].length, files: types[key] };
      }

    });
    await LoggerInstance.logInfo(
      `generateFileTypesMap ${repo}:\n\n ${JSON.stringify(obj)}`,
      false
    );
    return obj;
  } catch (error) {
    await LoggerInstance.logError(
      `generateFileTypesMap ${repo} :\n\n ${JSON.stringify(files)}\n\n${error}`
    );
    return [];
  }
}

export async function getRepositoryLanguages(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/languages`;
  try {

    const languages = await octokit.request(
      'GET /repos/{owner}/{repo}/languages',
      {
        owner: owner,
        repo: repo,
      }
    );

    if (languages && languages.data) {
      return Object.keys(languages.data);
    }


    return [];
  } catch (error) {
    await LoggerInstance.logError(
      `getRepositoryLanguages(${owner}, ${repo}) \n\n ${error.message}\n\n${error.stack}`
    );
    return [];
  }
}

export async function getPackageJsonFromRepo(githubLink) {
  try {
    const resp = await getGithubContent(githubLink, 'package.json');
    if (resp) {
      return JSON.parse(resp);
    }
    return null;
  } catch (error) {
    return null;
  }
}
export async function getMarkdownFromRepo(githubLink) {
  const resp = await getGithubContent(githubLink, 'README.md');
  return resp;
}

export async function getGithubContent(githubLink, path) {
  const owner = githubLink.split('/')[3];
  const repo = githubLink.split('/')[4];
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  try {
    await LoggerInstance.logInfo(`getGithubContent ${repo} \n\n ${url}`);
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
    await LoggerInstance.logError(
      `getGithubContent ${githubLink.split('/')[4]}:\n\n${url} \n\n ${error}`
    );
    return '';
  }
}

export async function getTotalCommits(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  try {
    await LoggerInstance.logInfo(`getTotalCommits ${repo} \n\n ${url}`);
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
  } catch (error) {
    await LoggerInstance.logError(
      `getTotalCommits ${repo}:\n\n ${url}\n\n${error}`
    );
    return 0;
  }
}

export async function getPackageDescr(pakages, repo) {
  try {
    await LoggerInstance.logInfo(`getPackageDescr ${repo}`);
    if (pakages && pakages.length) {
      const packageInfo = await getDescriptions(pakages);
      return packageInfo;
    }
    return null;
  } catch (error) {
    await LoggerInstance.logError(
      `getPackageDescr ${repo}:\n\n ${JSON.stringify(pakages)}\n\n${error}`
    );
    return null;
  }
}

export async function getOpenAIProjects() {

  const repos = [];
  const url = `https://api.github.com/search/repositories?q=openai+in:file+fork:true+language:javascript+language:typescript&per_page=10`;
  try {
    let resp = { incomplete_results: true };
    let offset = 1;
    let repMap = new Map();
    while (resp.incomplete_results && offset <= 10) {
      const resp = await octokit.rest.search.repos({
        q: `openai+in:file+fork:false+language:javascript+language:typescript`,
        page: offset,
        per_page: 100,
        sort: "updated"
      });
      // if (offset === 10) {
      //   console.log(resp, "resp");
      // }
      //console.log("got page number " + offset, resp.status);
      resp.data.items.forEach((item) => {
        //console.log(item.full_name, "item full name");
        if (!repMap.has(item.full_name)) {
          repMap.set(item.full_name, item);
        }
      });
      offset++;
    }
    await asyncForEachMap(repMap, async function (key, item) {
      await LoggerInstance.logInfo(
        `getOpenAIProjects - Getting Repo: ${item.html_url}`
      );

      const packages = await getPackageJsonFromRepo(item.html_url);
      if (packages && packages.dependencies && packages.dependencies["openai"]) {


        const owner = item.html_url.split('/')[3];
        //console.log(owner, "owner");
        //const readme = await getMarkdownFromRepo(item.html_url);
        const filesData = await getGithubRepoFiles(
          owner,
          item.name,
          item.default_branch
        );

        const languages = await getRepositoryLanguages(owner, item.name);

        const descr = parsePackageJson(packages, 'description');
        const projectPackages = parsePackageJson(packages, 'dependencies');
        const devPackages = parsePackageJson(packages, 'devDependencies');
        const keywords = parsePackageJson(packages, 'keywords');
        const license = parsePackageJson(packages, 'license');
        //console.log(owner, "owner2");
        const repo = {
          version: packages.dependencies["openai"],
          name: item.name,
          language: item.language || languages[0] || "",
          languages: languages.length > 0 ? languages : item.language ? [item.language] : [],
          stars: item.stargazers_count,
          forks: item.forks_count,
          isFork: item.fork,
          url: item.html_url,
          topics: item.topics,
          description: item.description || descr,
          lastCommitDate: item.pushed_at,
          homepage: item.homepage,
          keywords: keywords ? keywords : [],
          license: license ? license : '',
          files: filesData,
          //readme: readme,
          default_branch: item.default_branch,
          commits: await getTotalCommits(owner, item.name),
          devPackages: devPackages ? Object.keys(devPackages) : [],
          packages: projectPackages ? Object.keys(projectPackages) : [],
          devPackagesDescr: devPackages
            ? await getPackageDescr(Object.keys(devPackages), item.name)
            : null,
          packageDescr: projectPackages
            ? await getPackageDescr(Object.keys(projectPackages), item.name)
            : null,
        };
        if (repo) {
          repos.push(repo);
        }
      };
    });
    return repos;
  } catch (error) {
    await LoggerInstance.logError(
      `getOpenAIProjects \n\n ${value.html_ur}) \n\n ${error.message}\n\n${error.stack}`
    );
  }

}

// ******************** UTILS **********************

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
async function asyncForEachMap(array, callback) {
  for (const [key, value] of array) {
    await callback(key, value, array);
  }
}
function parsePackageJson(packages, property) {
  if (packages && packages[property]) {
    return packages[property];
  }
  return '';
}