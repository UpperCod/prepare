#!/usr/bin/env node
import cac from "cac";
import chokidar from "chokidar";
import { mergeExports } from "./merge-exports.js";
import { read, logger } from "./utils.js";

const cwd = process.cwd();

const cli = cac("devserver").version("1.0.0");

cli.command("<...files>", "Build files")
    .option("--dist <dist>", "Destination directory")
    .option("--main <dist>", "Nain file")
    .option("--watch", "watch mode")
    .option("--wrappers", "enable the wrapper generator")
    .option("--workspaces", "enable dependency merging")
    .option("--tmp", "allows to generate a temporary package.json")
    .action(
        /**
         *
         * @param {string} src
         * @param {object} flags
         * @param {boolean} flags.watch
         * @param {string} flags.main
         * @param {string} flags.wrappers
         * @param {boolean} flags.tmp
         * @param {boolean} flags.workspaces
         */
        async (src, { watch, main, wrappers, dist, tmp, workspaces }) => {
            const srcPkg = cwd + "/package.json";
            const snapPkg = await read(srcPkg);
            const send = () =>
                mergeExports({
                    src,
                    main,
                    wrappers,
                    dist,
                    pkg: {
                        src: tmp
                            ? srcPkg.replace(/\.json$/, ".tmp.json")
                            : srcPkg,
                        snap: snapPkg,
                    },
                    workspaces,
                });

            await send();

            if (watch) {
                logger("waiting for changes...\n");

                chokidar.watch(src).on("change", async () => {
                    logger("updating...");
                    await send();
                    logger("waiting for changes...\n");
                });
            }
        }
    );

cli.help();

cli.parse();
