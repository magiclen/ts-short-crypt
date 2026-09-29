import { defineConfig } from "@rslib/core";

const browserFilename = "short-crypt.min.js";
const browserGlobalName = "ShortCrypt";

export default defineConfig({
    source: {
        entry: {
            index: "./src/index.ts",
        },
        tsconfigPath: "./tsconfig.build.json",
    },
    lib: [
        {
            id: "esm",
            format: "esm",
            dts: true,
            output: {
                distPath: {
                    root: "./lib",
                },
                minify: false,
            },
        },
        {
            id: "browser",
            format: "umd",
            umdName: browserGlobalName,
            output: {
                target: "web",
                distPath: {
                    root: "./dist",
                },
                filename: {
                    js: browserFilename,
                },
                minify: true,
            },
        },
    ],
});
