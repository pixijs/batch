const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: [
                    path.resolve(__dirname, 'node_modules/@babel/runtime'),
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        sourceMap: 'inline',
                    },
                },
            },
            {
                test: /\.glsl?$/,
                use: 'raw-loader',
            },
        ],
    },
    plugins: [
        new ProgressBarPlugin(),
    ],
};
