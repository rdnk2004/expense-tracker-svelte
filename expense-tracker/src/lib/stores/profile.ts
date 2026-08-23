// Svelte store for Student Profile and Allowance Configuration
import { writable, derived } from 'svelte/store';
import type { StudentProfile } from '$lib/types';
import * as db from '$lib/db';

function createProfileStore() {
    const { subscribe, set, update } = writable<StudentProfile>({
        id: 'default-student-profile',
        monthlyAllowance: 800000, // ₹8,000 in paise
        allowanceDay: 1, // 1st of month
        hourlyWageRate: 20000, // ₹200/hr in paise
        collegeName: 'Campus Student',
        semester: 'Semester 4',
        currencySymbol: '₹',
        targetSavingsPercent: 20,
        survivalBucketPercent: 50,
        funBucketPercent: 30,
        futureBucketPercent: 20,
        updated: new Date().toISOString()
    });

    return {
        subscribe,
        load: async () => {
            const profile = await db.getStudentProfile();
            set(profile);
            return profile;
        },
        updateProfile: async (updates: Partial<StudentProfile>) => {
            const updated = await db.saveStudentProfile(updates);
            set(updated);
            return updated;
        },
        setMonthlyAllowance: async (amountInPaise: number) => {
            const updated = await db.saveStudentProfile({ monthlyAllowance: amountInPaise });
            set(updated);
            return updated;
        },
        setAllowanceDay: async (day: number) => {
            const updated = await db.saveStudentProfile({ allowanceDay: Math.max(1, Math.min(31, day)) });
            set(updated);
            return updated;
        },
        setHourlyWageRate: async (rateInPaise: number) => {
            const updated = await db.saveStudentProfile({ hourlyWageRate: rateInPaise });
            set(updated);
            return updated;
        }
    };
}

export const studentProfile = createProfileStore();
