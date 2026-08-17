"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.output = void 0;
exports.debug = debug;
exports.log = log;
exports.warn = warn;
exports.error = error;
exports.fatal = fatal;
const tslib_1 = require("tslib");
const cli_framework_output_1 = require("@ionic/cli-framework-output");
const colors_1 = tslib_1.__importDefault(require("../colors"));
const term_1 = require("./term");
const options = {
    colors: colors_1.default,
    stream: process.argv.includes('--json') ? process.stderr : process.stdout,
};
exports.output = (0, term_1.isInteractive)() ? new cli_framework_output_1.TTYOutputStrategy(options) : new cli_framework_output_1.StreamOutputStrategy(options);
exports.logger = (0, cli_framework_output_1.createDefaultLogger)({
    output: exports.output,
    formatterOptions: {
        titleize: false,
        tags: new Map([
            [cli_framework_output_1.LOGGER_LEVELS.DEBUG, colors_1.default.log.DEBUG('[debug]')],
            [cli_framework_output_1.LOGGER_LEVELS.INFO, colors_1.default.log.INFO('[info]')],
            [cli_framework_output_1.LOGGER_LEVELS.WARN, colors_1.default.log.WARN('[warn]')],
            [cli_framework_output_1.LOGGER_LEVELS.ERROR, colors_1.default.log.ERROR('[error]')],
        ]),
    },
});
function debug(...args) {
    if (process.env.VERBOSE !== 'false') {
        console.log(...args);
    }
}
function log(...args) {
    console.log(...args);
}
function warn(...args) {
    console.warn(...args);
}
function error(...args) {
    console.error(...args);
}
function fatal(msg, exc) {
    console.error(colors_1.default.failure(`Fatal error: ${msg}`));
    console.log('ERROR', msg, exc);
    if (exc) {
        console.error(exc);
    }
    process.exit(1);
}
