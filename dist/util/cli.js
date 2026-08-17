"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAction = wrapAction;
const log_1 = require("./log");
function wrapAction(action) {
    return async (...args) => {
        try {
            await action(...args);
        }
        catch (e) {
            log_1.logger.error(e.message);
            throw e;
        }
    };
}
/*
export async function logPrompt(msg: string, promptObject: any) {
  const { wordWrap } = await import('@ionic/cli-framework-output');
  const prompt = await import('prompts');

  logger.log({
    msg: `${c.input(`[?]`)} ${wordWrap(msg, { indentation: 4 })}`,
    logger,
    format: false,
  });

  return prompt.default(promptObject, { onCancel: () => process.exit(1) });
}

*/
