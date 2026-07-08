<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		initializeApp,
		isLoading,
		totalBalance,
		currentMonth,
		goToPreviousMonth,
		goToNextMonth,
		formatCurrency,
		exportData,
		getMonthName
	} from '$lib/stores';
	import { auth } from '$lib/stores/auth';
	import {
		LayoutDashboard,
		Wallet,
		Receipt,
		ArrowLeftRight,
		Handshake,
		Target,
		Settings,
		Download,
		LogOut,
		Moon,
		Sun,
		Lock,
		Plus, // FAB icon
		User,
		ChartPie
	} from 'lucide-svelte';

	let { children } = $props();

	// Sidebar state
	let error = $state<string | null>(null);
	let theme = $state<'light' | 'dark'>('light');

	// Navigation items
	const navItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: '/' },
		{ icon: Wallet, label: 'Wallets', href: '/wallets' },
		{ icon: Receipt, label: 'Expenses', href: '/expenses' },
		{ icon: Handshake, label: 'Debts', href: '/debts' },
		{ icon: Target, label: 'Budgets', href: '/budgets' },
		{ icon: ArrowLeftRight, label: 'Transfers', href: '/transfers' },
		{ icon: Settings, label: 'Settings', href: '/settings' }
	];

	// Bottom Nav Items (optimized for mobile - matches design)
	// Design: Home | Transfer | + | Analytics | Profile
	const bottomNavItems = [
		{ icon: LayoutDashboard, label: 'Home', href: '/' },
		{ icon: ArrowLeftRight, label: 'Transfer', href: '/transfers' },
		// Middle is FAB (handled separately in template)
		{ icon: ChartPie, label: 'Analytics', href: '/budgets' },
		{ icon: User, label: 'Profile', href: '/settings' }
	];

	// Initialize app on mount
	onMount(async () => {
		try {
			// One-time database wipe
			const WIPE_KEY = 'axiom_one_time_wipe_v2';
			if (!localStorage.getItem(WIPE_KEY)) {
				const { clearAllData } = await import('$lib/db');
				await clearAllData();
				localStorage.setItem(WIPE_KEY, 'true');
				console.log('🧹 One-time database wipe completed.');
			}

			await initializeApp();

			// Theme Initialization
			const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
			if (savedTheme) {
				theme = savedTheme;
			} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				theme = 'dark';
			}
			document.documentElement.setAttribute('data-theme', theme);
		} catch (err) {
			console.error('Failed to initialize app:', err);
			error = 'Failed to load data. Please refresh the page.';
		}
	});

	// Toggle Theme
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

	// Auth guard - redirect to login if not authenticated
	$effect(() => {
		const currentPath = $page.url.pathname;
		if (!auth.isAuthenticated() && currentPath !== '/login') {
			goto('/login');
		} else if (auth.isAuthenticated() && currentPath === '/login') {
			goto('/');
		}
	});

	async function handleExport() {
		try {
			await exportData();
		} catch (err) {
			console.error('Export failed:', err);
			alert('Failed to export data');
		}
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>RDNK / Axiom</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
	/>
</svelte:head>

<div class="app">
	<!-- Loading Overlay -->
	{#if $isLoading}
		<div class="loading-overlay">
			<div class="spinner"></div>
			<p>Loading your data...</p>
		</div>
	{/if}

	<!-- Error Display -->
	{#if error}
		<div class="error-banner">
			<span>⚠️ {error}</span>
			<button onclick={() => (error = null)}>✕</button>
		</div>
	{/if}

	<!-- Only show Layout if authenticated or if explicitly allowing children (like login) -->
	{#if $page.url.pathname === '/login'}
		{@render children()}
	{:else if $auth}
		<!-- Mobile Top Header (Minimal) -->
		<header class="mobile-header glass-panel">
			<h1 class="mobile-title">
				<span class="rdnk-title">RDNK</span>
				<span class="slash-title">/</span>
				<span class="axiom-wrapper-title">
					<span class="axiom-title">Axiom</span>
				</span>
			</h1>
			<button class="theme-toggle-btn" onclick={toggleTheme} aria-label="Toggle theme">
				{#if theme === 'light'}
					<Moon size={20} />
				{:else}
					<Sun size={20} />
				{/if}
			</button>
		</header>

		<!-- Desktop Sidebar -->
		<aside class="sidebar glass-panel">
			<div class="sidebar-header">
				<h1 class="app-title-container">
					<span class="rdnk-title">RDNK</span>
					<span class="slash-title">/</span>
					<span class="axiom-wrapper-title">
						<span class="axiom-title">Axiom</span>
					</span>
				</h1>
			</div>

			<!-- Balance Display -->
			<div class="balance-card">
				<div class="balance-label">Total Balance</div>
				<div class="balance-amount">{formatCurrency($totalBalance)}</div>
			</div>

			<!-- Month Navigator -->
			<div class="month-navigator">
				<button class="month-btn" onclick={goToPreviousMonth} aria-label="Previous month">
					◀
				</button>
				<div class="current-month">{getMonthName($currentMonth)}</div>
				<button class="month-btn" onclick={goToNextMonth} aria-label="Next month">▶</button>
			</div>

			<!-- Navigation -->
			<nav class="nav">
				{#each navItems as item}
					<a
						href={item.href}
						class="nav-item"
						class:active={$page.url.pathname === item.href}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<span class="nav-icon">
							<item.icon size={22} />
						</span>
						<span class="nav-label">{item.label}</span>
						{#if $page.url.pathname === item.href}
							<div class="active-indicator" transition:slide></div>
						{/if}
					</a>
				{/each}
			</nav>

			<!-- Footer Actions -->
			<div class="sidebar-footer">
				<button class="action-btn" onclick={toggleTheme}>
					{#if theme === 'light'}
						<Moon size={18} /> Dark Mode
					{:else}
						<Sun size={18} /> Light Mode
					{/if}
				</button>
				<button class="action-btn" onclick={handleExport}>
					<Download size={18} /> Export Data
				</button>
				<button class="action-btn danger" onclick={handleLogout}>
					<LogOut size={18} /> Logout
				</button>
			</div>
		</aside>

		<!-- Main Content -->
		<main class="main-content">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>

		<!-- Mobile Bottom Navigation (Floating Island) -->
		<nav class="bottom-nav-island">
			{#each bottomNavItems as item, i}
				<!-- Spacer for FAB in the middle -->
				{#if i === 2}
					<div style="width: 48px;"></div>
				{/if}
				<a href={item.href} class="bottom-nav-item" class:active={$page.url.pathname === item.href}>
					<div class="bottom-nav-icon-container">
						<item.icon size={24} />
						{#if $page.url.pathname === item.href}
							<div class="active-dot"></div>
						{/if}
					</div>
				</a>
			{/each}

			<!-- Floating Action Button (FAB) -->
			<button class="fab-btn" onclick={() => goto('/expenses/new')} aria-label="Add New">
				<Plus size={28} />
			</button>
		</nav>
	{/if}
</div>
```

<style>
	/* ===================================
	   GLOBAL LAYOUT
	   =================================== */

	.app {
		display: flex;
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: background 0.4s ease;
	}

	/* ===================================
	   LOADING OVERLAY & ERRORS
	   =================================== */

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		z-index: 9999;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 3px solid var(--border-color);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-banner {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--danger);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: var(--border-radius-lg);
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: var(--z-toast);
		box-shadow: var(--shadow-lg);
	}

	.error-banner button {
		background: none;
		color: white;
		font-size: 1.2rem;
		opacity: 0.8;
	}

	/* ===================================
	   MOBILE HEADER
	   =================================== */

	.mobile-header {
		display: none; /* Hidden on Desktop */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--header-height);
		padding: 0 1rem;
		justify-content: space-between;
		align-items: center;
		z-index: 100;
		border-top: none;
		border-left: none;
		border-right: none;
		border-bottom: 1px solid var(--border-color);
	}

	.mobile-title {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -1px;
		display: flex;
		align-items: center;
		margin: 0;
	}

	.theme-toggle-btn {
		background: var(--bg-hover);
		color: var(--text-primary);
		padding: 0.5rem;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-color);
		transition: all 0.2s ease;
	}

	.theme-toggle-btn:hover {
		background: var(--border-color);
		transform: scale(1.05);
	}

	.theme-toggle-btn:active {
		transform: scale(0.95);
	}

	/* ===================================
	   SIDEBAR (DESKTOP)
	   =================================== */

	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 280px;
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		z-index: 200;
		/* background provided by glass-panel */
	}

	.sidebar-header {
		padding: 2rem 1.5rem;
	}

	/* Branding Logic */
	.app-title-container {
		font-size: 1.75rem;
		font-weight: 800;
		margin: 0;
		display: flex;
		align-items: center;
		letter-spacing: -1px;
	}

	.rdnk-title {
		color: var(--text-primary);
	}
	.slash-title {
		color: var(--text-secondary);
		margin: 0 0.2rem;
		font-weight: 300;
	}
	.axiom-wrapper-title {
		overflow: hidden;
		display: flex;
	}

	.axiom-title {
		background: linear-gradient(90deg, var(--text-primary), var(--text-secondary));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		transform: translateX(-100%);
		animation: slideOut 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.5s;
		opacity: 0;
	}

	@keyframes slideOut {
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Balance Card */
	.balance-card {
		margin: 0 1.5rem 1.5rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, var(--bg-card), var(--bg-hover));
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		text-align: center;
		box-shadow: var(--shadow-sm);
	}

	.balance-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 1px;
		margin-bottom: 0.5rem;
	}

	.balance-amount {
		font-size: 2rem;
		font-weight: 800;
		color: var(--accent-primary);
		letter-spacing: -1px;
	}

	/* Month Nav */
	.month-navigator {
		margin: 0 1.5rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-hover);
		padding: 4px;
		border-radius: var(--border-radius);
	}

	.month-btn {
		width: 32px;
		height: 32px;
		border-radius: var(--border-radius);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		background: transparent;
	}

	.month-btn:hover {
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}

	.current-month {
		flex: 1;
		text-align: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	/* Nav List */
	.nav {
		flex: 1;
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--border-radius);
		color: var(--text-secondary);
		transition: all 0.2s;
		font-weight: 500;
	}

	.nav-item:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: var(--bg-card);
		color: var(--accent-primary);
		box-shadow: var(--shadow-sm);
	}

	.sidebar-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--border-radius);
		background: transparent;
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.9rem;
	}

	.action-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.action-btn.danger:hover {
		background: var(--danger-bg);
		color: var(--danger);
	}

	/* ===================================
	   MAIN CONTENT
	   =================================== */

	.main-content {
		flex: 1;
		margin-left: 280px; /* Sidebar width */
		min-height: 100vh;
		background: var(--bg-primary);
		padding-bottom: 0; /* No bottom pad on desktop */
	}

	.content-wrapper {
		padding: 2.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* ===================================
	   BOTTOM NAVIGATION (FLOATING ISLAND)
	   =================================== */

	/* Styles handled in layout.css media query mainly, but adding specific item styles here */

	.bottom-nav-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		color: var(--text-muted);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	.bottom-nav-item.active {
		color: var(--accent-primary);
		background: var(--bg-hover);
	}

	.active-dot {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 4px;
		background: var(--accent-primary);
		border-radius: 50%;
	}

	.fab-btn {
		position: absolute;
		bottom: 24px; /* Float above nav */
		left: 50%;
		transform: translateX(-50%);
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--accent-gradient);
		box-shadow: var(--shadow-glow);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.fab-btn:active {
		transform: translateX(-50%) scale(0.9);
	}

	/* ===================================
	   RESPONSIVE (MOBILE)
	   =================================== */

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}
		.mobile-header {
			display: flex;
		}

		.main-content {
			margin-left: 0;
			padding-top: var(--header-height);
			padding-bottom: 100px; /* Space for floating nav */
		}

		.bottom-nav-island {
			display: flex;
			/* Specific positioning in layout.css */
		}

		/* Reposition FAB into the nav bar for tighter integration if preferred,
		   or keep floating above. Current design: Floating above center. */
	}
</style>
