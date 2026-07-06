import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const DEFAULT_PIN = '2255';
const STORAGE_KEY = 'rdnk_auth_state';

function createAuthStore() {
    // Initialize from storage if available
    const initialValue = browser && localStorage.getItem(STORAGE_KEY) === 'true';
    const { subscribe, set, update } = writable(initialValue);

    return {
        subscribe,
        login: (pin: string) => {
            if (pin === DEFAULT_PIN) {
                set(true);
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, 'true');
                }
                return true;
            }
            return false;
        },
        logout: () => {
            set(false);
            if (browser) {
                localStorage.removeItem(STORAGE_KEY);
            }
        },
        isAuthenticated: () => {
            return browser && localStorage.getItem(STORAGE_KEY) === 'true';
        }
    };
}

export const auth = createAuthStore();

export function lockApp() {
    auth.logout();
}

export const passwordExists = writable(true);
