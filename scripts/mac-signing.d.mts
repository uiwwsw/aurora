export function macSigning(env: Record<string, string | undefined>): {
  signed: boolean;
  overrides: string[];
};
