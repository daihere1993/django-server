const gulp = require('gulp');
const rename = require('gulp-rename');
const config = require('config');
const path = require('path');
const fs = require('graceful-fs');
const tempWrite = require('temp-write');
const map = require('map-stream');
const gutil = require('gulp-util');
const convert = require('xml-js');

//
function _formatElements(elements) {
    const ret = [];
    for (const item of elements) {
        if (item.type === 'element') {
            ret.push({
                name: item.name,
                attributes: item.attributes,
                children: item.elements && item.elements.length ? _formatElements(item.elements) : []
            });
        }
    }
    return ret;
}

function formatJson(json) {
    const obj = JSON.parse(json);
    return JSON.stringify({
        declaration: obj.declaration,
        content: _formatElements(obj.elements)
    });
}

function xml2json(options) {
    return map(function(file, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }

        if (file.isStream()) {
            return cb(new gutil.PluginError('gulp-xml2json', 'Streaming not supported'));
        }

        if (['.xml', '.XML'].indexOf(path.extname(file.path)) === -1) {
            gutil.log('gulp-xml2json: Skipping unsupported xml ' + gutil.colors.blue(file.relative));
            return cb(null, file);
        }

        tempWrite(file.contents, path.extname(file.path)).then(function(tempFile) {
            fs.stat(tempFile, function(err) {
                if (err) {
                    return cb(new gutil.PluginError('gulp-xml2json', err));
                }

                fs.readFile(tempFile, { encoding: 'UTF-8' }, function(err, data) {
                    if (err) {
                        return cb(new gutil.PluginError('gulp-xml2json', err));
                    }

                    options = options || { compact: false, spaces: 4, ignoreComment: true };

                    // file.contents = new Buffer.from(convert.xml2json(data, options));
                    file.contents = new Buffer.from(formatJson(convert.xml2json(data)));
                    file.path = gutil.replaceExtension(file.path, '.json');
                    cb(null, file);
                });
            });
        });
    });
}

exports.default = function() {
    return gulp
        .src(config.get('Path.modelDef') + '/**/*.xml')
        .pipe(xml2json())
        .pipe(rename({ extname: '.json' }))
        .pipe(gulp.dest(config.get('Path.distModelDef')));
};
