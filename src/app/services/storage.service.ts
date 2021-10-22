export const SELECTED_ANSWERS_STORAGE_KEY = 'selectedAnswers';

export enum StorageType {
  Local,
  Session,
}

export class StorageService {
  private static getStorageByType(storageType: StorageType): Storage {
    return storageType === StorageType.Local ? localStorage : sessionStorage;
  }

  static getForKey(key: string, storageType: StorageType): any | null {
    const item = StorageService.getStorageByType(storageType).getItem(key);
    return item && JSON.parse(item);
  }

  static setForKey(key: string, value: any, storageType: StorageType) {
    const stringVal = JSON.stringify(value);
    StorageService.getStorageByType(storageType).setItem(key, stringVal);
  }

  static remove(key: string, storageType: StorageType) {
    StorageService.getStorageByType(storageType).removeItem(key);
  }

  static push(key: string, value: any, storageType: StorageType) {
    const oldItems = StorageService.getForKey(key, storageType) ?? [];
    oldItems.push(value);
    StorageService.setForKey(key, oldItems, storageType);
  }
}
