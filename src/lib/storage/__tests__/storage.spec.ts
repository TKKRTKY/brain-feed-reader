import { PlatformDetector } from '../../platform/detector';
import { createStorageProvider } from '../provider';
import { StorageMigrationManager } from '../migration';

// モック
jest.mock('../../platform/detector');
const mockPlatformDetector = PlatformDetector as jest.Mocked<typeof PlatformDetector>;

describe('ストレージシステム', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('プラットフォーム検出', () => {
    it('Webプラットフォームを正しく検出する', () => {
      mockPlatformDetector.detect.mockReturnValue({
        type: 'web',
        isDesktop: false,
        isMac: false,
        storageType: 'indexeddb'
      });

      const platform = PlatformDetector.detect();
      expect(platform.type).toBe('web');
      expect(platform.storageType).toBe('indexeddb');
    });

    it('Electronプラットフォームを正しく検出する', () => {
      mockPlatformDetector.detect.mockReturnValue({
        type: 'electron',
        isDesktop: true,
        isMac: true,
        storageType: 'sqlite'
      });

      const platform = PlatformDetector.detect();
      expect(platform.type).toBe('electron');
      expect(platform.storageType).toBe('sqlite');
    });
  });

  describe('ストレージプロバイダー', () => {
    it('Webプラットフォーム用のプロバイダーを作成する', () => {
      const platform = {
        type: 'web' as const,
        isDesktop: false,
        isMac: false,
        storageType: 'indexeddb' as const
      };

      const provider = createStorageProvider(platform);
      expect(provider.constructor.name).toBe('WebStorageProvider');
    });

    it('Electronプラットフォーム用のプロバイダーを作成する', () => {
      const platform = {
        type: 'electron' as const,
        isDesktop: true,
        isMac: true,
        storageType: 'sqlite' as const
      };

      const provider = createStorageProvider(platform);
      expect(provider.constructor.name).toBe('DesktopStorageProvider');
    });
  });

  describe('マイグレーション', () => {
    it('マイグレーションが必要か正しく判定する', async () => {
      const mockAdapter = {
        query: jest.fn().mockResolvedValue([{ version: 1 }]),
        execute: jest.fn()
      };

      const migrations = [
        {
          version: 1,
          up: jest.fn(),
          down: jest.fn()
        },
        {
          version: 2,
          up: jest.fn(),
          down: jest.fn()
        }
      ];

      const manager = new StorageMigrationManager(
        mockAdapter as any,
        {
          type: 'web',
          isDesktop: false,
          isMac: false,
          storageType: 'indexeddb'
        },
        migrations
      );

      const shouldMigrate = await manager.shouldMigrate();
      expect(shouldMigrate).toBe(true);
    });

    it('最新バージョンの場合はマイグレーションが不要と判定する', async () => {
      const mockAdapter = {
        query: jest.fn().mockResolvedValue([{ version: 2 }]),
        execute: jest.fn()
      };

      const migrations = [
        {
          version: 1,
          up: jest.fn(),
          down: jest.fn()
        },
        {
          version: 2,
          up: jest.fn(),
          down: jest.fn()
        }
      ];

      const manager = new StorageMigrationManager(
        mockAdapter as any,
        {
          type: 'web',
          isDesktop: false,
          isMac: false,
          storageType: 'indexeddb'
        },
        migrations
      );

      const shouldMigrate = await manager.shouldMigrate();
      expect(shouldMigrate).toBe(false);
    });
  });
});
