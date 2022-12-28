import clone from "git-clone/promise";

export async function cloneRepo(repo, path) {
    return await clone(repo, path);
}