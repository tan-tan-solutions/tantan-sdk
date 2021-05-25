// https://www.seancdavis.com/blog/compile-es6-code-gulp-babel-part-1/
// Import "parallel" function, along with the others we've
// been using.
const { parallel, series, src, dest } = require('gulp')

const babel = require('gulp-babel')
const concat = require('gulp-concat')
// Add del dependency.
const del = require('del')
const plumber = require('gulp-plumber')
// Add uglify dependency.
const uglify = require('gulp-uglify')

// Import the config array as `jsConfig`.
const jsConfig = require('./src/config')

// Use variables to reference project directories.
const srcDir = './src'
const tmpDir = './tmp'
const destDir = './dist'

function jsDeps (done) {
  // Loop through the JS config array and create a Gulp task for
  // each object.
  const tasks = jsConfig.map(config => {
    return done => {
      // Create an array of files from the `deps` property.
      const deps = (config.deps || []).map(f => {
        // If the filename begins with ~ it is assumed the file is
        // relative to node_modules. The filename must also be
        // appended with .js.
        if (f[0] == '~') {
          return `./node_modules/${f.slice(1, f.length)}.js`
        } else {
          return `${srcDir}/${f}.js`
        }
      })
      // If we don't exit in the case that there is no deps property
      // we will hit an error and Gulp will abandon other tasks, so
      // we need to gracefully fail if the config option is missing.
      if (deps.length == 0) {
        done()
        return
      }
      // Build the temporary file based on the config name property,
      // i.e. [name].deps.js.
      return src(deps)
        .pipe(uglify())
        .pipe(concat(`${config.name}.deps.js`))
        .pipe(dest(tmpDir))
    }
  })

  // Run all dynamic tasks in parallel and exit from the main task
  // after all (anonymous) subtasks have completed.
  return parallel(...tasks, parallelDone => {
    parallelDone()
    done()
  })()
}

/**
 *  jsBuild() is identical to jsDeps() with a few exceptions:
 *
 *      1. It looks at the `files` property (not the `deps` property).
 *      2. It processes the concatenated bundle with Babel.
 *      3. It does not support the tilde importer because we assume
 *         all self-authored files are within the source directory.
 *      4. Temp files are named [name].build.js.
 */
function jsBuild (done) {
  const tasks = jsConfig.map(config => {
    return done => {
      const files = (config.files || []).map(f => `${srcDir}/${f}.js`)
      if (files.length == 0) {
        done()
        return
      }
      return (
        src(files)
          .pipe(plumber())
          .pipe(concat(`${config.name}.build.js`))
          .pipe(
            babel({
              presets: [
                [
                  '@babel/env',
                  {
                    modules: false
                  }
                ]
              ]
            })
          )
          // Minify the self-authored bundle.
          .pipe(uglify())
          .pipe(dest(tmpDir))
      )
    }
  })

  return parallel(...tasks, parallelDone => {
    parallelDone()
    done()
  })()
}

// jsConcat() takes the two temporary files from each config
// object ([name].deps.js and [name].build.js) and combines
// then into a single bundle.
function jsConcat (done) {
  const tasks = jsConfig.map(config => {
    return done => {
      const files = [
        `${tmpDir}/${config.name}.deps.js`,
        `${tmpDir}/${config.name}.build.js`
      ]
      // The allowEmpty option means the task won't fail if
      // one of the temp files does not exist.
      return src(files, { allowEmpty: true })
        .pipe(plumber())
        .pipe(concat(`${config.name}.js`))
        .pipe(dest(destDir))
    }
  })

  return parallel(...tasks, parallelDone => {
    parallelDone()
    done()
  })()
}

// Add a jsClean() task to delete the temporary *.deps.js and
// *.build.js files from the temporary directory.
function jsClean (done) {
  const tasks = jsConfig.map(config => {
    return done => {
      const files = [
        `${tmpDir}/${config.name}.deps.js`,
        `${tmpDir}/${config.name}.build.js`
      ]
      return del(files)
    }
  })

  return parallel(...tasks, parallelDone => {
    parallelDone()
    done()
  })()
}

// Add jsClean() as the last task in the series.
exports.default = series(parallel(jsDeps, jsBuild), jsConcat)
