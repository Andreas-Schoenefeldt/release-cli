# release-cli
Small CLI Helper to easily make semver tags in git

## Usage

For advanced options create any js script, like a gulp file:

```js
// Example: wiring the release flow into a gulpfile with project-specific options
const gulp = require('gulp');
const release = require('./src/release');

gulp.task('release', () =>
    release({
        main: 'master',
        dev: 'develop',
        files: ['package.json', 'app/config/packages/twig.yaml'],
        regExp: /(['"]?version['"]?[ ]*:[ ]*['"]?|^twig:[\S\s]*?version:[ ]*)(\d+\.\d+\.\d+)([\d.-]*)(['"]?)/gmi
    })
);

```
