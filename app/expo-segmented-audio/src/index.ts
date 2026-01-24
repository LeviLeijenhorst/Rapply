import ExpoSegmentedAudioModule from './ExpoSegmentedAudioModule';
export function ping(): string {
  return ExpoSegmentedAudioModule.ping();
}
export function encryptFile(inputPath: string, outputPath: string, keyBase64: string) {
  return ExpoSegmentedAudioModule.encryptFile(inputPath, outputPath, keyBase64);
}
export function decryptFile(inputPath: string, outputPath: string, keyBase64: string) {
  return ExpoSegmentedAudioModule.decryptFile(inputPath, outputPath, keyBase64);
}
export function encryptText(text: string, outputPath: string, keyBase64: string) {
  return ExpoSegmentedAudioModule.encryptText(text, outputPath, keyBase64);
}
export function decryptText(inputPath: string, keyBase64: string) {
  return ExpoSegmentedAudioModule.decryptText(inputPath, keyBase64);
}
export function segmentInfo(inputPath: string) {
  return ExpoSegmentedAudioModule.segmentInfo(inputPath);
}
export function encryptToSegmentedWithKey(inputPath: string, outputPathTmp: string, keyBase64: string, segmentSize: number) {
  return ExpoSegmentedAudioModule.encryptToSegmentedWithKey(inputPath, outputPathTmp, keyBase64, segmentSize);
}