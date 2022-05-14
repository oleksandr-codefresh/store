import { inject, InjectionToken } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { StateClass } from '@ngxs/store/internals';
import { StateToken } from '@ngxs/store';

import {
  StorageOption,
  StorageEngine,
  NgxsStoragePluginOptions,
  NGXS_STORAGE_PLUGIN_OPTIONS
} from './symbols';

export const DEFAULT_STATE_KEY = new InjectionToken<string>('DEFAULT_STATE_KEY', {
  providedIn: 'root',
  factory: () => {
    const options = inject(NGXS_STORAGE_PLUGIN_OPTIONS);
    return (options && options.namespace) || '@@STATE';
  }
});

/**
 * Internal type definition for the `key` option provided
 * in the `forRoot` method when importing module
 */
export type StorageKey =
  | string
  | StateClass
  | StateToken<any>
  | (string | StateClass | StateToken<any>)[];

/**
 * This key is used to retrieve static metadatas on state classes.
 * This constant is taken from the core codebase
 */
const META_OPTIONS_KEY = 'NGXS_OPTIONS_META';

function transformKeyOption(key: StorageKey): string[] {
  if (!Array.isArray(key)) {
    key = [key];
  }

  return key.map((token: string | StateClass | StateToken<any>) => {
    // If it has the `NGXS_OPTIONS_META` key then it means the developer
    // has provided state class like `key: [AuthState]`.
    if (token.hasOwnProperty(META_OPTIONS_KEY)) {
      // The `name` property will be an actual state name or a `StateToken`.
      token = (token as any)[META_OPTIONS_KEY].name;
    }

    return token instanceof StateToken ? token.getName() : (token as string);
  });
}

export function storageOptionsFactory(
  options: NgxsStoragePluginOptions | undefined,
  defaultStateKey: string
): NgxsStoragePluginOptions {
  if (options !== undefined && options.key) {
    options.key = transformKeyOption(options.key);
  }

  return {
    key: [defaultStateKey],
    storage: StorageOption.LocalStorage,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    beforeSerialize: obj => obj,
    afterDeserialize: obj => obj,
    ...options
  };
}

export function engineFactory(
  options: NgxsStoragePluginOptions,
  platformId: string
): StorageEngine | null {
  if (isPlatformServer(platformId)) {
    return null;
  }

  if (options.storage === StorageOption.LocalStorage) {
    return localStorage;
  } else if (options.storage === StorageOption.SessionStorage) {
    return sessionStorage;
  }

  return null;
}

export function getNamespacedKey(
  isMaster: boolean,
  key: string,
  namespace: string | undefined
): string {
  if (isMaster) {
    return key;
  } else if (namespace) {
    return `${namespace}:${key}`;
  } else {
    return key;
  }
}
