#!/usr/bin/env node
/* eslint-disable no-restricted-syntax */
const { program } = require('commander');

const {
  isCI,
  CI_VARIABLES,
  gitRemoteBranchExists,
  gitInitCI,
  gitPush,
  gitPull,
  gitFetch,
  gitCheckout,
  gitMerge,
} = require('@beef/conf/utils');

program
  .requiredOption(
    '-t, --targets <targets>',
    'Список веток для мержа через запятую (например: dev,load)',
  )
  .parse();

const options = program.opts();

const mergeToBranches = async () => {
  //   if (!isCI) {
  //     throw new Error('Process is not running in a CI environment');
  //   }

  /** Инициализация пользователя для работы с git в рамках CI */
  // gitInitCI(CI_VARIABLES.CI_REPO_URL);

  const sourceBranch = CI_VARIABLES.CI_COMMIT_BRANCH;
  const targetBranches = options.targets.split(',').map((b) => b.trim());

  for (const targetBranch of targetBranches) {
    if (!gitRemoteBranchExists(targetBranch)) {
      console.info(`Ветка ${targetBranch} не существует.`);
      return;
    }
    console.info(`Начинаем merge в ветку ${targetBranch}`);
    gitFetch(targetBranch, ['origin']);
    gitCheckout(targetBranch);
    gitPull(targetBranch, ['--no-rebase', '-s recursive', '-X theirs', 'origin']);

    console.info(`Мержим ${sourceBranch} -> ${targetBranch}`);
    try {
      gitMerge(sourceBranch, ['--no-ff', '-X theirs']);
    } catch (mergeError) {
      console.error(`Конфликт при merge в ветку ${targetBranch}:`, mergeError);
      process.exit(1);
    }

    gitPush(targetBranch, ['origin']);
    console.info(`Успешно обновлена ветка ${targetBranch}`);
  }
};

mergeToBranches().catch((error) => {
  console.error(error);
  process.exit(1);
});
