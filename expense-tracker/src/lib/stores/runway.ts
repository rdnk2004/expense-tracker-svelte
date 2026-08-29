// Svelte derived store and calculations for Student Financial Runway & Safe-to-Spend Engine
import { derived } from 'svelte/store';
import { wallets, expenses, totalBalance } from './core';
import { studentProfile } from './profile';
import type { AllowanceCycle, BurnRateStatus } from '$lib/types';

/**
 * Calculates current allowance cycle date boundaries based on allowanceDay
 */
export function getAllowanceCycleDates(allowanceDay: number, referenceDate: Date = new Date()): {
    startDate: Date;
    endDate: Date;
    daysRemaining: number;
    totalDays: number;
} {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 0-indexed
    const day = referenceDate.getDate();

    let startDate: Date;
    let endDate: Date;

    if (day >= allowanceDay) {
        // We are currently in the cycle that started this month on allowanceDay
        startDate = new Date(year, month, allowanceDay, 0, 0, 0, 0);
        // End date is day before next month's allowanceDay
        endDate = new Date(year, month + 1, allowanceDay - 1, 23, 59, 59, 999);
    } else {
        // We are in the cycle that started last month
        startDate = new Date(year, month - 1, allowanceDay, 0, 0, 0, 0);
        endDate = new Date(year, month, allowanceDay - 1, 23, 59, 59, 999);
    }

    // Normalize start/end for months with fewer days (e.g. Feb)
    if (isNaN(startDate.getTime())) {
        startDate = new Date(year, month, 1, 0, 0, 0, 0);
    }
    if (isNaN(endDate.getTime())) {
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);

    // Days remaining includes today
    const nowZero = new Date(year, month, day, 0, 0, 0, 0);
    const endZero = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
    const daysRemaining = Math.max(1, Math.round((endZero.getTime() - nowZero.getTime()) / msPerDay) + 1);

    return { startDate, endDate, daysRemaining, totalDays };
}

/**
 * Derived store calculating real-time runway and daily safe-to-spend
 */
export const runway = derived(
    [wallets, expenses, totalBalance, studentProfile],
    ([$wallets, $expenses, $totalBalance, $studentProfile]) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const allowanceDay = $studentProfile.allowanceDay || 1;
        const { startDate, endDate, daysRemaining, totalDays } = getAllowanceCycleDates(allowanceDay);

        // 1. Calculate expenses in current allowance cycle
        const cycleExpenses = $expenses.filter((e) => {
            if (e.categoryId === 'income') return false;
            const expDate = new Date(e.date);
            return expDate >= startDate && expDate <= endDate;
        });

        const totalCycleSpent = cycleExpenses.reduce((sum, e) => sum + e.amount, 0);

        // 2. Calculate today's spending
        const todayExpenses = $expenses.filter((e) => {
            return e.categoryId !== 'income' && e.date.startsWith(todayStr);
        });
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        // 3. Calculate 7-day average daily burn rate
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7DaysExpenses = $expenses.filter((e) => {
            if (e.categoryId === 'income') return false;
            const expDate = new Date(e.date);
            return expDate >= sevenDaysAgo && expDate <= new Date();
        });
        const spentLast7Days = last7DaysExpenses.reduce((sum, e) => sum + e.amount, 0);
        const avgDailyBurnRate7Days = Math.round(spentLast7Days / 7);

        // 4. Calculate Liquid Balance & Fixed Committed Reserves (e.g. 10% emergency buffer)
        const liquidBalance = Math.max(0, $totalBalance);
        const emergencyBuffer = Math.round(($studentProfile.monthlyAllowance * 0.1)); // 10% safety buffer
        const availablePool = Math.max(0, liquidBalance - emergencyBuffer);

        // 5. Dynamic Daily Safe Spend
        // Formula: Available spendable money divided by remaining days
        const dailySafeSpend = daysRemaining > 0 ? Math.floor(availablePool / daysRemaining) : availablePool;
        const todayRemainingLimit = dailySafeSpend - todaySpent;

        // 6. Projected runway in days based on burn rate
        let projectedRunwayDays = daysRemaining;
        if (avgDailyBurnRate7Days > 0) {
            projectedRunwayDays = Math.floor(liquidBalance / avgDailyBurnRate7Days);
        } else if (dailySafeSpend > 0) {
            projectedRunwayDays = Math.floor(liquidBalance / dailySafeSpend);
        }

        // 7. Determine status
        let burnRateStatus: BurnRateStatus = 'safe';
        if (liquidBalance <= 0 || todayRemainingLimit < 0 || projectedRunwayDays < daysRemaining) {
            burnRateStatus = 'critical';
        } else if (todaySpent > dailySafeSpend * 0.8 || projectedRunwayDays <= daysRemaining + 1) {
            burnRateStatus = 'caution';
        } else {
            burnRateStatus = 'safe';
        }

        const allowanceCycle: AllowanceCycle = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            daysRemaining,
            totalDays,
            dailySafeSpend,
            totalLiquidBalance: liquidBalance,
            fixedCommitments: emergencyBuffer,
            burnRateStatus
        };

        return {
            allowanceCycle,
            dailySafeSpend,
            todaySpent,
            todayRemainingLimit,
            todayPacePercent: dailySafeSpend > 0 ? Math.round((todaySpent / dailySafeSpend) * 100) : 100,
            avgDailyBurnRate7Days,
            projectedRunwayDays,
            burnRateStatus,
            totalCycleSpent,
            daysRemaining,
            totalDays,
            cycleProgressPercent: Math.round(((totalDays - daysRemaining) / totalDays) * 100),
            emergencyBuffer
        };
    }
);
