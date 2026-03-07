declare module 'expo-asset' {
  export class Asset {
    uri: string
    localUri: string | null
    static fromModule(moduleId: unknown): Asset
    downloadAsync(): Promise<Asset>
  }
}
