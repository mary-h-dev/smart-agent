import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async saveFile(
    filename: string,
    content: string,
    directory = 'outputs',
  ): Promise<string> {
    await this.ensureDir(directory);
    const filepath = path.join(directory, filename);
    await fs.writeFile(filepath, content, 'utf-8');
    return filepath;
  }

  static generateTimestampedFilename(
    prefix: string,
    extension: string,
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.${extension}`;
  }
}