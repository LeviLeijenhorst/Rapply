import { registerWebModule, NativeModule } from 'expo';

import { ExpoSegmentedAudioModuleEvents } from './ExpoSegmentedAudio.types';

class ExpoSegmentedAudioModule extends NativeModule<ExpoSegmentedAudioModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoSegmentedAudioModule, 'ExpoSegmentedAudioModule');
