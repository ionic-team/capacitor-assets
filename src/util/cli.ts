import { logger } from './log';
import c from '../colors';

export function wrapAction(action: any) {
  return async (...args: any[]) => {
    try {
      await action(...args);
    } catch (e: any) {
      logger.error(e.message);
      throw e;
    }
  };
}

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
