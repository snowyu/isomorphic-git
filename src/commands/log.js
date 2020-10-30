// @ts-check
import '../typedefs.js'

import { _logIterator } from './logIterator.js'

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {number=} args.depth
 * @param {Date=} args.since
 *
 * @returns {Promise<Array<ReadCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
 * console.log(commits)
 *
 */
export async function _log({ fs, cache, gitdir, ref, depth, since }) {
  const commits = []

  for await (const commit of _logIterator({
    fs,
    cache,
    gitdir,
    ref,
    depth,
    since,
  })) {
    commits.push(commit)
  }
  return commits
}
