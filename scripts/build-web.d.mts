export const origin: string;
export function buildWeb(options?: {
  inputDir?: string;
  outputDir?: string;
  production?: boolean;
}): Promise<void>;
