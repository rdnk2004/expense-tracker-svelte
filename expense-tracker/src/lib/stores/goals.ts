// Svelte store for Semester Sinking Funds & Savings Goals
import { writable, derived, get } from 'svelte/store';
import type { SavingsGoal, GoalCategory } from '$lib/types';
import * as db from '$lib/db';
import { wallets, loadWallets } from './core';

function createGoalsStore() {
    const { subscribe, set, update } = writable<SavingsGoal[]>([]);

    return {
        subscribe,
        load: async () => {
            const list = await db.getGoals();
            set(list);
            return list;
        },
        add: async (goalData: {
            title: string;
            targetAmount: number;
            targetDate: string;
            category: GoalCategory;
            emoji?: string;
            color?: string;
            walletId?: string;
        }) => {
            const newGoal = await db.addGoal({
                title: goalData.title,
                targetAmount: goalData.targetAmount,
                targetDate: goalData.targetDate,
                category: goalData.category,
                emoji: goalData.emoji || '🎯',
                color: goalData.color || '#7C3AED',
                walletId: goalData.walletId
            });
            update((list) => [...list, newGoal]);
            return newGoal;
        },
        contribute: async (
            goalId: string,
            amountInPaise: number,
            sourceWalletId?: string,
            note?: string
        ) => {
            // If source wallet is provided, adjust wallet balance
            if (sourceWalletId) {
                const currentWallets = get(wallets);
                const wallet = currentWallets.find((w) => w.id === sourceWalletId);
                if (wallet) {
                    if (wallet.balance < amountInPaise) {
                        throw new Error('Insufficient funds in wallet');
                    }
                    await db.updateWalletBalance(wallet.id, wallet.balance - amountInPaise);
                    await loadWallets();
                }
            }

            // Save contribution and update goal in DB
            const updatedGoal = await db.addGoalContribution(
                goalId,
                amountInPaise,
                sourceWalletId,
                note
            );

            if (updatedGoal) {
                update((list) => list.map((g) => (g.id === goalId ? updatedGoal : g)));
            }
        },
        delete: async (id: string) => {
            const success = await db.deleteGoal(id);
            if (success) {
                update((list) => list.filter((g) => g.id !== id));
            }
            return success;
        }
    };
}

export const goals = createGoalsStore();

/**
 * Derived metrics and pacing calculations for student sinking funds
 */
export const goalStats = derived(goals, ($goals) => {
    let totalTarget = 0;
    let totalSaved = 0;

    const enrichedGoals = $goals.map((goal) => {
        totalTarget += goal.targetAmount;
        totalSaved += goal.currentAmount;

        const progressPercent =
            goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;

        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

        // Days remaining
        let daysLeft = 0;
        let requiredDailyPaise = 0;
        let requiredWeeklyPaise = 0;

        if (goal.targetDate) {
            const targetTime = new Date(goal.targetDate).getTime();
            const nowTime = new Date().setHours(0, 0, 0, 0);
            const diffDays = Math.max(1, Math.round((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
            daysLeft = diffDays;
            requiredDailyPaise = Math.round(remainingAmount / diffDays);
            requiredWeeklyPaise = Math.round(requiredDailyPaise * 7);
        }

        return {
            ...goal,
            progressPercent,
            remainingAmount,
            daysLeft,
            requiredDailyPaise,
            requiredWeeklyPaise,
            isCompleted: goal.currentAmount >= goal.targetAmount
        };
    });

    const overallProgress =
        totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
        totalTarget,
        totalSaved,
        totalRemaining: Math.max(0, totalTarget - totalSaved),
        overallProgress,
        goalsCount: $goals.length,
        enrichedGoals
    };
});
