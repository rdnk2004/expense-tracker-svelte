// Svelte store for Behavioral Economics, Emotional ROI, and Labor-Time Valuation
import { derived } from 'svelte/store';
import { expenses, categories } from './core';
import { studentProfile } from './profile';
import { goals } from './goals';
import { calculateHoursOfWork } from '$lib/utils';
import type { Expense, ValueTag, SatisfactionRating } from '$lib/types';

export const analytics = derived(
    [expenses, categories, studentProfile, goals],
    ([$expenses, $categories, $studentProfile, $goals]) => {
        // Filter expenses for current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const currentMonthExpenses = $expenses.filter((e) => {
            if (e.categoryId === 'income') return false;
            const d = new Date(e.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        const allExpenses = $expenses.filter((e) => e.categoryId !== 'income');
        const totalExpenseAmount = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        // 1. Emotional ROI Satisfaction Breakdown
        let worthItTotal = 0;
        let neutralTotal = 0;
        let regrettedTotal = 0;
        let unreviewedCount = 0;

        allExpenses.forEach((e) => {
            if (e.satisfactionRating === 'worth_it') {
                worthItTotal += e.amount;
            } else if (e.satisfactionRating === 'neutral') {
                neutralTotal += e.amount;
            } else if (e.satisfactionRating === 'regretted') {
                regrettedTotal += e.amount;
            } else {
                unreviewedCount++;
            }
        });

        const totalRatedAmount = worthItTotal + neutralTotal + regrettedTotal;

        const emotionalRoi = {
            worthItTotal,
            neutralTotal,
            regrettedTotal,
            unreviewedCount,
            totalRatedAmount,
            worthItPercent: totalRatedAmount > 0 ? Math.round((worthItTotal / totalRatedAmount) * 100) : 0,
            neutralPercent: totalRatedAmount > 0 ? Math.round((neutralTotal / totalRatedAmount) * 100) : 0,
            regretPercent: totalRatedAmount > 0 ? Math.round((regrettedTotal / totalRatedAmount) * 100) : 0,
            wastedLaborTime: calculateHoursOfWork(regrettedTotal, $studentProfile.hourlyWageRate || 20000)
        };

        // 2. Value Tag (Needs vs Wants vs Growth) Breakdown
        let needTotal = 0;
        let wantTotal = 0;
        let growthTotal = 0;

        currentMonthExpenses.forEach((e) => {
            const tag = e.valueTag || 'need';
            if (tag === 'need') needTotal += e.amount;
            else if (tag === 'want') wantTotal += e.amount;
            else if (tag === 'growth') growthTotal += e.amount;
        });

        const valueTagTotal = needTotal + wantTotal + growthTotal || 1;

        const valueTags = {
            needTotal,
            wantTotal,
            growthTotal,
            needPercent: Math.round((needTotal / valueTagTotal) * 100),
            wantPercent: Math.round((wantTotal / valueTagTotal) * 100),
            growthPercent: Math.round((growthTotal / valueTagTotal) * 100)
        };

        // 3. Category Spending Breakdown
        const categoryMap = new Map<string, { total: number; count: number }>();
        currentMonthExpenses.forEach((e) => {
            const cur = categoryMap.get(e.categoryId) || { total: 0, count: 0 };
            cur.total += e.amount;
            cur.count += 1;
            categoryMap.set(e.categoryId, cur);
        });

        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([catId, data]) => {
                const cat = $categories.find((c) => c.id === catId);
                return {
                    id: catId,
                    name: cat?.name || 'General',
                    icon: cat?.icon || 'Receipt',
                    color: cat?.color || '#7C3AED',
                    total: data.total,
                    count: data.count,
                    percent: totalExpenseAmount > 0 ? Math.round((data.total / totalExpenseAmount) * 100) : 0
                };
            })
            .sort((a, b) => b.total - a.total);

        // 4. Labor-Time Valuation
        const totalSavedInGoals = $goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const laborHoursSpent = calculateHoursOfWork(totalExpenseAmount, $studentProfile.hourlyWageRate || 20000);
        const laborHoursSaved = calculateHoursOfWork(totalSavedInGoals, $studentProfile.hourlyWageRate || 20000);

        return {
            totalExpenseAmount,
            currentMonthExpenseCount: currentMonthExpenses.length,
            emotionalRoi,
            valueTags,
            categoryBreakdown,
            workValuation: {
                hourlyWageRate: $studentProfile.hourlyWageRate || 20000,
                laborHoursSpent,
                laborHoursSaved,
                totalSavedInGoals
            }
        };
    }
);
