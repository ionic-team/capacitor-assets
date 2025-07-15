"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fatal = exports.error = exports.warn = exports.log = exports.debug = exports.logger = exports.output = void 0;
const tslib_1 = require("tslib");
const cli_framework_output_1 = require("@ionic/cli-framework-output");
const colors_1 = (0, tslib_1.__importDefault)(require("../colors"));
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
exports.debug = debug;
function log(...args) {
    console.log(...args);
}
exports.log = log;
function warn(...args) {
    console.warn(...args);
}
exports.warn = warn;
function error(...args) {
    console.error(...args);
}
exports.error = error;
function fatal(msg, exc) {
    console.error(colors_1.default.failure(`Fatal error: ${msg}`));
    console.log('ERROR', msg, exc);
    if (exc) {
        console.error(exc);
    }
    process.exit(1);
}
exports.fatal = fatal;
