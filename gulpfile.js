const gulp = require('gulp');
const config = require('config');
const path = require('path');
const fs = require('fs');
const tempWrite = require('temp-write');
const mapStream = require('map-stream');
const gutil = require('gulp-util');
const convert = require('xml-js');

function _getDefByName(def, name) {
    return def.filter((item) => {
        return item.name === name;
    })[0];
}

function _getSubmodel(submodelElements, submodelName) {
    return submodelElements.filter((element) => {
        return element.name === submodelName;
    })[0];
}

function _isSubmodelField(type) {
    return type && type.includes('submodel.');
}

function _getSubmodelName(type) {
    return _isSubmodelField(type) && type.split('.')[1];
}

function _updateAttributes(attributes, submodelElements, modelName) {
    if (attributes) {
        if (submodelElements && _isSubmodelField(attributes.type)) {
            const submodelName = _getSubmodelName(attributes.type);
            attributes.submodel = _.clone(_getSubmodel(submodelElements, submodelName));
            if (!attributes.submodel) {
                throw new Error(`Can\'t find right submodel:  ${attributes.type}`);
            }
            attributes.submodel.name = `${modelName}_${submodelName}`;
            attributes.type = 'submodel';
        }
    }
}

function _formatElements(elements, submodelElements, modelName) {
    const formatedEl = [];
    for (const item of elements) {
        const attributes = item.attributes;
        if (item.type === 'element') {
            const element = {
                name: item.name,
                children: item.elements && item.elements.length ? _formatElements(item.elements) : []
            };
            _updateAttributes(attributes, submodelElements, modelName);
            if (attributes) {
                element.attributes = attributes;
            }
            formatedEl.push(element);
        }
    }
    return formatedEl;
}

function _updateAllAttributes(elements, submodelElements, modelName) {
    for (const element of elements) {
        element.attributes && _updateAttributes(element.attributes, submodelElements, modelName);
        if (element.children && element.children.length) {
            _updateAllAttributes(element.children, submodelElements, modelName);
        }
    }
}

function _formatSubmodel(elements, modelName) {
    elements = _formatElements(elements);
    _updateAllAttributes(elements, elements, modelName);
    return elements;
}

function formatJson(json, fileName) {
    const obj = JSON.parse(json);
    const modelName = obj.declaration.attributes.name;
    const rootElements = obj.elements;

    if (!modelName) {
        throw new Error(`Not define model name <${fileName}>`);
    }

    const fieldsDef = _getDefByName(rootElements, 'fields');
    const submodelsDef = _getDefByName(rootElements, 'submodels');
    const formatedSubmodels = submodelsDef && _formatSubmodel(submodelsDef.elements, modelName);

    return JSON.stringify({
        declaration: obj.declaration,
        content: {
            fields: _formatElements(fieldsDef.elements, formatedSubmodels, modelName)
        }
    });
}

function xml2json() {
    return mapStream(function(file, cb) {
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
                    const content = formatJson(convert.xml2json(data), file.basename);
                    file.contents = new Buffer.from(content);
                    file.path = gutil.replaceExtension(file.path, '.json');
                    cb(null, file);
                });
            });
        });
    });
}

gulp.task('compile-definition', function() {
    return gulp
        .src(config.get('Path.modelDef') + '/**/*.xml')
        .pipe(xml2json())
        .pipe(gulp.dest(config.get('Path.distModelDef')));
});

gulp.task('default', gulp.series('compile-definition', 'def2TsInterface'));
