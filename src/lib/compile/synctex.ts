/**
 * Server-only SyncTeX file operations.
 * This module uses Node.js fs/zlib — never import from client code.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export interface SyncTeXRecord {
  page: number;
  v: number;
  h: number;
  width: number;
  height: number;
  line: number;
  column: number;
  sourceFile: string;
}

export interface SyncTeXData {
  records: SyncTeXRecord[];
  sourcePath: string;
  hasData: boolean;
}

/**
 * Read and decompress a .synctex.gz file.
 * Returns raw decompressed text content or null on failure.
 */
export function readGzipSyncTex(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(buffer);
    return decompressed.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Read a plain .synctex file (not compressed).
 */
export function readPlainSyncTex(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Load SyncTeX data for a given compile ID.
 * Searches for both .synctex.gz and .synctex variants.
 */
export function loadSyncTeXData(compileId: string, outputDir: string): SyncTeXData | null {
  const candidates = [
    path.join(outputDir, compileId + '.synctex.gz'),
    path.join(outputDir, compileId + '.synctex'),
  ];

  for (const candidate of candidates) {
    const content = candidate.endsWith('.gz')
      ? readGzipSyncTex(candidate)
      : readPlainSyncTex(candidate);

    if (!content) continue;

    // Parse plain text format
    const records: SyncTeXRecord[] = [];
    const lines = content.split('\n');
    let currentSourceFile = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('Input:')) {
        currentSourceFile = line.replace('Input:', '').trim();
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        const page = parseInt(parts[0], 10);
        if (!isNaN(page)) {
          records.push({
            page,
            h: parseFloat(parts[1]) || 0,
            v: parseFloat(parts[2]) || 0,
            width: parseFloat(parts[3]) || 0,
            height: parseFloat(parts[4]) || 0,
            line: parseInt(parts[5], 10) || 1,
            column: parseInt(parts[6], 10) || 1,
            sourceFile: currentSourceFile,
          });
        }
      }
    }

    if (records.length > 0) {
      return {
        records,
        sourcePath: records[0]?.sourceFile || '',
        hasData: true,
      };
    }
  }

  return { records: [], sourcePath: '', hasData: false };
}