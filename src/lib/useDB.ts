import { useSyncExternalStore } from "react";
import { loadDB, subscribe, type DB } from "./store";

export function useDB<T>(selector: (db: DB) => T): T {
  return useSyncExternalStore(
    (cb) => {
      subscribe(cb);
      return () => subscribe(cb);
    },
    () => selector(loadDB()),
    () => selector(loadDB()),
  );
}

export const useFullDB = () => useDB((d) => d);
