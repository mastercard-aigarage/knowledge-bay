import { execSync } from 'node:child_process';

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function runInherit(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function parseArgs(argv) {
  const args = { message: '', force: false, noCommit: false, noSwitch: false, stay: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-m' || a === '--message') {
      args.message = argv[i + 1] ?? '';
      i++;
      continue;
    }
    if (a === '--force') {
      args.force = true;
      continue;
    }
    if (a === '--no-commit') {
      args.noCommit = true;
      continue;
    }
    if (a === '--no-switch') {
      args.noSwitch = true;
      continue;
    }
    if (a === '--stay') {
      args.stay = true;
      continue;
    }
  }
  return args;
}

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`\n${msg}\n`);
  process.exit(1);
}

const { message, force, noCommit, noSwitch, stay } = parseArgs(process.argv.slice(2));

let startingBranch;
try {
  startingBranch = run('git branch --show-current');
} catch {
  fail('Not a git repository (or git not available).');
}

const targetBranch = 'gh-pages-deploy';
const shouldSwitch = startingBranch !== targetBranch;

let createdStash = false;

function ensureLocalBranchExists(branchName) {
  try {
    run(`git show-ref --verify --quiet refs/heads/${branchName}`);
    return;
  } catch {
    // continue
  }

  try {
    runInherit(`git fetch origin ${branchName}:${branchName}`);
    return;
  } catch {
    // continue
  }

  fail(
    `Local branch \`${branchName}\` does not exist and could not be fetched from origin.\n\n` +
      `Fix:\n` +
      `  git fetch origin\n` +
      `  git branch -a\n`
  );
}

function hasUncommittedChanges() {
  return !!run('git status --porcelain');
}

function stashIfNeeded() {
  if (!hasUncommittedChanges()) return;
  // Include untracked files so assets/etc aren't lost.
  runInherit('git stash push -u -m "push-gh-pages-deploy: auto-stash"');
  createdStash = true;
}

function applyStashIfCreated() {
  if (!createdStash) return;
  try {
    // Use apply so we can restore the original workspace state later.
    runInherit('git stash apply');
  } catch {
    fail(
      `Stash could not be applied cleanly on \`${targetBranch}\`.\n\n` +
        `Next steps:\n` +
        `  - Resolve conflicts (\`git status\`)\n` +
        `  - Then re-run: npm run push:gh-pages-deploy -- -m "your message"\n\n` +
        `Note: Your stash entry was kept (\`git stash list\`).`
    );
  }
}

function restoreOriginalBranch() {
  if (!shouldSwitch || stay) return;

  runInherit(`git switch ${startingBranch}`);

  if (!createdStash) return;
  try {
    runInherit('git stash pop');
  } catch {
    fail(
      `Switched back to \`${startingBranch}\`, but stash could not be popped cleanly.\n\n` +
        `Next steps:\n` +
        `  - Resolve conflicts (\`git status\`)\n` +
        `  - If needed, your stash is still available (\`git stash list\`).`
    );
  }
}

if (shouldSwitch) {
  if (noSwitch) {
    fail(
      `You are currently on \`${startingBranch || '(detached)'}\`, not \`${targetBranch}\`.\n\n` +
        `Either switch branches:\n` +
        `  git switch ${targetBranch}\n\n` +
        `Or run without --no-switch to auto-switch.`
    );
  }

  stashIfNeeded();
  ensureLocalBranchExists(targetBranch);
  runInherit(`git switch ${targetBranch}`);
  applyStashIfCreated();
}

const status = run('git status --porcelain');

if (status && !noCommit) {
  runInherit('git add -A');
  const commitMsg = message || `chore: sync ${new Date().toISOString()}`;

  try {
    runInherit(`git commit -m "${commitMsg.replace(/\"/g, '\\"')}"`);
  } catch {
    // If there's nothing to commit, git exits non-zero.
    // In that case, continue to pushing.
  }
} else if (status && noCommit) {
  fail(
    `Working tree is not clean, but --no-commit was provided.\n\n` +
      `Either commit your changes or run without --no-commit.`
  );
}

const pushCmd = force
  ? `git push --force-with-lease -u origin ${targetBranch}`
  : `git push -u origin ${targetBranch}`;

runInherit(pushCmd);

restoreOriginalBranch();
