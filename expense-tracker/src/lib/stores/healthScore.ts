// Svelte store for Student Financial Health Score (0-100) & Gamified Badges
import { derived } from 'svelte/store';
import { runway, debts, subscriptionStats, goalStats, analytics, studentProfile } from './index';
import type { FinancialHealthScore, FinancialBadge } from '$lib/types';

export const healthScore = derived(
    [runway, debts, subscriptionStats, goalStats, analytics, studentProfile],
    ([$runway, $debts, $subscriptionStats, $goalStats, $analytics, $studentProfile]) => {
        // 1. Runway Pillar (25 pts)
        let runwayScore = 15;
        if ($runway.burnRateStatus === 'safe') {
            runwayScore = 25;
        } else if ($runway.burnRateStatus === 'caution') {
            runwayScore = 15;
        } else {
            runwayScore = 5;
        }

        // 2. Savings & Sinking Funds Pillar (25 pts)
        let savingsScore = 5;
        if ($goalStats.goalsCount > 0) {
            savingsScore = Math.min(25, Math.max(10, Math.round(($goalStats.overallProgress / 100) * 25)));
        } else if ($runway.allowanceCycle.totalLiquidBalance > 200000) { // > ₹2,000 liquid buffer
            savingsScore = 15;
        }

        // 3. Social Debt Pillar (25 pts)
        const debtsYouOwe = $debts.filter((d) => !d.isSettled && d.direction === 'give');
        const totalYouOwe = debtsYouOwe.reduce((sum, d) => sum + d.amount, 0);

        let debtScore = 25;
        if (totalYouOwe === 0) {
            debtScore = 25;
        } else if (totalYouOwe < 100000) { // < ₹1,000 owed
            debtScore = 18;
        } else if (totalYouOwe < 300000) { // < ₹3,000 owed
            debtScore = 10;
        } else {
            debtScore = 5;
        }

        // 4. Recurring Leakage Control Pillar (25 pts)
        let leakageScore = 25;
        const allowance = $studentProfile.monthlyAllowance || 1000000;
        const leakagePercent = ($subscriptionStats.monthlyTotal / allowance) * 100;

        if (leakagePercent <= 15) {
            leakageScore = 25;
        } else if (leakagePercent <= 30) {
            leakageScore = 15;
        } else {
            leakageScore = 5;
        }

        const totalScore = Math.min(100, runwayScore + savingsScore + debtScore + leakageScore);

        // Grade & Status Label
        let grade: 'A+' | 'B+' | 'C' | 'D' = 'B+';
        let gradeLabel = 'Solid Hustler';
        let gradeColor = '#10B981';

        if (totalScore >= 85) {
            grade = 'A+';
            gradeLabel = 'Campus Mogul 👑';
            gradeColor = '#7C3AED';
        } else if (totalScore >= 70) {
            grade = 'B+';
            gradeLabel = 'Solid Hustler 🚀';
            gradeColor = '#10B981';
        } else if (totalScore >= 50) {
            grade = 'C';
            gradeLabel = 'Survival Mode ⚡';
            gradeColor = '#F59E0B';
        } else {
            grade = 'D';
            gradeLabel = 'High Burn Alert 🚨';
            gradeColor = '#FF3366';
        }

        // 5. Dynamic Achievement Badges
        const badges: Array<{
            id: string;
            title: string;
            emoji: string;
            desc: string;
            unlocked: boolean;
            category: string;
        }> = [
            {
                id: 'runway-master',
                title: 'Runway Pilot',
                emoji: '🛩️',
                desc: 'Daily burn rate is well inside the green zone',
                unlocked: $runway.burnRateStatus === 'safe',
                category: 'runway'
            },
            {
                id: 'tab-zero',
                title: 'Debt Free Hero',
                emoji: '🤝',
                desc: 'Zero active debts owed to friends or canteen',
                unlocked: totalYouOwe === 0,
                category: 'debt'
            },
            {
                id: 'goal-stasher',
                title: 'Goal Stasher',
                emoji: '🎯',
                desc: 'Actively funding semester sinking goals',
                unlocked: $goalStats.totalSaved > 0,
                category: 'savings'
            },
            {
                id: 'mindful-guru',
                title: 'Joy Maximizer',
                emoji: '🧘',
                desc: 'Over 60% of purchases audited as Worth It',
                unlocked: $analytics.emotionalRoi.worthItPercent >= 60,
                category: 'discipline'
            },
            {
                id: 'leak-shield',
                title: 'Leakage Shield',
                emoji: '🛡️',
                desc: 'Fixed subscriptions are under 15% of monthly budget',
                unlocked: leakagePercent <= 15,
                category: 'discipline'
            }
        ];

        return {
            totalScore,
            grade,
            gradeLabel,
            gradeColor,
            breakdown: {
                runwayScore,
                savingsScore,
                debtScore,
                leakageScore
            },
            badges,
            unlockedBadgesCount: badges.filter((b) => b.unlocked).length
        };
    }
);
