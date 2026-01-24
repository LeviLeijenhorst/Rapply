import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoSegmentedAudioModule extends NativeModule<{}> {
  isAvailable: () => boolean;
  ping: () => string;
  encryptFile: (inputPath: string, outputPath: string, keyBase64: string) => Promise<boolean>;
  decryptFile: (inputPath: string, outputPath: string, keyBase64: string) => Promise<boolean>;
  decryptSegmentedToFile: (inputPath: string, outputPath: string, keyBase64: string) => Promise<boolean>;
  encryptText: (text: string, outputPath: string, keyBase64: string) => Promise<boolean>;
  decryptText: (inputPath: string, keyBase64: string) => Promise<string>;
  segmentInfo: (inputPath: string) => { version: number; cipher: string; segmentSize: number; segmentCount: number; fileLength: number };
  encryptToSegmentedWithKey: (inputPath: string, outputPathTmp: string, keyBase64: string, segmentSize: number) => Promise<boolean>;
  playerRegisterToken: (token: string, path: string, keyBase64: string, segmentSize: number, mimeType: string | null) => Promise<boolean>;
  playerLoad: (token: string) => Promise<boolean>;
  playerPlay: () => Promise<boolean>;
  playerPause: () => Promise<boolean>;
  playerSeekTo: (positionMs: number) => Promise<boolean>;
  playerUnload: () => Promise<boolean>;
}

export default requireNativeModule<ExpoSegmentedAudioModule>('ExpoSegmentedAudio');