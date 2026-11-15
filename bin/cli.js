#!/usr/bin/env node
'use strict';

import { parseArgs } from 'node:util';
import release from '../src/release.js';

const definition = {
    main:   { type: 'string',  placeholder: 'branch',  description: 'The main branch, if different from "main"' },
    dev:    { type: 'string',  placeholder: 'branch',  description: 'The develop branch, if different from "develop"' },
    regExp: { type: 'string',  placeholder: 'regexp',  description: 'Regex used to find/replace the version (must have 3 capture groups: prefix, version, suffix)' },
    files:  { type: 'string',  placeholder: 'a,b,c',   description: 'Comma-separated list of files to bump the version in (using regExp)' },
    noMerge:{ type: 'boolean', short: 'n',             description: 'Do not merge the release branch into the main branch, just make the release on the current branch.' },
    help:   { type: 'boolean', short: 'h',             description: 'Show this help' },
};

const options = Object.fromEntries(
    Object.entries(definition).map(([name, { type, short }]) => [
        name,
        { type, ...(short && { short }) },
    ])
);

const usage = () => {
    const lines = Object.entries(definition).map(([name, { short, description, placeholder }]) => {
        const flag = `${short ? `-${short}, ` : '    '}--${name}${placeholder ? `=<${placeholder}>` : ''}`;
        return `  ${flag.padEnd(28)}${description}`;
    });
    return `Usage: npx release [options]\n\nOptions:\n${lines.join('\n')}\n`;
};

const { values: opts } = parseArgs({ options });

if (opts.help) {
    console.log(usage());
    process.exit(0);
}

if (opts.files) opts.files = opts.files.split(',');
if (opts.regExp) opts.regExp = new RegExp(opts.regExp);

release(opts).catch((err) => {
    console.error(err.message);
    process.exit(1);
});
