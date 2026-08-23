// Realistic College Student Mock Data Generator
import * as db from '$lib/db';
import { initializeApp } from '$lib/stores';
import type { Wallet } from '$lib/types';

export async function loadStudentDemoData(): Promise<void> {
    // 1. Clear existing database for fresh demo
    await db.clearAllData();

    // 2. Setup Student Profile
    await db.saveStudentProfile({
        monthlyAllowance: 1200000, // ₹12,000 in paise
        allowanceDay: 1, // Received on 1st of month
        hourlyWageRate: 25000, // ₹250/hr for campus freelance/tutoring
        collegeName: 'IIT Delhi / Campus Life',
        semester: 'Semester 5',
        currencySymbol: '₹',
        targetSavingsPercent: 20,
        survivalBucketPercent: 50,
        funBucketPercent: 30,
        futureBucketPercent: 20
    });

    const nowISO = new Date().toISOString();

    // 3. Setup Default Wallets
    const upiWallet: Wallet = {
        id: 'wallet-upi',
        name: 'UPI / GPay',
        balance: 685000, // ₹6,850
        updated: nowISO,
        created: nowISO
    };
    await db.saveWallet(upiWallet);

    const cashWallet: Wallet = {
        id: 'wallet-cash',
        name: 'Cash / Mess Stash',
        balance: 140000, // ₹1,400
        updated: nowISO,
        created: nowISO
    };
    await db.saveWallet(cashWallet);

    const categories = await db.getCategories();
    const foodCat = categories.find((c) => c.name.toLowerCase().includes('food'))?.id || 'cat-food';
    const studyCat = categories.find((c) => c.name.toLowerCase().includes('education') || c.name.toLowerCase().includes('study'))?.id || 'cat-other';
    const transportCat = categories.find((c) => c.name.toLowerCase().includes('transport'))?.id || 'cat-transport';
    const shoppingCat = categories.find((c) => c.name.toLowerCase().includes('shopping'))?.id || 'cat-shopping';
    const billsCat = categories.find((c) => c.name.toLowerCase().includes('bill'))?.id || 'cat-bills';

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');

    // 4. Seed Realistic Student Expenses with Value Tags & Satisfaction Ratings
    const sampleExpenses = [
        {
            walletId: upiWallet.id,
            categoryId: foodCat,
            subcategory: 'Canteen',
            amount: 14000, // ₹140
            date: `${y}-${m}-02T13:30:00Z`,
            note: 'Canteen Dosa & Chai with squad',
            valueTag: 'need' as const,
            satisfactionRating: 'worth_it' as const
        },
        {
            walletId: upiWallet.id,
            categoryId: studyCat,
            subcategory: 'Books',
            amount: 65000, // ₹650
            date: `${y}-${m}-04T16:00:00Z`,
            note: 'Algorithms & System Design Guide',
            valueTag: 'growth' as const,
            satisfactionRating: 'worth_it' as const
        },
        {
            walletId: upiWallet.id,
            categoryId: foodCat,
            subcategory: 'Late Delivery',
            amount: 48000, // ₹480
            date: `${y}-${m}-07T23:45:00Z`,
            note: 'Midnight Swiggy Burger (Impulse)',
            valueTag: 'want' as const,
            satisfactionRating: 'regretted' as const
        },
        {
            walletId: cashWallet.id,
            categoryId: transportCat,
            subcategory: 'Metro',
            amount: 12000, // ₹120
            date: `${y}-${m}-10T09:15:00Z`,
            note: 'Metro card campus recharge',
            valueTag: 'need' as const,
            satisfactionRating: 'neutral' as const
        },
        {
            walletId: upiWallet.id,
            categoryId: foodCat,
            subcategory: 'Cafe',
            amount: 22000, // ₹220
            date: `${y}-${m}-12T17:00:00Z`,
            note: 'Campus CCD Cold Coffee study session',
            valueTag: 'want' as const,
            satisfactionRating: 'worth_it' as const
        },
        {
            walletId: upiWallet.id,
            categoryId: shoppingCat,
            subcategory: 'Clothing',
            amount: 89000, // ₹890
            date: `${y}-${m}-15T19:30:00Z`,
            note: 'College Fest Graphic Hoodie',
            valueTag: 'want' as const,
            satisfactionRating: 'neutral' as const
        }
    ];

    for (const exp of sampleExpenses) {
        await db.saveExpense({
            ...exp,
            id: 'exp-' + Math.random().toString(36).substring(2, 9),
            created: exp.date
        });
    }

    // 5. Seed Campus Sinking Funds Goals
    const goaGoal = await db.addGoal({
        title: 'Semester Goa Trip',
        targetAmount: 1800000, // ₹18,000
        targetDate: `${y}-${String(Math.min(12, now.getMonth() + 3)).padStart(2, '0')}-20`,
        category: 'travel',
        emoji: '🌴',
        color: '#F59E0B'
    });

    await db.addGoalContribution(goaGoal.id, 450000, upiWallet.id, 'Freelance UI gig savings');
    await db.addGoalContribution(goaGoal.id, 200000, upiWallet.id, 'Skipped weekend dinner stash');

    const laptopGoal = await db.addGoal({
        title: 'M3 MacBook Air Fund',
        targetAmount: 7500000, // ₹75,000
        targetDate: `${y + 1}-01-15`,
        category: 'tech',
        emoji: '💻',
        color: '#3B82F6'
    });
    await db.addGoalContribution(laptopGoal.id, 1500000, upiWallet.id, 'Internship stipend stash');

    // 6. Seed Subscriptions
    await db.addSubscription({
        name: 'Spotify Student',
        amount: 5900, // ₹59/mo
        billingCycle: 'monthly',
        nextRenewalDate: `${y}-${m}-28`,
        categoryId: 'cat-entertainment',
        walletId: upiWallet.id,
        isEssential: false,
        active: true
    });

    await db.addSubscription({
        name: 'Hostel High-Speed WiFi',
        amount: 49900, // ₹499/mo
        billingCycle: 'monthly',
        nextRenewalDate: `${y}-${m}-25`,
        categoryId: billsCat,
        walletId: upiWallet.id,
        isEssential: true,
        active: true
    });

    // 7. Seed Friend Debts & Split Receivables
    await db.saveDebt({
        id: 'debt-rohan',
        person: 'Rohan Sharma',
        amount: 32000, // ₹320
        direction: 'receive',
        date: `${y}-${m}-11T14:00:00Z`,
        note: 'Dominos pizza slice share',
        upiId: 'rohan@okhdfcbank',
        isSettled: false,
        settledDate: null,
        linkedTransactionId: null,
        created: nowISO
    });

    await db.saveDebt({
        id: 'debt-priya',
        person: 'Priya Verma',
        amount: 25000, // ₹250
        direction: 'receive',
        date: `${y}-${m}-14T18:00:00Z`,
        note: 'Project report printout split',
        upiId: 'priya@okaxis',
        isSettled: false,
        settledDate: null,
        linkedTransactionId: null,
        created: nowISO
    });

    // Reload entire store state
    await initializeApp();
}
