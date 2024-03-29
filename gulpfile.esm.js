import { dest, parallel, series, src } from 'gulp';

import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import cssnano from 'gulp-cssnano';
import dartSass from 'sass';
import environments from 'gulp-environments';
import htmlmin from 'gulp-htmlmin';
import merge2 from 'merge2';
import plumber from 'gulp-plumber';
import revAll from 'gulp-rev-all';
import revDeleteOriginal from 'gulp-rev-delete-original';
import gulpSass from 'gulp-sass';
import ssi from 'gulp-ssi';
import uglify from 'gulp-uglify';
import watch from 'gulp-watch';

const sass = gulpSass(dartSass);

/**
 * Assign development and production environments to local variables.
 */
const isDevelopment = environments.development;
const isProduction = environments.production;

/**
 * Create a Browsersync instance for development mode.
 */
const browserSyncInstance = browserSync.create();

/**
 * Launch the Browsersync HTTP server while watching for file changes and refreshing the browser
 * or injecting assets on-the-fly.
 */
function initializeBrowserSync() {
    browserSyncInstance.init({
        files: './dist/**/*',
        server: './dist',
        online: false,
        open: false,
    });
}

/**
 * Watch style related files for changes and pipe the modified ones into the build destination
 * folder, eventually notifying Browsersync of all changes causing a browser reload.
 */
function watchStylesTask() {
    return watch('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(plumber.stop())
        .pipe(dest('./dist/assets/css'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Build style related files for either production or development. If building for production,
 * all CSS files will be minified and optimized.
 */
function buildStylesTask() {
    const cssnanoOptions = {
        autoprefixer: false,
    };

    return src('./src/assets/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(plumber.stop())
        .pipe(isProduction(autoprefixer()))
        .pipe(isProduction(cssnano(cssnanoOptions)))
        .pipe(dest('./dist/assets/css'));
}

/**
 * Watch script related files for changes and pipe the modified ones into the build destination
 * folder, eventually notifying Browsersync of all changes causing a browser reload.
 */
function watchScriptsTask() {
    return watch('./src/assets/scripts/**/*.js')
        .pipe(babel())
        .pipe(dest('./dist/assets/scripts'))
        .pipe(browserSyncInstance.stream());
}

/**
 * Build script related files for either production or development. If building for production,
 * all JS filles will be uglified.
 */
function buildScriptsTask() {
    return src('./src/assets/scripts/**/*.js')
        .pipe(babel())
        .pipe(isProduction(uglify()))
        .pipe(dest('./dist/assets/scripts'));
}

/**
 * Watch template related files for changes and pipe the modified ones into the build destination
 * folder, eventually notifying Browsersync of all changes causing a browser reload.
 */
function watchTemplateTask() {
    return watch('./src/**/!(*.js|*.scss)').pipe(dest('./dist')).pipe(browserSyncInstance.stream());
}

/**
 * Build template related files for either production or development. If building for production,
 * all HTML will be minified and server-side includes will be parsed.
 */
function buildTemplateTask() {
    const ssiOptions = {
        root: './',
    };

    return merge2(
        src('./src/index.html')
            .pipe(isProduction(ssi(ssiOptions)))
            .pipe(
                isProduction(
                    htmlmin({
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        minifyCSS: true,
                        minifyJS: true,
                        removeComments: true,
                        removeEmptyAttributes: true,
                        removeOptionalTags: true,
                        removeRedundantAttributes: true,
                    })
                )
            ),
        src('./src/**/!(*.html|*.js|*.scss)', { nodir: true })
    ).pipe(dest('./dist'));
}

/**
 * Perform static asset revisioning - with dependency considerations - by appending content hash to
 * filenames (eg. unicorn.css => unicorn.098f6bcd.css).
 */
function revStaticAssetsTask() {
    const revAllOptions = {
        dontGlobal: [/^\/favicon.ico$/g],
        dontRenameFile: ['index.html', 'open-graph-preview.png'],
    };

    return src('./dist/**/*')
        .pipe(revAll.revision(revAllOptions))
        .pipe(revDeleteOriginal())
        .pipe(dest('./dist'));
}

/**
 * Compile source files and launch a Browsersync development server. Changes made will either be
 * injected into the page or will cause all browsers to do a full-page refresh.
 */
function buildDevelopment() {
    return series(
        parallel(buildStylesTask, buildScriptsTask, buildTemplateTask),
        parallel(watchStylesTask, watchScriptsTask, watchTemplateTask, initializeBrowserSync)
    );
}

/**
 * Compile source files ready for deployment to a static hosting platform.
 */
function buildProduction() {
    return series(
        parallel(buildStylesTask, buildScriptsTask, buildTemplateTask),
        revStaticAssetsTask
    );
}

/**
 * Default build task for both development and production builds.
 */
export const build = isDevelopment() ? buildDevelopment() : buildProduction();
