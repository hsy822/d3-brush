var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'dist');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
    devtool: "source-map",
    target: "web",
    entry: {
        "brush": [APP_DIR + '/brush.ts'],
        "datasource": [APP_DIR + '/dataSource.ts'],
        "spiral": [APP_DIR + '/spiral.ts']
    },

    output: {
        path: BUILD_DIR,
        filename: '[name].dev.js',
        library: 'AG_[name]',
        libraryTarget: "var"
    },

    resolve: {
        extensions: ['.js', '.ts', '.coffee']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'awesome-typescript-loader'
            },
            {
                test: /\.coffee/,
                exclude: /node_modules/,
                loader: 'coffee-loader'
            }
        ]
    },
};

module.exports = config;
