import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function downloadYoutubeAudio(url: string, outputPath: string): Promise<void> {
  await execFileAsync(
    'yt-dlp',
    [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '--no-playlist',
      '--output', outputPath,
      url,
    ],
    { timeout: 10 * 60 * 1000 }
  );
}
