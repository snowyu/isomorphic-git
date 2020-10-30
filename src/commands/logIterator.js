// @ts-check
import '../typedefs.js'

import { _readCommit } from '../commands/readCommit.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { compareAge } from '../utils/compareAge.js'

/**
 * Get commit descriptions from the git history via async iterator
 *
 * @param {object} args
 * @param {FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {number=} args.depth
 * @param {Date=} args.since
 * @returns {AsyncGenerator<ReadCommitResult>}
 *
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * for await(const commit of _logIterator({ fs, gitdir, ref }))
 *   console.log(commit)
 *
 */
export async function* _logIterator({ fs, cache, gitdir, ref, depth, since }) {
  const sinceTimestamp =
    typeof since === 'undefined'
      ? undefined
      : Math.floor(since.valueOf() / 1000)

  const shallowCommits = await GitShallowManager.read({ fs, gitdir })
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  const tips = [await _readCommit({ fs, cache, gitdir, oid })]
  let count = 0

  while (true) {
    const commit = tips.pop()

    // Stop the log if we've hit the age limit
    if (
      sinceTimestamp !== undefined &&
      commit.commit.committer.timestamp <= sinceTimestamp
    ) {
      break
    }

    const exists = yield commit
    if (exists) break

    // Stop the loop if we have enough commits now.
    if (depth !== undefined && ++count === depth) {
      break
    }

    // If this is not a shallow commit...
    if (!shallowCommits.has(commit.oid)) {
      // Add the parents of this commit to the queue
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of commit.commit.parent) {
        const commit = await _readCommit({ fs, cache, gitdir, oid })
        if (!tips.map(commit => commit.oid).includes(commit.oid)) {
          tips.push(commit)
        }
      }
    }

    // Stop the loop if there are no more commit parents
    if (tips.length === 0) {
      break
    }

    // Process tips in order by age
    tips.sort((a, b) => compareAge(a.commit, b.commit))
  }
}
