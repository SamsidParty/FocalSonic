import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';


export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/focalmk.js',
        format: 'umd',
        name: 'focalmk',
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json'
        }),
        nodeResolve(),
        commonjs(), 
    ]
};