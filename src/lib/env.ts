import { execSync } from 'child_process';

let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  // In produzione senza git, potremmo usare variabili d'ambiente di CI/CD
  commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'unknown';
}

export const COMMIT_HASH = commitHash;
