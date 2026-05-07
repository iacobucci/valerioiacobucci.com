import { isAuthorized } from "@/auth";
import path from 'path';

export const CONTENT_PATH = path.join(process.cwd(), 'content');

export function resolveAndValidatePath(relativePath: string): string {
  const fullPath = path.resolve(CONTENT_PATH, relativePath);
  if (!fullPath.startsWith(CONTENT_PATH)) {
    throw new Error("Invalid path: Out of bounds");
  }
  return fullPath;
}

export async function checkAuth() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }
}
