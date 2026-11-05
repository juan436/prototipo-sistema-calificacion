import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nowIso } from '../lib/dates';
import { createSeed } from '../mock/seed';
import type { CustomerFeedback, EmailKind, MockDb } from '../mock/types';

interface DemoState {
  db: MockDb;
  /** Simulated login. */
  sessionUserId: string | null;
  /** Tablet authorization mark saved in this browser. */
  deviceTabletId: string | null;
  /** Email preview currently open (not persisted). */
  openEmailId: string | null;
  /** Ratings taken on this tablet while there was no connection, waiting to be sent. */
  pendingFeedback: CustomerFeedback[];
  /** Demo switch to simulate that the tablet lost its internet connection. */
  simulateOffline: boolean;

  login: (userId: string) => void;
  logout: () => void;
  /** Applies a change to a copy of the data and saves it. */
  update: (recipe: (db: MockDb) => void) => void;
  /** Adds an email to the simulated outbox and returns its id. */
  queueEmail: (kind: EmailKind, refId: string, open?: boolean) => string;
  openEmail: (id: string | null) => void;
  setDeviceTablet: (tabletId: string | null) => void;
  setSimulateOffline: (value: boolean) => void;
  resetDemo: () => void;
}

let emailCounter = 0;
let lastOpenedAt = 0;

/** Time when the last email preview was opened. */
export const emailOpenedAt = () => lastOpenedAt;

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      db: createSeed(),
      sessionUserId: null,
      deviceTabletId: null,
      openEmailId: null,
      pendingFeedback: [],
      simulateOffline: false,

      login: (userId) => set({ sessionUserId: userId }),
      logout: () => set({ sessionUserId: null }),
      update: (recipe) => {
        const copy = structuredClone(get().db);
        recipe(copy);
        set({ db: copy });
      },
      queueEmail: (kind, refId, open = false) => {
        emailCounter += 1;
        const id = `em-${Date.now().toString(36)}-${emailCounter}`;
        get().update((db) => {
          db.outbox.unshift({ id, kind, refId, createdAt: nowIso() });
        });
        if (open) {
          lastOpenedAt = Date.now();
          set({ openEmailId: id });
        }
        return id;
      },
      openEmail: (id) => {
        if (id) lastOpenedAt = Date.now();
        set({ openEmailId: id });
      },
      setDeviceTablet: (tabletId) => set({ deviceTabletId: tabletId }),
      setSimulateOffline: (value) => set({ simulateOffline: value }),
      resetDemo: () => set({ db: createSeed(), deviceTabletId: null, openEmailId: null, pendingFeedback: [], simulateOffline: false }),
    }),
    {
      name: 'inolite-prototipo-v2',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        db: s.db,
        sessionUserId: s.sessionUserId,
        deviceTabletId: s.deviceTabletId,
        pendingFeedback: s.pendingFeedback,
        simulateOffline: s.simulateOffline,
      }),
    },
  ),
);

export function useDb(): MockDb {
  return useDemoStore((s) => s.db);
}

export function useCurrentUser() {
  return useDemoStore((s) => s.db.users.find((u) => u.id === s.sessionUserId) ?? null);
}
