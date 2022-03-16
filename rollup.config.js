import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import analyze from 'rollup-plugin-analyzer';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'app.js',
    output: {
        file: 'bundle.js',
        format: 'iife',
        sourcemap: true,
        inlineDynamicImports: true
    },
    plugins: [
        resolve({
            jsnext: true,
            module: true,
            browser: true
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled'
        }),
        production && terser(),
        analyze()
	  ]
};
