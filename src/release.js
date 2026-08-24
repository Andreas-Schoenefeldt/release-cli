'use strict';

import { select, input } from '@inquirer/prompts';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

const DEFAULT_REGEXP = /(['"]?version['"]?\s*:\s*['"]?)(\d+\.\d+\.\d+)(-[\w.]+)?(['"]?)/gmi;

function run(cmd, cwd) {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd });
}

async function pickVersion(currentVersion) {
    const choices = ['patch', 'minor', 'major'].map((level) => ({
        name: `${level[0].toUpperCase()}${level.slice(1)}:  ${semver.inc(currentVersion, level)}`,
        value: semver.inc(currentVersion, level)
    }));
    choices.push({ name: 'Custom: ?.?.? Specify version...', value: 'custom' });

    let version = await select({ message: `Bump version from ${currentVersion} to:`, choices });
    while (version === 'custom' || !version) {
        version = await input({ message: 'Enter a valid semver (e.g. 1.2.3): ' });
        if (!semver.valid(version)) version = 'custom';
    }
    return version;
}

function writeVersionToFiles(files, regExp, newVersion, cwd) {
    files.forEach((file) => {
        const filePath = path.resolve(cwd, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`Skipping missing file: ${file}`);
            return;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const updated = content.replace(regExp, (_m, pre, _ver, suffix = '', post = '') => `${pre}${newVersion}${post}`);
        fs.writeFileSync(filePath, updated);
        console.log(`Updated version in ${file}`);
    });
}

/**
 * Run the release flow: merge dev -> main, bump version, merge main -> dev.
 *
 * @param {Object} [options]
 * @param {string} [options.main='main']       Main/production branch
 * @param {string} [options.dev='develop']        Development branch
 * @param {string[]} [options.files=['package.json']]  Files to bump the version in
 * @param {RegExp} [options.regExp]               Regex used to find/replace the version (must have 3 capture groups: prefix, version, suffix)
 * @param {string} [options.cwd=process.cwd()]    Project root
 */
export default async function release(options = {}) {
    const {
        main = 'main',
        dev = 'develop',
        files = ['package.json'],
        regExp = DEFAULT_REGEXP,
        cwd = process.cwd()
    } = options;

    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));

    console.log(`\n> Merging ${dev} into ${main}`);
    run(`git checkout ${dev}`, cwd);
    run(`git pull origin ${dev}`, cwd);
    run(`git checkout ${main}`, cwd);
    run(`git pull origin ${main}`, cwd);
    run(`git merge ${dev}`, cwd);
    run('git push', cwd);

    const newVersion = await pickVersion(pkg.version);
    writeVersionToFiles(files, regExp, newVersion, cwd);

    const message = `Release ${newVersion}`;

    run('git add -A', cwd);
    run(`git commit -m "${message}"`, cwd);
    run(`git tag -a ${newVersion} -m "${message}"`, cwd);
    run(`git push origin ${newVersion}`, cwd);

    console.log(`\n> Merging ${main} back into ${dev}`);
    run(`git checkout ${dev}`, cwd);
    run(`git pull origin ${dev}`, cwd);
    run(`git merge ${main}`, cwd);
    run('git push', cwd);

    console.log(`\n✔ Release ${newVersion} complete.`);
    return newVersion;
}
