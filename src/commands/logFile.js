// @ts-check
import '../typedefs.js'

import { NotFoundError } from '../errors/NotFoundError.js'
import { resolveFileIdInTree } from '../utils/resolveFileIdInTree.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'

import { _logIterator } from './logIterator.js'

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.filepath get the commit for the filepath only
 * @param {string} args.ref
 * @param {number=} args.depth
 * @param {Date=} args.since
 * @param {boolean=} args.force do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} args.follow Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 *
 * @returns {Promise<Array<ReadFileCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), filepath: '', force: true, follow: true, ref: '$input((master))' })
 * console.log(commits)
 *
 */
export async function _logFile({
  fs,
  cache,
  gitdir,
  filepath,
  ref,
  depth,
  since,
  force,
  follow,
}) {
  /**
   * @type Array<{oid: string, commit: ReadCommitResult)}>
   */
  const commits = []
  let lastFileOid
  let lastCommit
  let isOk
  let count = 0

  for await (const commit of _logIterator({
    fs,
    cache,
    gitdir,
    ref,
    since,
  })) {
    let vFileOid
    try {
      vFileOid = await resolveFilepath({
        fs,
        cache,
        gitdir,
        oid: commit.commit.tree,
        filepath,
      })
      if (lastCommit && lastFileOid !== vFileOid) {
        commits.push({ oid: lastFileOid, commit: lastCommit })
        count++
      }
      isOk = true
      lastFileOid = vFileOid
      lastCommit = commit
    } catch (e) {
      if (e instanceof NotFoundError) {
        let found = follow && lastFileOid
        if (found) {
          found = await resolveFileIdInTree({
            fs,
            cache,
            gitdir,
            oid: commit.commit.tree,
            fileId: lastFileOid,
          })
          if (found) {
            if (Array.isArray(found)) {
              if (lastCommit) {
                const lastFound = await resolveFileIdInTree({
                  fs,
                  cache,
                  gitdir,
                  oid: lastCommit.commit.tree,
                  fileId: lastFileOid,
                })
                if (Array.isArray(lastFound)) {
                  found = found.filter(p => lastFound.indexOf(p) === -1)
                  if (found.length === 1) {
                    found = found[0]
                    filepath = found
                    if (lastCommit) {
                      commits.push({ oid: lastFileOid, commit: lastCommit })
                      count++
                    }
                  } else {
                    isOk = true
                    break
                  }
                }
              }
            } else {
              // use the file name before renamed
              filepath = found
              // add the renamed commit
              if (lastCommit) {
                commits.push({ oid: lastFileOid, commit: lastCommit })
                count++
              }
            }
          }
        }
        if (!found) {
          if (!force && !follow) throw e
          if (isOk && lastFileOid) {
            commits.push({ oid: lastFileOid, commit: lastCommit })
            count++
          }
        }
        lastCommit = commit
        isOk = false
      } else throw e
    }
    // Stop the loop if we have enough commits now.
    if (depth !== undefined && count === depth) {
      isOk = false
      break
    }
  }

  if (lastCommit && isOk) commits.push({ oid: lastFileOid, commit: lastCommit })

  return commits
}
