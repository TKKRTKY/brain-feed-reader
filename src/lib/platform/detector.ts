export interface PlatformInfo {
  type: 'web' | 'electron';
  isDesktop: boolean;
  isMac: boolean;
  storageType: 'indexeddb' | 'sqlite';
}

export class PlatformDetector {
  static detect(): PlatformInfo {
    const isElectron = typeof process !== 'undefined' && process.type === 'renderer';
    const isMac = typeof process !== 'undefined' && process.platform === 'darwin';

    return {
      type: isElectron ? 'electron' : 'web',
      isDesktop: isElectron,
      isMac,
      storageType: isElectron ? 'sqlite' : 'indexeddb'
    };
  }
}
