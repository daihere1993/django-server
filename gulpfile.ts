import { task, src, dest, series } from 'gulp';
import { config } from 'node-config-ts';
import { def2json } from '@daihere1993/dsp';

task('compile-definition', () => {
  return src(`${process.cwd()}${config.Path.modelDef}/**/*.xml`)
    .pipe(def2json())
    .pipe(dest(process.cwd() + config.Path.distModelDef));
});

task('default', series('compile-definition'));
