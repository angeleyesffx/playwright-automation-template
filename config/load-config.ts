import dotenv from 'dotenv';
import path from 'path';

export function loadProjectConfig(): void {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}
