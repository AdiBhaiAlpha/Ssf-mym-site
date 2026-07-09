import { build } from 'esbuild';
import { execSync } from 'child_process';

try {
  // 1. Build the frontend assets using Vite
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // 2. Build the backend server using esbuild API
  console.log('Building backend with esbuild...');
  await build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
  });

  console.log('Build successfully finished!');
} catch (error) {
  console.error('Build failed with error:', error);
  process.exit(1);
}
