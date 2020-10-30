// @ts-check
import '../typedefs.js'

import { _logFile } from '../commands/logFile.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Get commit descriptions of a file from the git history
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {any} args.cache - optional cache object
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string=} args.filepath get the commit for the filepath
 * @param {string} [args.ref = 'HEAD'] - The commit to begin walking backwards through the history from
 * @param {number} [args.depth] - Limit the number of commits returned. No limit by default.
 * @param {Date} [args.since] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
 * @param {boolean=} args.force do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} args.follow Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 *
 * @returns  {Promise<Array<ReadFileCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.logFile({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: 'README.md',
 *   depth: 5,
 *   ref: 'main'
 * })
 * console.log(commits)
 *
 */
export async function logFile({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  ref = 'HEAD',
  depth,
  since, // Date
  force,
  follow,
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    assertParameter('filepath', filepath)
    return await _logFile({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      filepath,
      ref,
      depth,
      since,
      force,
      follow,
    })
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
