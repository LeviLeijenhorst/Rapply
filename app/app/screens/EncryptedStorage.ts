import { File, Directory, Paths } from "expo-file-system";
import { getOrCreateLocalEncryptionKey } from "@/services/encryptionKey"
import { requireNativeModule } from "expo"

export { getOrCreateLocalEncryptionKey }

const ExpoSegmentedAudioNative = requireNativeModule<any>("ExpoSegmentedAudio") as any

export function getDirectory(directoryName: string): Directory {
  return new Directory(Paths.document, directoryName);
}

export function ensureDirectoryExists(directoryName: string): Directory {
  const directory = getDirectory(directoryName);

  if (!directory.exists) {
    directory.create({ intermediates: true });
  }

  return directory;
}

function fileExtensionFromUri(uri: string) {
  const match = uri.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return match ? match[1].toLowerCase() : "m4a";
}

export async function writeEncryptedFile(
  directoryName: string,
  fileName: string,
  content: string,
  type: 'text' | 'audio'
) {
  const encryptionKey = await getOrCreateLocalEncryptionKey()
  const directory = ensureDirectoryExists(directoryName)
  const toFileSystemPath = (uri: string) => (uri.startsWith("file://") ? uri.slice(7) : uri)

  if (type === "audio") {
    if (!fileName.includes(".")) {
      const extension = fileExtensionFromUri(content)
      fileName = `${fileName}.${extension}`
    }
    if (!fileName.toLowerCase().endsWith(".csg1")) {
      fileName = `${fileName}.csg1`
    }
    const outFile = new File(directory, fileName)
    const ok = await ExpoSegmentedAudioNative.encryptToSegmentedWithKey(
      toFileSystemPath(content),
      toFileSystemPath(outFile.uri),
      encryptionKey,
      64 * 1024,
    )
    if (!ok) throw new Error("native audio encrypt failed")
    return
  }

  if (type === "text") {
    const outFile = new File(directory, fileName)
    const ok = await ExpoSegmentedAudioNative.encryptText(content, toFileSystemPath(outFile.uri), encryptionKey)
    if (!ok) throw new Error("native text encrypt failed")
    return
  }

  throw new Error("Invalid type")
}

export async function readEncryptedFile(
  directoryName: string,
  fileName: string
): Promise<string> {
  const encryptionKey = await getOrCreateLocalEncryptionKey()
  const isAudio = fileName.toLowerCase().startsWith("audio.")
  if (isAudio) {
    throw new Error("Audio must be decrypted to a file")
  }
  const directory = getDirectory(directoryName)
  const file = new File(directory, fileName)
  if (!file.exists) {
    throw new Error("Encrypted file does not exist: " + fileName)
  }
  const toFileSystemPath = (uri: string) => (uri.startsWith("file://") ? uri.slice(7) : uri)
  const text = await ExpoSegmentedAudioNative.decryptText(toFileSystemPath(file.uri), encryptionKey)
  return String(text ?? "")
}

export async function deleteFile(
  directoryName: string,
  fileName: string
) {
  const directory = getDirectory(directoryName);
  const file = new File(directory, fileName);

  if (file.exists) {
    file.delete();
  }
}

export async function deleteDirectory(
  directoryName: string,
) {
  const directory = getDirectory(directoryName);
  if (directory.exists) {
    directory.delete();
  }
}

export async function listFiles(directoryName: string): Promise<string[]> {
  const directory = getDirectory(directoryName);

  if (!directory.exists) {
    return [];
  }

  const entries = await directory.list();
  return entries.map((entry) => entry.name);
}

export async function writePlainTextFile(
  directoryName: string,
  fileName: string,
  content: string
) {
  const directory = ensureDirectoryExists(directoryName);
  const file = new File(directory, fileName);
  await file.write(content);
}

export async function readPlainTextFile(
  directoryName: string,
  fileName: string
): Promise<string> {
  const directory = getDirectory(directoryName);
  const file = new File(directory, fileName);
  if (!file.exists) {
    throw new Error("Plain file does not exist: " + fileName);
  }
  return await file.text();
}
