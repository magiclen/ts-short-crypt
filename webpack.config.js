const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    entry: "./src/short_crypt.ts",
    output: {
        clean: true,
        filename: "short-crypt.min.js",
        library: "ShortCrypt",
        libraryTarget: "umd",
        globalObject: "this",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: { presets: ["@babel/preset-env"] },
                    },
                    { loader: "ts-loader" },
                ],
            },
            {
                test: /\.(js)$/,
                use: {
                    loader: "babel-loader",
                    options: { presets: ["@babel/preset-env"] },
                },
            },
        ],
    },
    optimization: { minimizer: [new TerserPlugin({ extractComments: false, terserOptions: { format: { comments: false } } })] },
    resolve: { extensions: [".ts", ".js"] },
};
