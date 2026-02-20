import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'app.js',
    output: {
        dir: 'bundle',
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        json(),
        resolve({
            browser: true,
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
        }),
        production && terser(),
        production && analyze(),
    ]
};
