import { dest, parallel, series, src } from 'gulp';

import browserSync from 'browser-sync';
import cssnano from 'gulp-cssnano';
import envalid from 'envalid';
import gulpif from 'gulp-if';
import htmlmin from 'gulp-htmlmin';
import merge2 from 'merge2';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import ssi from 'gulp-ssi';
import uglify from 'gulp-uglify';
import util from 'gulp-util';
import watch from 'gulp-watch';

const environment = envalid.cleanEnv(process.env);
const browserSyncInstance = browserSync.create();

/**
 * Auxiliary function to log a plugin error with color support and a formatted message.
 *
 * @param {object} event Event information pertaining to an `EventEmitter` event.
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
 * Compile development source Sass files when changes are detected and pipes them into the build
 * destination folder only for changed files.
 */
function watchStylesTask() {
    return watch('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', logPluginError))
        .pipe(plumber.stop())
        .pipe(dest('./dist/assets/css'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Compile development source Sass files and pipes them into the build destination folder.
 */
function buildStylesTask() {
    return src('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', logPluginError))
        .pipe(plumber.stop())
        .pipe(gulpif(environment.isProduction, cssnano()))
        .pipe(dest('./dist/assets/css'));
}

/**
 * Watch for script changes and pipes the modified files into the build destination folder.
 */
function watchScriptsTask() {
    return watch('./src/assets/js/**/*.js')
        .pipe(dest('./dist/assets/js'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Beautify (development) or uglify (production) JS files and pipes them into the build destination
 * folder. Any scripts already minified will be copied as-is.
 */
function buildScriptsTask() {
    return merge2(
        src(['./src/assets/js/**/*.js', '!**/*.min.js'])
            .pipe(gulpif(environment.isProduction, uglify())),
        src('./src/assets/js/**/*.min.js')
    ).pipe(dest('./dist/assets/js'));
}

/**
 * Watch for template changes and pipes the modified files into the build destination folder.
 */
function watchTemplateTask() {
    return watch('./src/**/!(*.js|*.scss)')
        .pipe(dest('./dist'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Minify the main HTML template and pipes it into the build destination folder along with all
 * related files not previously processed by other tasks.
 */
function buildTemplateTask() {
    return merge2(
        src('./src/index.html')
            .pipe(gulpif(environment.isProduction, ssi({ root: './' })))
            .pipe(gulpif(environment.isProduction, htmlmin({
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeOptionalTags: true,
                removeRedundantAttributes: true
            }))),
        src('./src/**/!(*.html|*.js|*.scss)', { nodir: true })
    ).pipe(dest('./dist'));
}

/**
 * Compile source files and launch `browser-sync` development server. Changes you make will either
 * be injected into the page (CSS and images) or will cause all browsers to do a full-page refresh.
 *
 * @export `development` task.
 */
export const development = series(
    parallel(buildStylesTask, buildScriptsTask, buildTemplateTask),
    parallel(watchStylesTask, watchScriptsTask, watchTemplateTask, initializeBrowserSync)
);

/**
 * Compile source files ready for deployment to GitHub pages.
 *
 * @export `production` task.
 */
export const production = parallel(buildStylesTask, buildScriptsTask, buildTemplateTask);
