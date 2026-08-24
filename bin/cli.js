#!/usr/bin/env node
'use strict';

const release = require('../src/release');

const opts = {};
for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'main' || key === 'dev') opts[key] = value;
    if (key === 'files') opts.files = value.split(',');
}

release(opts).catch((err) => {
    console.error(err.message);
    process.exit(1);
});
