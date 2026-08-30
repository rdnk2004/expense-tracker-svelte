<script lang="ts">
	import { onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
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
		getMonthName,
		studentProfile,
		wallets,
		unsettledDebts
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
		Plus,
		User,
		ChartPie,
		Radio,
		PiggyBank,
		ChevronLeft,
		ChevronRight,
		Sparkles,
		X,
		Zap,
		LayoutGrid,
		ArrowLeft,
		Grid
	} from 'lucide-svelte';

	let { children } = $props();

	let error = $state<string | null>(null);
	let theme = $state<'light' | 'dark'>('dark');
	let showQuickActionDrawer = $state(false);
	let showMobileMenuDrawer = $state(false);

	// Navigation groups for desktop sidebar and mobile drawer
	const navGroups = [
		{
			title: 'Command',
			items: [
				{ icon: LayoutDashboard, label: 'Dashboard', desc: 'Liquid Capital & Safe-to-Spend', href: '/' },
				{ icon: Receipt, label: 'Expenses', desc: 'Outflows, Inflows & Regret Audit', href: '/expenses' },
				{ icon: ChartPie, label: 'Labor & ROI', desc: 'Work-Valuation & Emotional Joy', href: '/analytics' }
			]
		},
		{
			title: 'Capital & Tabs',
			items: [
				{ icon: Wallet, label: 'Wallets & Cards', desc: 'UPI, Cash & Bank Accounts', href: '/wallets' },
				{ icon: ArrowLeftRight, label: 'Transfers', desc: 'Internal Fund Flow Engine', href: '/transfers' },
				{ icon: Handshake, label: 'Campus Split Tabs', desc: 'Friend IOUs & Auto WhatsApp', href: '/debts' }
			]
		},
		{
			title: 'Student Budgets',
			items: [
				{ icon: Target, label: '3-Bucket Macro', desc: 'Survival, Fun & Future Splits', href: '/budgets' },
				{ icon: PiggyBank, label: 'Sinking Goals', desc: 'Semester Trips & Tech Funds', href: '/goals' },
				{ icon: Radio, label: 'Subscriptions', desc: 'Recurring Leakage & Chai Habits', href: '/subscriptions' }
			]
		},
		{
			title: 'System',
			items: [
				{ icon: Settings, label: 'Settings & Data', desc: 'Profile, Allowance & Backup', href: '/settings' }
			]
		}
	];

	// Quick scrollable pill items for mobile sub-header
	const quickNavPills = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard },
		{ href: '/expenses', label: 'Expenses', icon: Receipt },
		{ href: '/debts', label: 'Splits', icon: Handshake },
		{ href: '/wallets', label: 'Wallets', icon: Wallet },
		{ href: '/budgets', label: 'Buckets', icon: Target },
		{ href: '/analytics', label: 'Labor ROI', icon: ChartPie },
		{ href: '/goals', label: 'Goals', icon: PiggyBank },
		{ href: '/subscriptions', label: 'Radar', icon: Radio },
		{ href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
		{ href: '/settings', label: 'Hub', icon: Settings }
	];

	const routeTitles: Record<string, string> = {
		'/': 'Dashboard',
		'/expenses': 'Transactions & Audit',
		'/expenses/new': 'Log Expense',
		'/analytics': 'Labor & Spending ROI',
		'/wallets': 'Wallets & Virtual Cards',
		'/transfers': 'Transfers & Flows',
		'/debts': 'Campus Split Tabs',
		'/budgets': '3-Bucket Macro Budget',
		'/goals': 'Sinking Goals & Reserves',
		'/subscriptions': 'Subscriptions Radar',
		'/settings': 'Settings & OS Config'
	};

	let isSubPage = $derived($page.url.pathname !== '/' && $page.url.pathname !== '/login');
	let currentTitle = $derived(routeTitles[$page.url.pathname] || 'Axiom');
	let totalReceivableCount = $derived($unsettledDebts.filter((d) => d.direction === 'receive').length);

	onMount(async () => {
		try {
			const WIPE_KEY = 'axiom_one_time_wipe_v2';
			if (!localStorage.getItem(WIPE_KEY)) {
				const { clearAllData } = await import('$lib/db');
				await clearAllData();
				localStorage.setItem(WIPE_KEY, 'true');
				console.log('🧹 Database initialized for Axiom Campus OS.');
			}

			await initializeApp();

			const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
			if (savedTheme) {
				theme = savedTheme;
			} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
				theme = 'light';
			} else {
				theme = 'dark';
			}
			document.documentElement.setAttribute('data-theme', theme);
		} catch (err) {
			console.error('Failed to initialize Axiom:', err);
			error = 'Failed to load database. Please refresh.';
		}
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

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

	function handleNavigate(route: string) {
		showQuickActionDrawer = false;
		showMobileMenuDrawer = false;
		goto(route);
	}

	function handleGoBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Axiom — Student Neo-Bank</title>
</svelte:head>

<div class="app">
	<!-- Loading Overlay -->
	{#if $isLoading}
		<div class="loading-overlay">
			<div class="spinner-brand">
				<div class="spinner-ring"></div>
				<span class="spinner-glyph">⬡</span>
			</div>
			<p class="loading-text">Syncing Campus Capital...</p>
		</div>
	{/if}

	<!-- Error Toast -->
	{#if error}
		<div class="error-banner">
			<span>⚠️ {error}</span>
			<button onclick={() => (error = null)}>✕</button>
		</div>
	{/if}

	{#if $page.url.pathname === '/login'}
		{@render children()}
	{:else if $auth}
		<!-- Mobile Sticky Glass Header -->
		<header class="mobile-header glass-panel">
			{#if isSubPage}
				<div class="mobile-header-subpage">
					<button class="mobile-back-btn" onclick={handleGoBack} aria-label="Go back">
						<ArrowLeft size={18} />
					</button>
					<div class="subpage-title-col">
						<span class="subpage-title">{currentTitle}</span>
						<span class="subpage-sub">Axiom Campus OS</span>
					</div>
				</div>
			{:else}
				<div class="mobile-brand-wrap" onclick={() => goto('/')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goto('/')}>
					<div class="brand-glyph">
						<Zap size={16} class="glyph-icon" />
					</div>
					<div class="brand-text-col">
						<span class="brand-name">Axiom</span>
						<span class="brand-tag">{$studentProfile.semester || 'Campus OS'}</span>
					</div>
				</div>
			{/if}

			<!-- Actions on Right: Month Pill + Theme + Menu Drawer -->
			<div class="mobile-header-right">
				<!-- Compact Month Navigator for Mobile -->
				<div class="mobile-month-pill">
					<button class="mini-month-btn" onclick={goToPreviousMonth} aria-label="Previous Month">
						<ChevronLeft size={14} />
					</button>
					<span class="mini-month-label">{getMonthName($currentMonth).slice(0, 3)}</span>
					<button class="mini-month-btn" onclick={goToNextMonth} aria-label="Next Month">
						<ChevronRight size={14} />
					</button>
				</div>

				<button class="theme-btn-compact" onclick={toggleTheme} aria-label="Toggle theme">
					{#if theme === 'light'}
						<Moon size={16} />
					{:else}
						<Sun size={16} />
					{/if}
				</button>

				<!-- All Hub Menu Trigger Button -->
				<button
					class="drawer-trigger-btn"
					class:active={showMobileMenuDrawer}
					onclick={() => (showMobileMenuDrawer = true)}
					aria-label="Open all campus features menu"
				>
					<LayoutGrid size={17} />
				</button>
			</div>
		</header>

		<!-- Mobile Horizontal Feature Quick-Pill Bar -->
		<nav class="mobile-subnav-bar glass-panel" aria-label="Quick Category Switching">
			<div class="mobile-pills-scroll touch-scroll-x">
				{#each quickNavPills as item}
					<a
						href={item.href}
						class="subnav-pill"
						class:active={$page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/')}
					>
						<item.icon size={13} />
						<span>{item.label}</span>
						{#if item.href === '/debts' && totalReceivableCount > 0}
							<span class="pill-badge">{totalReceivableCount}</span>
						{/if}
					</a>
				{/each}
			</div>
		</nav>

		<!-- Desktop Neo-Bank Sidebar -->
		<aside class="sidebar glass-panel">
			<div class="sidebar-header">
				<div class="sidebar-brand-row">
					<div class="brand-glyph-lg">
						<Zap size={20} class="glyph-icon" />
					</div>
					<div>
						<div class="brand-title-wrap">
							<h1 class="brand-title">Axiom</h1>
							<span class="campus-badge">Neo-Bank</span>
						</div>
						<p class="student-info-sub">{$studentProfile.collegeName || 'Campus Student'}</p>
					</div>
				</div>
			</div>

			<!-- Quick Liquid Net Worth Hero -->
			<div class="sidebar-balance-hero">
				<div class="hero-top-row">
					<span class="hero-label">Liquid Capital</span>
					<span class="live-pulse-badge">
						<span class="pulse-dot"></span> Live
					</span>
				</div>
				<div class="hero-amount tabular">{formatCurrency($totalBalance)}</div>
				<div class="mini-wallets-strip">
					{#each $wallets as w}
						<span class="mini-wallet-chip" title="{w.name}: {formatCurrency(w.balance)}">
							{w.name.slice(0, 4)}: <strong>{formatCurrency(w.balance).split('.')[0]}</strong>
						</span>
					{/each}
				</div>
			</div>

			<!-- Month Switcher for Desktop -->
			<div class="desktop-month-dock">
				<button class="dock-month-btn" onclick={goToPreviousMonth} aria-label="Previous month">
					<ChevronLeft size={16} />
				</button>
				<div class="dock-month-name">{getMonthName($currentMonth)}</div>
				<button class="dock-month-btn" onclick={goToNextMonth} aria-label="Next month">
					<ChevronRight size={16} />
				</button>
			</div>

			<!-- Grouped Navigation List -->
			<nav class="sidebar-nav-scroll">
				{#each navGroups as group}
					<div class="nav-group-section">
						<span class="nav-group-title">{group.title}</span>
						<div class="nav-group-items">
							{#each group.items as item}
								<a
									href={item.href}
									class="nav-link"
									class:active={$page.url.pathname === item.href}
									aria-current={$page.url.pathname === item.href ? 'page' : undefined}
								>
									<item.icon size={18} class="nav-link-icon" />
									<span class="nav-link-text">{item.label}</span>
									{#if item.href === '/debts' && totalReceivableCount > 0}
										<span class="sidebar-counter">{totalReceivableCount}</span>
									{/if}
									{#if $page.url.pathname === item.href}
										<div class="active-pill-dot" transition:slide></div>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<!-- Sidebar Footer -->
			<div class="sidebar-footer">
				<button class="footer-action-btn" onclick={toggleTheme}>
					{#if theme === 'light'}
						<Moon size={16} /> <span>Dark Theme</span>
					{:else}
						<Sun size={16} /> <span>Light Theme</span>
					{/if}
				</button>
				<button class="footer-action-btn" onclick={handleExport}>
					<Download size={16} /> <span>Export JSON</span>
				</button>
				<button class="footer-action-btn danger" onclick={handleLogout}>
					<LogOut size={16} /> <span>Lock OS</span>
				</button>
			</div>
		</aside>

		<!-- Main Workspace Content -->
		<main class="main-content">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>

		<!-- Mobile Thumb-Zone Floating Glass Dock -->
		<nav class="bottom-dock-wrapper" aria-label="Mobile Navigation">
			<div class="bottom-dock glass-panel">
				<!-- Tab 1: Home -->
				<a href="/" class="dock-item" class:active={$page.url.pathname === '/'}>
					<LayoutDashboard size={20} />
					<span class="dock-label">Home</span>
					{#if $page.url.pathname === '/'}
						<div class="dock-active-glow"></div>
					{/if}
				</a>

				<!-- Tab 2: Expenses -->
				<a href="/expenses" class="dock-item" class:active={$page.url.pathname.startsWith('/expenses')}>
					<Receipt size={20} />
					<span class="dock-label">Feed</span>
					{#if $page.url.pathname.startsWith('/expenses')}
						<div class="dock-active-glow"></div>
					{/if}
				</a>

				<!-- Center Quick Action FAB (+) -->
				<button
					class="center-fab"
					onclick={() => (showQuickActionDrawer = true)}
					aria-label="Quick Actions Menu"
				>
					<Plus size={24} />
				</button>

				<!-- Tab 4: Budgets -->
				<a href="/budgets" class="dock-item" class:active={$page.url.pathname === '/budgets'}>
					<Target size={20} />
					<span class="dock-label">Buckets</span>
					{#if $page.url.pathname === '/budgets'}
						<div class="dock-active-glow"></div>
					{/if}
				</a>

				<!-- Tab 5: Hub / Settings -->
				<a href="/settings" class="dock-item" class:active={$page.url.pathname === '/settings'}>
					<User size={20} />
					<span class="dock-label">Hub</span>
					{#if $page.url.pathname === '/settings'}
						<div class="dock-active-glow"></div>
					{/if}
				</a>
			</div>
		</nav>

		<!-- Mobile All-Features Navigator Drawer -->
		{#if showMobileMenuDrawer}
			<div
				class="modal-backdrop"
				onclick={() => (showMobileMenuDrawer = false)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Escape' && (showMobileMenuDrawer = false)}
				transition:fade={{ duration: 150 }}
			>
				<div
					class="modal-sheet nav-drawer-sheet"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					tabindex="-1"
				>
					<div class="sheet-handle-bar"></div>
					
					<div class="nav-drawer-header">
						<div class="nav-drawer-brand">
							<div class="brand-glyph-sm">
								<Zap size={16} />
							</div>
							<div>
								<h3 class="drawer-title">Campus Features</h3>
								<span class="drawer-sub">{$studentProfile.collegeName || 'Axiom Neo-Bank'} • Live</span>
							</div>
						</div>
						<button class="close-btn" onclick={() => (showMobileMenuDrawer = false)} aria-label="Close menu">✕</button>
					</div>

					<!-- Liquid Capital Mobile Summary Banner in Drawer -->
					<div class="drawer-capital-banner">
						<div class="drawer-cap-left">
							<span class="drawer-cap-lbl">Liquid Capital</span>
							<strong class="drawer-cap-val tabular">{formatCurrency($totalBalance)}</strong>
						</div>
						<button class="drawer-calib-btn" onclick={() => handleNavigate('/wallets')}>
							Wallets <ChevronRight size={14} />
						</button>
					</div>

					<!-- Features Grid by Section -->
					<div class="drawer-sections-scroll">
						{#each navGroups as group}
							<div class="drawer-group-block">
								<span class="drawer-group-title">{group.title}</span>
								<div class="drawer-group-items-list">
									{#each group.items as item}
										<button
											class="drawer-item-row"
											class:active={$page.url.pathname === item.href}
											onclick={() => handleNavigate(item.href)}
										>
											<div class="drawer-item-icon-box">
												<item.icon size={18} />
											</div>
											<div class="drawer-item-info">
												<div class="drawer-item-title-line">
													<strong class="item-title">{item.label}</strong>
													{#if item.href === '/debts' && totalReceivableCount > 0}
														<span class="item-counter-badge">{totalReceivableCount} owed</span>
													{/if}
												</div>
												<span class="item-desc">{item.desc}</span>
											</div>
											<span class="drawer-arrow">
												<ChevronRight size={16} />
											</span>
										</button>
									{/each}
								</div>
							</div>
						{/each}

						<!-- Drawer Footer Actions -->
						<div class="drawer-footer-actions">
							<button class="drawer-foot-btn" onclick={toggleTheme}>
								{#if theme === 'light'}
									<Moon size={16} /> <span>Dark Theme</span>
								{:else}
									<Sun size={16} /> <span>Light Theme</span>
								{/if}
							</button>
							<button class="drawer-foot-btn" onclick={handleExport}>
								<Download size={16} /> <span>Export JSON</span>
							</button>
							<button class="drawer-foot-btn danger" onclick={handleLogout}>
								<LogOut size={16} /> <span>Lock OS</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Mobile Quick Action FAB Drawer / Bottom Sheet -->
		{#if showQuickActionDrawer}
			<div
				class="modal-backdrop"
				onclick={() => (showQuickActionDrawer = false)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Escape' && (showQuickActionDrawer = false)}
				transition:fade={{ duration: 150 }}
			>
				<div
					class="modal-sheet quick-sheet"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					tabindex="-1"
				>
					<div class="sheet-handle-bar"></div>
					<div class="quick-sheet-header">
						<div class="quick-sheet-title-wrap">
							<Sparkles size={18} color="var(--accent-primary)" />
							<h3 class="quick-sheet-title">Campus Quick Actions</h3>
						</div>
						<button class="close-btn" onclick={() => (showQuickActionDrawer = false)}>✕</button>
					</div>

					<div class="quick-actions-grid">
						<button class="quick-grid-card" onclick={() => handleNavigate('/expenses/new')}>
							<div class="quick-card-icon-badge emerald">
								<Receipt size={22} />
							</div>
							<div class="quick-card-text">
								<strong>Log Expense</strong>
								<span>Fast keypad entry</span>
							</div>
						</button>

						<button class="quick-grid-card" onclick={() => handleNavigate('/debts')}>
							<div class="quick-card-icon-badge indigo">
								<Handshake size={22} />
							</div>
							<div class="quick-card-text">
								<strong>Split Bill</strong>
								<span>Campus UPI tab</span>
							</div>
						</button>

						<button class="quick-grid-card" onclick={() => handleNavigate('/transfers')}>
							<div class="quick-card-icon-badge cyan">
								<ArrowLeftRight size={22} />
							</div>
							<div class="quick-card-text">
								<strong>Transfer</strong>
								<span>UPI ➔ Cash sync</span>
							</div>
						</button>

						<button class="quick-grid-card" onclick={() => handleNavigate('/goals')}>
							<div class="quick-card-icon-badge amber">
								<PiggyBank size={22} />
							</div>
							<div class="quick-card-text">
								<strong>Stash Goal</strong>
								<span>Deposit / Goa Trip</span>
							</div>
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* ==========================================================================
	   LAYOUT STRUCTURE & DESKTOP SIDEBAR
	   ========================================================================== */
	.app {
		display: flex;
		min-height: 100vh;
		min-height: 100dvh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Spinner Brand */
	.loading-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		z-index: 9999;
	}

	.spinner-brand {
		position: relative;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner-ring {
		position: absolute;
		inset: 0;
		border: 3px solid var(--border-color);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.spinner-glyph {
		font-size: 1.5rem;
		color: var(--accent-primary);
	}

	.loading-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary);
		letter-spacing: -0.01em;
	}

	.error-banner {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--danger);
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: var(--border-radius-pill);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 10000;
		box-shadow: var(--shadow-lg);
		font-weight: 700;
		font-size: 0.88rem;
	}

	.error-banner button {
		color: white;
		font-size: 1rem;
	}

	/* ==========================================================================
	   DESKTOP SIDEBAR
	   ========================================================================== */
	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 270px;
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		z-index: 200;
		background: var(--bg-card);
	}

	.sidebar-header {
		padding: 1.5rem 1.25rem 1rem;
	}

	.sidebar-brand-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.brand-glyph-lg {
		width: 40px;
		height: 40px;
		border-radius: var(--border-radius-sm);
		background: linear-gradient(135deg, var(--accent-primary) 0%, #06B6D4 100%);
		color: #080C14;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 14px var(--accent-glow);
		flex-shrink: 0;
	}

	.brand-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.brand-title {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		margin: 0;
	}

	.campus-badge {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15rem 0.45rem;
		border-radius: var(--border-radius-pill);
		background: var(--accent-glow);
		color: var(--accent-primary);
		border: 1px solid var(--border-subtle);
	}

	.student-info-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 170px;
	}

	/* Liquid Net Worth Hero */
	.sidebar-balance-hero {
		margin: 0 1rem 0.85rem;
		padding: 1rem 1.15rem;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
	}

	.hero-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.35rem;
	}

	.hero-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.live-pulse-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.68rem;
		font-weight: 800;
		color: var(--accent-primary);
		text-transform: uppercase;
	}

	.hero-amount {
		font-size: 1.55rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.mini-wallets-strip {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.mini-wallet-chip {
		font-size: 0.72rem;
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		padding: 0.2rem 0.5rem;
		border-radius: var(--border-radius-xs);
		color: var(--text-secondary);
	}

	/* Month Switcher Dock */
	.desktop-month-dock {
		margin: 0 1rem 0.85rem;
		display: flex;
		align-items: center;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-pill);
		padding: 3px;
	}

	.dock-month-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.dock-month-btn:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.dock-month-name {
		flex: 1;
		text-align: center;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Navigation Scroll Area */
	.sidebar-nav-scroll {
		flex: 1;
		padding: 0 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.nav-group-title {
		display: block;
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
		padding-left: 0.65rem;
	}

	.nav-group-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: var(--border-radius-sm);
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s ease;
		position: relative;
	}

	.nav-link:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.nav-link.active {
		background: var(--surface-2);
		color: var(--accent-primary);
		font-weight: 700;
	}

	.sidebar-counter {
		margin-left: auto;
		background: var(--info-bg);
		color: var(--info);
		font-size: 0.7rem;
		font-weight: 800;
		padding: 0.1rem 0.45rem;
		border-radius: var(--border-radius-pill);
		border: 1px solid var(--info-border);
	}

	.active-pill-dot {
		margin-left: auto;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent-primary);
		box-shadow: 0 0 8px var(--accent-primary);
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.footer-action-btn {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.55rem 0.75rem;
		border-radius: var(--border-radius-sm);
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.2s ease;
		width: 100%;
	}

	.footer-action-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.footer-action-btn.danger:hover {
		background: var(--danger-bg);
		color: var(--danger);
	}

	/* ==========================================================================
	   MAIN WORKSPACE
	   ========================================================================== */
	.main-content {
		flex: 1;
		margin-left: 270px;
		min-height: 100vh;
		min-height: 100dvh;
		background: var(--bg-primary);
	}

	.content-wrapper {
		padding: 2rem 1.75rem 4rem;
		max-width: 1120px;
		margin: 0 auto;
	}

	/* ==========================================================================
	   MOBILE HEADER & SUB-NAV BAR
	   ========================================================================== */
	.mobile-header {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--header-height);
		padding: 0 0.85rem;
		align-items: center;
		justify-content: space-between;
		z-index: 250;
		background: var(--glass-bg);
		border-bottom: 1px solid var(--border-color);
	}

	.mobile-brand-wrap {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
	}

	.brand-glyph {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: linear-gradient(135deg, var(--accent-primary) 0%, #06B6D4 100%);
		color: #080C14;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px var(--accent-glow);
		flex-shrink: 0;
	}

	.brand-glyph-sm {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: linear-gradient(135deg, var(--accent-primary) 0%, #06B6D4 100%);
		color: #080C14;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.brand-text-col {
		display: flex;
		flex-direction: column;
	}

	.brand-name {
		font-size: 1.1rem;
		font-weight: 800;
		line-height: 1.1;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.brand-tag {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.mobile-header-subpage {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.mobile-back-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.subpage-title-col {
		display: flex;
		flex-direction: column;
		max-width: 140px;
	}

	.subpage-title {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.15;
	}

	.subpage-sub {
		font-size: 0.68rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.mobile-header-right {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.mobile-month-pill {
		display: flex;
		align-items: center;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-pill);
		padding: 2px 4px;
	}

	.mini-month-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
	}

	.mini-month-label {
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0 4px;
		color: var(--text-primary);
	}

	.theme-btn-compact {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
	}

	.drawer-trigger-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		position: relative;
	}

	.drawer-trigger-btn.active {
		background: var(--accent-glow);
		color: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	/* Mobile Horizontal Sub-Nav Bar */
	.mobile-subnav-bar {
		display: none;
		position: fixed;
		top: var(--header-height);
		left: 0;
		right: 0;
		height: var(--subnav-height);
		background: var(--glass-bg);
		border-bottom: 1px solid var(--border-color);
		z-index: 240;
		padding: 0 0.85rem;
		align-items: center;
	}

	.mobile-pills-scroll {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		width: 100%;
	}

	.subnav-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 700;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.subnav-pill.active {
		background: var(--accent-primary);
		color: #FFFFFF;
		border-color: var(--accent-primary);
		box-shadow: 0 2px 8px var(--accent-glow);
	}

	.pill-badge {
		background: #F43F5E;
		color: white;
		font-size: 0.65rem;
		font-weight: 800;
		padding: 1px 5px;
		border-radius: var(--border-radius-pill);
	}

	/* ==========================================================================
	   FLOATING BOTTOM GLASS DOCK
	   ========================================================================== */
	.bottom-dock-wrapper {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0 1rem calc(0.65rem + var(--safe-bottom));
		z-index: 300;
		pointer-events: none;
		justify-content: center;
	}

	.bottom-dock {
		pointer-events: auto;
		width: 100%;
		max-width: 420px;
		height: var(--bottom-nav-height);
		border-radius: var(--border-radius-pill);
		background: var(--glass-bg);
		backdrop-filter: blur(28px);
		-webkit-backdrop-filter: blur(28px);
		border: 1px solid var(--border-medium);
		box-shadow: var(--shadow-lg), 0 0 24px rgba(0, 0, 0, 0.25);
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0 0.5rem;
		position: relative;
	}

	.dock-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		width: 54px;
		height: 52px;
		border-radius: var(--border-radius-pill);
		color: var(--text-muted);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	.dock-item.active {
		color: var(--accent-primary);
	}

	.dock-label {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.dock-active-glow {
		position: absolute;
		top: 3px;
		width: 14px;
		height: 3px;
		border-radius: var(--border-radius-pill);
		background: var(--accent-primary);
		box-shadow: 0 0 8px var(--accent-primary);
	}

	/* Center Action Button (+) */
	.center-fab {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent-primary) 0%, #06B6D4 100%);
		color: #080C14;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px var(--accent-glow);
		transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		margin: 0 2px;
		flex-shrink: 0;
	}

	.center-fab:active {
		transform: scale(0.92);
	}

	/* ==========================================================================
	   MOBILE ALL-FEATURES DRAWER SHEET
	   ========================================================================== */
	.nav-drawer-sheet {
		max-width: 520px;
		max-height: 88vh;
		max-height: 88dvh;
		display: flex;
		flex-direction: column;
	}

	.nav-drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.nav-drawer-brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.drawer-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.drawer-sub {
		font-size: 0.72rem;
		color: var(--accent-primary);
		font-weight: 700;
		text-transform: uppercase;
	}

	.drawer-capital-banner {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.drawer-cap-left {
		display: flex;
		flex-direction: column;
	}

	.drawer-cap-lbl {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.drawer-cap-val {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.drawer-calib-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 0.45rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--accent-primary);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.drawer-sections-scroll {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
		padding-right: 2px;
	}

	.drawer-group-block {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.drawer-group-title {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding-left: 0.25rem;
	}

	.drawer-group-items-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.drawer-item-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.75rem 0.85rem;
		border-radius: var(--border-radius-sm);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		text-align: left;
		transition: all 0.2s ease;
		width: 100%;
	}

	.drawer-item-row:hover {
		background: var(--bg-hover);
		border-color: var(--border-medium);
	}

	.drawer-item-row.active {
		border-color: var(--accent-primary);
		background: var(--accent-glow);
	}

	.drawer-item-icon-box {
		width: 36px;
		height: 36px;
		border-radius: var(--border-radius-xs);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.drawer-item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.drawer-item-title-line {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.item-title {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.item-counter-badge {
		font-size: 0.65rem;
		font-weight: 800;
		background: rgba(99, 102, 241, 0.15);
		color: #818CF8;
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 1px 5px;
		border-radius: var(--border-radius-pill);
	}

	.item-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.drawer-arrow {
		color: var(--text-muted);
		opacity: 0.7;
	}

	.drawer-footer-actions {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 6px;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border-color);
		margin-top: 0.5rem;
	}

	.drawer-foot-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 0.6rem 0.4rem;
		border-radius: var(--border-radius-sm);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.drawer-foot-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.drawer-foot-btn.danger:hover {
		background: var(--danger-bg);
		color: var(--danger);
	}

	/* Quick Action FAB Bottom Sheet */
	.quick-sheet {
		max-width: 480px;
	}

	.quick-sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.quick-sheet-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.quick-sheet-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.quick-grid-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		text-align: left;
		transition: all 0.2s ease;
	}

	.quick-grid-card:hover {
		background: var(--bg-hover);
		border-color: var(--border-medium);
	}

	.quick-card-icon-badge {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.quick-card-icon-badge.emerald {
		background: var(--success-bg);
		color: var(--success);
		border: 1px solid var(--success-border);
	}

	.quick-card-icon-badge.indigo {
		background: rgba(99, 102, 241, 0.18);
		color: #818CF8;
		border: 1px solid rgba(99, 102, 241, 0.35);
	}

	.quick-card-icon-badge.cyan {
		background: var(--info-bg);
		color: var(--info);
		border: 1px solid var(--info-border);
	}

	.quick-card-icon-badge.amber {
		background: var(--warning-bg);
		color: var(--warning);
		border: 1px solid var(--warning-border);
	}

	.quick-card-text {
		display: flex;
		flex-direction: column;
	}

	.quick-card-text strong {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.quick-card-text span {
		font-size: 0.72rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	/* ==========================================================================
	   RESPONSIVE BREAKPOINTS (MOBILE VIEW ENFORCEMENT)
	   ========================================================================== */
	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}

		.mobile-header {
			display: flex;
		}

		.mobile-subnav-bar {
			display: flex;
		}

		.main-content {
			margin-left: 0;
			padding-top: calc(var(--header-height) + var(--subnav-height) + 0.65rem);
			padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 2rem);
		}

		.content-wrapper {
			padding: 0.75rem 0.85rem 2rem;
		}

		.bottom-dock-wrapper {
			display: flex;
		}
	}
</style>
