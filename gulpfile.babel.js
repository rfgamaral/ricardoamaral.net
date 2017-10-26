import { dest, parallel, series, src } from 'gulp';

import browserSync from 'browser-sync';
import envalid from 'envalid';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import util from 'gulp-util';
import watch from 'gulp-watch';

const environment = envalid.cleanEnv(process.env);
const browserSyncInstance = browserSync.create();

/**
 * Auxiliary function to log a plugin error with color support and a formatted message.
 *
 * @param {object} event
 */
function logPluginError(event) {
    util.log(new util.PluginError(event.plugin, event.formatted).toString());
}

/**
 * Launch the `browser-sync` HTTP server while watching for file changes and refreshing the browser
 * or the assets accordingly.
 */
function initializeBrowserSync() {
    browserSyncInstance.init({
        files: './dist/**/*',
        server: './dist',
        online: false,
        open: false
    });
}

/**
 * Compile development source Sass files if changes are detected and copies them to the build
 * destination folder only for changed files.
 */
function watchSassTask() {
    return watch('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', logPluginError))
        .pipe(plumber.stop())
        .pipe(dest('./dist/assets/css'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Compile development source Sass files and copies them to the build destination folder.
 */
function buildSassTask() {
    return src('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', logPluginError))
        .pipe(plumber.stop())
        .pipe(dest('./dist/assets/css'));
}

/**
 * Copy all sources - excluding Sass files - from the development source folder to the build
 * destination folder.
 */
function buildSourceTask() {
    return src('./src/**/!(*.scss)', { nodir: true })
        .pipe(dest('./dist'));
}

/**
 * Compile source files and launch `browser-sync` development server. Changes you make will either
 * be injected into the page (CSS and images) or will cause all browsers to do a full-page refresh.
 *
 * @export `development` task.
 */
export const development = series(
    parallel(buildSourceTask, buildSassTask),
    parallel(watchSassTask, initializeBrowserSync)
);

/**
 * Compile source files ready for deployment to GitHub pages.
 */
export const production = parallel(buildSourceTask, buildSassTask);
