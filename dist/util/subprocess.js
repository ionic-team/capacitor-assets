"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = void 0;
const tslib_1 = require("tslib");
const utils_subprocess_1 = require("@ionic/utils-subprocess");
const colors_1 = (0, tslib_1.__importDefault)(require("../colors"));
async function runCommand(command, args, options = {}) {
    console.log(colors_1.default.strong(`> ${command} ${args.join(' ')}`));
    const p = new utils_subprocess_1.Subprocess(command, args, options);
    try {
        // return await p.output();
        return await p.run();
    }
    catch (e) {
        if (e instanceof utils_subprocess_1.SubprocessError) {
            // old behavior of just throwing the stdout/stderr strings
            throw e.output ? e.output : e.code ? e.code : e.error ? e.error.message : 'Unknown error';
        }
        throw e;
    }
}
exports.runCommand = runCommand;
