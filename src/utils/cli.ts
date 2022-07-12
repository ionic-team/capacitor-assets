export function getOptionValue(
  args: readonly string[],
  arg: string,
): string | undefined;
export function getOptionValue(
  args: readonly string[],
  arg: string,
  defaultValue: string | undefined,
): string;
export function getOptionValue(
  args: readonly string[],
  arg: string,
  defaultValue?: string | undefined,
): string | undefined {
  const i = args.indexOf(arg);

  if (i >= 0) {
    return args[i + 1];
  }

  return defaultValue;
}
