export const getScriptArgs = (): string[] => {
  const args = process.argv.slice(2);

  return args[0] === "--" ? args.slice(1) : args;
};

export const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};
