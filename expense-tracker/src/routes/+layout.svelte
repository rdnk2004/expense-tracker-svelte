<script lang="ts">
	import { onMount } from 'svelte';
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
	import { isLocked } from '$lib/stores/auth';

	let { children } = $props();

	// Sidebar state
	let sidebarOpen = $state(false);
	let error = $state<string | null>(null);

	// Navigation items
	const navItems = [
		{ icon: '📊', label: 'Dashboard', href: '/' },
		{ icon: '💰', label: 'Wallets', href: '/wallets' },
		{ icon: '🧾', label: 'Expenses', href: '/expenses' },
		{ icon: '🔄', label: 'Transfers', href: '/transfers' },
		{ icon: '🤝', label: 'Debts', href: '/debts' },
		{ icon: '🎯', label: 'Budgets', href: '/budgets' },
		{ icon: '⚙️', label: 'Settings', href: '/settings' }
	];

	// Initialize app on mount
	onMount(async () => {
		try {
			await initializeApp();
		} catch (err) {
			console.error('Failed to initialize app:', err);
			error = 'Failed to load data. Please refresh the page.';
		}
	});

	// Auth guard - redirect to login if locked
	$effect(() => {
		const currentPath = $page.url.pathname;
		if ($isLocked && currentPath !== '/login') {
			goto('/login');
		}
	});

	// Close sidebar when route changes (mobile)
	$effect(() => {
		$page.url.pathname;
		sidebarOpen = false;
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	async function handleExport() {
		try {
			await exportData();
		} catch (err) {
			console.error('Export failed:', err);
			alert('Failed to export data');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Finance Tracker 🖤</title>
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

	<!-- Mobile Header -->
	<header class="mobile-header">
		<button class="hamburger" onclick={toggleSidebar} aria-label="Toggle menu">
			<span></span>
			<span></span>
			<span></span>
		</button>
		<h1 class="mobile-title">Finance Tracker 🖤</h1>
	</header>

	<!-- Sidebar Navigation -->
	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<h1 class="app-title">Finance Tracker 🖤</h1>
		</div>

		<!-- Balance Display -->
		<div class="balance-card">
			<div class="balance-label">Total Balance</div>
			<div class="balance-amount">{formatCurrency($totalBalance)}</div>
		</div>

		<!-- Month Navigator -->
		<div class="month-navigator">
			<button class="month-btn" onclick={goToPreviousMonth} aria-label="Previous month"> ◀ </button>
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
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Footer Actions -->
		<div class="sidebar-footer">
			<button class="export-btn" onclick={handleExport}>
				<span>📥</span>
				<span>Export Data</span>
			</button>
		</div>
	</aside>

	<!-- Overlay for mobile -->
	{#if sidebarOpen}
		<div
			class="overlay"
			onclick={toggleSidebar}
			onkeydown={(e) => e.key === 'Escape' && toggleSidebar()}
			role="button"
			tabindex="0"
			aria-label="Close sidebar"
		></div>
	{/if}

	<!-- Main Content -->
	<main class="main-content">
		<div class="content-wrapper">
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* ===================================
	   GLOBAL LAYOUT
	   =================================== */

	.app {
		display: flex;
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* ===================================
	   LOADING OVERLAY
	   =================================== */

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(10, 10, 10, 0.95);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		z-index: 9999;
		backdrop-filter: blur(4px);
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

	.loading-overlay p {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	/* ===================================
	   ERROR BANNER
	   =================================== */

	.error-banner {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--danger);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: var(--border-radius);
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 10000;
		box-shadow: var(--shadow-lg);
	}

	.error-banner button {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0;
		opacity: 0.8;
		transition: opacity 0.2s;
	}

	.error-banner button:hover {
		opacity: 1;
	}

	/* ===================================
	   MOBILE HEADER
	   =================================== */

	.mobile-header {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 60px;
		background: var(--bg-card);
		border-bottom: 1px solid var(--border-color);
		align-items: center;
		padding: 0 1rem;
		gap: 1rem;
		z-index: 100;
	}

	.mobile-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.hamburger {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.hamburger span {
		display: block;
		height: 3px;
		background: var(--accent-primary);
		border-radius: 2px;
		transition: all 0.3s;
	}

	/* ===================================
	   SIDEBAR
	   =================================== */

	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 250px;
		background: var(--bg-card);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		transition: transform 0.3s ease;
		z-index: 200;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.app-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
	}

	/* ===================================
	   BALANCE CARD
	   =================================== */

	.balance-card {
		margin: 1.5rem;
		padding: 1.25rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.balance-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.balance-amount {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
	}

	/* ===================================
	   MONTH NAVIGATOR
	   =================================== */

	.month-navigator {
		margin: 0 1.5rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-secondary);
		padding: 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--border-color);
	}

	.month-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--accent-primary);
		width: 36px;
		height: 36px;
		border-radius: var(--border-radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.month-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
		transform: scale(1.05);
	}

	.current-month {
		flex: 1;
		text-align: center;
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	/* ===================================
	   NAVIGATION
	   =================================== */

	.nav {
		flex: 1;
		padding: 0.5rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: var(--border-radius);
		color: var(--text-secondary);
		text-decoration: none;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
	}

	.nav-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 0;
		background: var(--accent-primary);
		transition: height 0.2s;
	}

	.nav-item:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: linear-gradient(
			135deg,
			rgba(192, 192, 192, 0.1) 0%,
			rgba(192, 192, 192, 0.05) 100%
		);
		color: var(--accent-primary);
		border: 1px solid rgba(192, 192, 192, 0.2);
	}

	.nav-item.active::before {
		height: 60%;
	}

	.nav-icon {
		font-size: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
	}

	.nav-label {
		font-weight: 500;
		font-size: 0.95rem;
	}

	/* ===================================
	   SIDEBAR FOOTER
	   =================================== */

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.export-btn {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.export-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-secondary);
		transform: translateY(-1px);
	}

	/* ===================================
	   MAIN CONTENT
	   =================================== */

	.main-content {
		flex: 1;
		margin-left: 250px;
		min-height: 100vh;
		background: var(--bg-primary);
	}

	.content-wrapper {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* ===================================
	   OVERLAY (Mobile)
	   =================================== */

	.overlay {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 150;
		backdrop-filter: blur(2px);
	}

	/* ===================================
	   RESPONSIVE DESIGN
	   =================================== */

	@media (max-width: 768px) {
		.mobile-header {
			display: flex;
		}

		.sidebar {
			transform: translateX(-100%);
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.sidebar-header {
			padding-top: 80px;
		}

		.overlay {
			display: block;
		}

		.main-content {
			margin-left: 0;
			padding-top: 60px;
		}

		.content-wrapper {
			padding: 1rem;
		}

		.balance-amount {
			font-size: 1.5rem;
		}
	}

	/* ===================================
	   SCROLLBAR STYLING
	   =================================== */

	.sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: var(--bg-secondary);
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: var(--accent-secondary);
		border-radius: 3px;
	}

	.sidebar::-webkit-scrollbar-thumb:hover {
		background: var(--accent-primary);
	}
</style>
