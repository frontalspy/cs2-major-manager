import { useSyncExternalStore } from "react";
import { store } from "../engine/store";

export function useGame(): number {
  return useSyncExternalStore(store.subscribe, store.getVersion);
}

export function useStore() {
  useGame();
  return store;
}
