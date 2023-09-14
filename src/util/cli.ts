import { logger } from './log';

export function wrapAction(action: any) {
  return async (...args: any[]): Promise<void> => {
    try {
      await action(...args);
    } catch (e) {
      logger.error((e as any).message);
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
