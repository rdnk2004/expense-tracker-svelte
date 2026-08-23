// Svelte store for Student 3-Bucket Budgeting (Survival 50%, Fun 30%, Future 20%)
import { derived } from 'svelte/store';
import { categories, currentMonthExpenses, currentMonthBudgets, studentProfile, currentMonth } from '$lib/stores';
import type { BudgetBucketType, Category } from '$lib/types';
import * as db from '$lib/db';

export interface BucketStats {
    type: BudgetBucketType;
    name: string;
    description: string;
    targetPercent: number;
    allocatedAmount: number; // in paise
    spentAmount: number; // in paise
    remainingAmount: number; // in paise
    spentPercent: number; // percentage of bucket spent
    status: 'safe' | 'warning' | 'exceeded';
    categories: Category[];
}

export const buckets = derived(
    [categories, currentMonthExpenses, currentMonthBudgets, studentProfile, currentMonth],
    ([$categories, $currentMonthExpenses, $currentMonthBudgets, $studentProfile, $currentMonth]) => {
        // Base budget is either overall budget if explicitly set, or student's monthly allowance
        const overallBudget = $currentMonthBudgets.find((b) => b.type === 'overall');
        const baseBudgetPaise = overallBudget?.amount || $studentProfile.monthlyAllowance || 800000;

        const survivalTarget = $studentProfile.survivalBucketPercent ?? 50;
        const funTarget = $studentProfile.funBucketPercent ?? 30;
        const futureTarget = $studentProfile.futureBucketPercent ?? 20;

        const survivalAllocated = Math.round((baseBudgetPaise * survivalTarget) / 100);
        const funAllocated = Math.round((baseBudgetPaise * funTarget) / 100);
        const futureAllocated = Math.round((baseBudgetPaise * futureTarget) / 100);

        let survivalSpent = 0;
        let funSpent = 0;
        let futureSpent = 0;

        const survivalCats: Category[] = [];
        const funCats: Category[] = [];
        const futureCats: Category[] = [];

        $categories.forEach((cat) => {
            const bucket = cat.bucketType || 'fun';
            if (bucket === 'survival') survivalCats.push(cat);
            else if (bucket === 'future') futureCats.push(cat);
            else funCats.push(cat);
        });

        $currentMonthExpenses.forEach((exp) => {
            if (exp.categoryId === 'income') return;
            const cat = $categories.find((c) => c.id === exp.categoryId);
            const bucket = cat?.bucketType || 'fun';

            if (bucket === 'survival') {
                survivalSpent += exp.amount;
            } else if (bucket === 'future') {
                futureSpent += exp.amount;
            } else {
                funSpent += exp.amount;
            }
        });

        function getBucketStatus(spent: number, allocated: number): 'safe' | 'warning' | 'exceeded' {
            if (allocated <= 0) return 'safe';
            const pct = (spent / allocated) * 100;
            if (pct > 100) return 'exceeded';
            if (pct > 85) return 'warning';
            return 'safe';
        }

        const survivalStats: BucketStats = {
            type: 'survival',
            name: 'Survival & Essentials',
            description: 'Mess food, rent, academic supplies, basic commute, health',
            targetPercent: survivalTarget,
            allocatedAmount: survivalAllocated,
            spentAmount: survivalSpent,
            remainingAmount: survivalAllocated - survivalSpent,
            spentPercent: survivalAllocated > 0 ? Math.round((survivalSpent / survivalAllocated) * 100) : 0,
            status: getBucketStatus(survivalSpent, survivalAllocated),
            categories: survivalCats
        };

        const funStats: BucketStats = {
            type: 'fun',
            name: 'Fun & Social Life',
            description: 'Canteen snacks, gaming, movies, weekend outings, shopping',
            targetPercent: funTarget,
            allocatedAmount: funAllocated,
            spentAmount: funSpent,
            remainingAmount: funAllocated - funSpent,
            spentPercent: funAllocated > 0 ? Math.round((funSpent / funAllocated) * 100) : 0,
            status: getBucketStatus(funSpent, funAllocated),
            categories: funCats
        };

        const futureStats: BucketStats = {
            type: 'future',
            name: 'Future & Sinking Buffer',
            description: 'Post-exam trips, tech upgrades, hackathon travel, emergency buffer',
            targetPercent: futureTarget,
            allocatedAmount: futureAllocated,
            spentAmount: futureSpent,
            remainingAmount: futureAllocated - futureSpent,
            spentPercent: futureAllocated > 0 ? Math.round((futureSpent / futureAllocated) * 100) : 0,
            status: getBucketStatus(futureSpent, futureAllocated),
            categories: futureCats
        };

        const totalSpent = survivalSpent + funSpent + futureSpent;
        const totalRemaining = baseBudgetPaise - totalSpent;

        return {
            baseBudgetPaise,
            totalSpent,
            totalRemaining,
            survival: survivalStats,
            fun: funStats,
            future: futureStats,
            hasOverspend: survivalStats.status === 'exceeded' || funStats.status === 'exceeded'
        };
    }
);

/**
 * Change category bucket assignment
 */
export async function setCategoryBucket(categoryId: string, bucketType: BudgetBucketType): Promise<void> {
    await db.updateCategory(categoryId, { bucketType });
    const cats = await db.getCategories();
    categories.set(cats);
}

/**
 * Update custom student bucket target split
 */
export async function updateBucketSplit(survivalPct: number, funPct: number, futurePct: number): Promise<void> {
    await studentProfile.updateProfile({
        survivalBucketPercent: survivalPct,
        funBucketPercent: funPct,
        futureBucketPercent: futurePct
    });
}
