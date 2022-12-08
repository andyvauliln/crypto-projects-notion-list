import dotenv from 'dotenv';
import { Octokit } from 'octokit';

dotenv.config();

const { GITHUB_API_TOKEN } = process.env;

const octokit = new Octokit({
  auth: GITHUB_API_TOKEN,
});

export async function getGihubRepos(
  githubLink,
  laguages = 'language:javascript+language:typescript+language:solidity+language:HTML'
) {
  const owner = githubLink.split('/')[3];

  //   const url = `GET /search/repositories?q=language:${laguages}+user:mincoin+fork:true&per_page=300`;
  console.log(owner, 'Owner***********************');
  const resp = await octokit.rest.search.repos({
    q: `${laguages}+user:${owner}+fork:true`,
    per_page: 300,
  });
  console.log(resp, 'response data');
  return resp.data.items;
}

async function getPackageJsonFromRepo(githubLink) {
  const resp = await getGithubContent(githubLink, 'package.json');
  console.log(resp);
}
async function getMarkdownFromRepo(githubLink) {
  const resp = await getGithubContent(githubLink, 'README.md');
  console.log(resp);
}

async function getGithubContent(githubLink, path) {
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
  const fileContent = atob(resp.data.content);
  return fileContent;
}
