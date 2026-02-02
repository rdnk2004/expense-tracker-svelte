import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const PASSWORD_HASH_KEY = 'finance-tracker-password-hash';
const LOCK_STATE_KEY = 'finance-tracker-lock-state';

// Check if password exists
function hasPassword(): boolean {
    if (!browser) return false;
    return !!localStorage.getItem(PASSWORD_HASH_KEY);
}

// Check if app is locked
function isAppLocked(): boolean {
    if (!browser) return false;
    const lockState = localStorage.getItem(LOCK_STATE_KEY);
    return lockState === 'true';
}

// Create stores
export const isLocked = writable(isAppLocked());
export const passwordExists = writable(hasPassword());

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Set password (for first time setup)
export async function setPassword(password: string): Promise<void> {
    if (!browser) return;
    const hash = await hashPassword(password);
    localStorage.setItem(PASSWORD_HASH_KEY, hash);
    localStorage.setItem(LOCK_STATE_KEY, 'false');
    passwordExists.set(true);
    isLocked.set(false);
}

// Verify password
export async function verifyPassword(password: string): Promise<boolean> {
    if (!browser) return false;
    const storedHash = localStorage.getItem(PASSWORD_HASH_KEY);
    if (!storedHash) return false;

    const inputHash = await hashPassword(password);
    const isValid = inputHash === storedHash;

    if (isValid) {
        localStorage.setItem(LOCK_STATE_KEY, 'false');
        isLocked.set(false);
    }

    return isValid;
}

// Lock the app
export function lockApp(): void {
    if (!browser) return;
    localStorage.setItem(LOCK_STATE_KEY, 'true');
    isLocked.set(true);
}

// Check if password strength is acceptable
export function checkPasswordStrength(password: string): {
    strength: 'weak' | 'medium' | 'strong';
    message: string;
} {
    if (password.length < 6) {
        return { strength: 'weak', message: 'Too short (min 6 characters)' };
    }

    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length >= 8 && hasNumber && hasLetter && hasSpecial) {
        return { strength: 'strong', message: 'Strong password' };
    }

    if (password.length >= 6 && ((hasNumber && hasLetter) || (hasLetter && hasSpecial))) {
        return { strength: 'medium', message: 'Medium strength' };
    }

    return { strength: 'weak', message: 'Weak password' };
}
