<script lang="ts">
	import {
		wallets,
		expenses,
		categories,
		totalBalance,
		unsettledDebts,
		runway,
		studentProfile,
		formatCurrency
	} from '$lib/stores';
	import { goto } from '$app/navigation';
	import {
		Wallet,
		ArrowUpRight,
		ArrowDownLeft,
		Plus,
		ChevronRight,
		CreditCard,
		Clock,
		Flame,
		Sparkles,
		ShieldAlert,
		Zap,
		Award,
		Calendar,
		Handshake
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import SafeSpendCard from '$lib/components/SafeSpendCard.svelte';
	import HealthScoreCard from '$lib/components/HealthScoreCard.svelte';
	import AnalystNudgeCard from '$lib/components/AnalystNudgeCard.svelte';

	// Monthly Cashflow metrics
	let currentMonth = new Date().getMonth();
	let currentYear = new Date().getFullYear();

	let currentMonthExpenses = $derived(
		$expenses.filter((e) => {
			const d = new Date(e.date);
			return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
		})
	);

	let monthlyExpense = $derived(
		currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
	);

	let monthlyIncome = $derived(
		$wallets.reduce((sum, w) => sum + w.balance, 0)
	);

	let recentExpenses = $derived($expenses.slice(0, 5));

	// 3-Bucket Spending breakdown
	let bucketSpending = $derived.by(() => {
		let survival = 0;
		let fun = 0;
		let future = 0;

		const catMap = new Map($categories.map((c) => [c.id, c.bucketType || 'fun']));

		for (const exp of currentMonthExpenses) {
			const bucket = catMap.get(exp.categoryId) || 'fun';
			if (bucket === 'survival') survival += exp.amount;
			else if (bucket === 'future') future += exp.amount;
			else fun += exp.amount;
		}

		const total = survival + fun + future || 1;
		return {
			survival,
			fun,
			future,
			survivalPercent: Math.round((survival / total) * 100),
			funPercent: Math.round((fun / total) * 100),
			futurePercent: Math.round((future / total) * 100)
		};
	});

	let totalReceivable = $derived(
		$unsettledDebts
			.filter((d) => d.direction === 'receive')
			.reduce((sum, d) => sum + d.amount, 0)
	);

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}

	function calculateTimeCost(amount: number): string {
		const wage = $studentProfile.hourlyWageRate || 15000;
		const hours = amount / wage;
		if (hours < 0.1) return '< 10 mins work';
		if (hours < 1) return `${Math.round(hours * 60)} mins work`;
		return `${hours.toFixed(1)} hrs work`;
	}

	function formatDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
	}
</script>

<div class="dashboard-page">
	<!-- Top Greeting & Action Header -->
	<header class="dashboard-header">
		<div class="header-titles">
			<div class="campus-tag-pill">
				<span class="campus-icon">🎓</span>
				<span>{$studentProfile.collegeName || 'Campus Student'} • {$studentProfile.semester || 'Active Term'}</span>
			</div>
			<h1 class="page-title">Financial Command</h1>
		</div>
		<div class="header-actions">
			<a href="/expenses/new" class="quick-log-btn" aria-label="Log new transaction">
				<Plus size={20} />
				<span>Log Spend</span>
			</a>
		</div>
	</header>

	<div class="dashboard-stream">
		<!-- 1. AI Financial Analyst Commentary -->
		<AnalystNudgeCard />

		<!-- 2. Dynamic Safe-to-Spend & Runway Engine -->
		<SafeSpendCard />

		<!-- 3. Obsidian Liquid Capital Card -->
		<div class="card card-hero">
			<div class="card-header-hero">
				<div class="account-selector">
					<Wallet size={16} color="#10B981" />
					<span>Total Liquid Capital</span>
				</div>
				<a href="/wallets" class="icon-btn-ghost" aria-label="Manage wallets">
					<ChevronRight size={20} />
				</a>
			</div>

			<div class="balance-section">
				<span class="label-sm">Combined Liquid Wealth</span>
				<h2 class="balance-display tabular">{formatCurrency($totalBalance)}</h2>
			</div>

			<!-- Individual Wallets Mini Chips (Horizontal Touch Scroll) -->
			<div class="wallet-pills-row touch-scroll-x">
				{#each $wallets as w}
					<div class="wallet-mini-pill" onclick={() => goto('/wallets')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goto('/wallets')}>
						<span class="wallet-pill-name">{w.name}</span>
						<span class="wallet-pill-val tabular">{formatCurrency(w.balance)}</span>
					</div>
				{/each}
			</div>

			<!-- Cashflow Inflow / Outflow -->
			<div class="stats-row">
				<div class="stat-item">
					<div class="stat-label">
						<ArrowDownLeft size={16} color="#10B981" />
						<span>Inflow</span>
					</div>
					<div class="stat-value text-success tabular">{formatCurrency(monthlyIncome)}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						<ArrowUpRight size={16} color="#F43F5E" />
						<span>Outflow</span>
					</div>
					<div class="stat-value text-danger tabular">{formatCurrency(monthlyExpense)}</div>
				</div>
			</div>
		</div>

		<!-- 4. Student Financial Health Score & Badges -->
		<HealthScoreCard />

		<!-- 5. 3-Bucket Macro Pulse (Survival / Fun / Future) -->
		<div class="card section-card">
			<div class="section-header-row">
				<div>
					<h3 class="section-title">3-Bucket Discipline</h3>
					<span class="sub-label">Survival (50%) • Fun (30%) • Future (20%)</span>
				</div>
				<a href="/budgets" class="view-all-link">Details <ChevronRight size={16} /></a>
			</div>

			<div class="bucket-bar-container">
				<div class="bucket-stacked-bar">
					<div class="bucket-segment survival" style="width: {bucketSpending.survivalPercent}%;"></div>
					<div class="bucket-segment fun" style="width: {bucketSpending.funPercent}%;"></div>
					<div class="bucket-segment future" style="width: {bucketSpending.futurePercent}%;"></div>
				</div>
				<div class="bucket-legend-grid">
					<div class="bucket-legend-item">
						<span class="dot survival"></span>
						<span class="b-name">Survival</span>
						<span class="b-val tabular">{formatCurrency(bucketSpending.survival)}</span>
						<span class="b-pct tabular">({bucketSpending.survivalPercent}%)</span>
					</div>
					<div class="bucket-legend-item">
						<span class="dot fun"></span>
						<span class="b-name">Fun</span>
						<span class="b-val tabular">{formatCurrency(bucketSpending.fun)}</span>
						<span class="b-pct tabular">({bucketSpending.funPercent}%)</span>
					</div>
					<div class="bucket-legend-item">
						<span class="dot future"></span>
						<span class="b-name">Future</span>
						<span class="b-val tabular">{formatCurrency(bucketSpending.future)}</span>
						<span class="b-pct tabular">({bucketSpending.futurePercent}%)</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 6. Campus Receivables & Friend Tab Alert Banner -->
		{#if totalReceivable > 0}
			<div class="alert-banner-receivable">
				<div class="alert-icon-col">
					<Handshake size={24} color="#818CF8" />
				</div>
				<div class="alert-content-col">
					<strong class="tabular">{formatCurrency(totalReceivable)}</strong> owed to you from {$unsettledDebts.filter(d => d.direction === 'receive').length} friend splits.
				</div>
				<a href="/debts" class="alert-action-btn">
					Settle <ChevronRight size={16} />
				</a>
			</div>
		{/if}

		<!-- 7. Recent Transactions Feed -->
		<div class="card section-recent">
			<div class="section-header-row">
				<div>
					<h3 class="section-title">Recent Feed</h3>
					<span class="sub-label">Latest campus outlays</span>
				</div>
				<a href="/expenses" class="view-all-link">All <ChevronRight size={16} /></a>
			</div>

			<div class="transactions-list">
				{#each recentExpenses as exp}
					{@const cat = getCategoryById(exp.categoryId)}
					{@const laborCost = calculateTimeCost(exp.amount)}
					<div class="transaction-row" onclick={() => goto('/expenses')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goto('/expenses')}>
						<div class="t-icon">
							<CategoryIcon icon={cat?.icon || 'Receipt'} color={cat?.color || '#10B981'} size={22} />
						</div>
						<div class="t-details">
							<div class="t-title">{exp.note || cat?.name || 'Expense'}</div>
							<div class="t-meta">
								<span>{formatDate(exp.date)}</span>
								{#if exp.valueTag}
									<span class="tag-pill tag-{exp.valueTag}">{exp.valueTag}</span>
								{/if}
								<span class="time-cost-pill">
									<Clock size={12} />
									{laborCost}
								</span>
							</div>
						</div>
						<div class="t-amount tabular">
							-{formatCurrency(exp.amount)}
						</div>
					</div>
				{:else}
					<div class="empty-state-box">
						<p>No campus outlays recorded yet this term.</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-page {
		max-width: 680px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 1.25rem;
		gap: 0.75rem;
	}

	.campus-tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 3px 9px;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--accent-primary);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.page-title {
		font-size: 1.55rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.04em;
		margin: 0;
		line-height: 1.15;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.85rem;
		}
	}

	.quick-log-btn {
		background: var(--accent-primary);
		color: #FFFFFF;
		padding: 0.7rem 1.25rem;
		border-radius: var(--border-radius-pill);
		font-weight: 800;
		font-size: 0.95rem;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 4px 14px var(--accent-glow);
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		flex-shrink: 0;
		min-height: 46px;
	}

	.quick-log-btn:hover {
		filter: brightness(1.1);
	}

	.dashboard-stream {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	/* Hero Card */
	.card-header-hero {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.account-selector {
		display: flex;
		align-items: center;
		gap: 7px;
		background: rgba(255, 255, 255, 0.12);
		padding: 6px 14px;
		border-radius: var(--border-radius-pill);
		font-size: 0.84rem;
		font-weight: 800;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.icon-btn-ghost {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.icon-btn-ghost:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.balance-section {
		margin-bottom: 1.15rem;
	}

	.label-sm {
		display: block;
		font-size: 0.82rem;
		opacity: 0.85;
		margin-bottom: 4px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.balance-display {
		font-size: 2.35rem;
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.04em;
		color: #FFFFFF;
		margin: 0;
	}

	@media (min-width: 768px) {
		.balance-display {
			font-size: 2.65rem;
		}
	}

	.wallet-pills-row {
		display: flex;
		gap: 7px;
		margin-bottom: 1.15rem;
		padding-bottom: 4px;
	}

	.wallet-mini-pill {
		background: rgba(255, 255, 255, 0.12);
		padding: 7px 14px;
		border-radius: var(--border-radius-xs);
		font-size: 0.86rem;
		display: flex;
		align-items: center;
		gap: 7px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.2s ease;
		min-height: 38px;
	}

	.wallet-mini-pill:hover {
		background: rgba(255, 255, 255, 0.22);
	}

	.wallet-pill-name {
		opacity: 0.85;
		font-weight: 600;
	}

	.wallet-pill-val {
		font-weight: 800;
	}

	.stats-row {
		display: flex;
		gap: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		padding-top: 0.95rem;
	}

	.stat-item {
		flex: 1;
	}

	.stat-label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.78rem;
		opacity: 0.85;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 3px;
	}

	.stat-value {
		font-size: 1.35rem;
		font-weight: 800;
	}

	.text-success {
		color: #10B981;
	}

	.text-danger {
		color: #F43F5E;
	}

	/* Section Card */
	.section-card {
		padding: 1.35rem;
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.sub-label {
		font-size: 0.82rem;
		color: var(--text-muted);
		display: block;
		margin-top: 2px;
		font-weight: 600;
	}

	.view-all-link {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.86rem;
		font-weight: 800;
		color: var(--accent-primary);
		text-decoration: none;
	}

	/* 3-Bucket Stacked Bar */
	.bucket-stacked-bar {
		display: flex;
		height: 10px;
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		background: var(--surface-2);
		margin-bottom: 0.95rem;
		border: 1px solid var(--border-color);
	}

	.bucket-segment.survival { background: #10B981; }
	.bucket-segment.fun { background: #38BDF8; }
	.bucket-segment.future { background: #818CF8; }

	.bucket-legend-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.bucket-legend-item {
		display: flex;
		flex-direction: column;
		gap: 3px;
		background: var(--surface-2);
		padding: 0.75rem 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--border-color);
		text-align: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin: 0 auto 3px;
	}

	.dot.survival { background: #10B981; }
	.dot.fun { background: #38BDF8; }
	.dot.future { background: #818CF8; }

	.b-name {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.b-val {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.b-pct {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	/* Receivables Alert */
	.alert-banner-receivable {
		background: rgba(99, 102, 241, 0.14);
		border: 1px solid rgba(99, 102, 241, 0.35);
		border-radius: var(--border-radius-lg);
		padding: 1rem 1.15rem;
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.alert-icon-col {
		flex-shrink: 0;
	}

	.alert-content-col {
		flex: 1;
		font-size: 0.92rem;
		color: var(--text-primary);
		font-weight: 600;
		line-height: 1.4;
	}

	.alert-action-btn {
		background: var(--surface-2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		color: #818CF8;
		padding: 6px 14px;
		border-radius: var(--border-radius-pill);
		font-size: 0.84rem;
		font-weight: 800;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		flex-shrink: 0;
		min-height: 38px;
	}

	/* Recent Transactions */
	.section-recent {
		padding: 1.35rem;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.transaction-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.75rem 0.65rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		transition: background 0.2s ease;
		cursor: pointer;
	}

	.transaction-row:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
	}

	.t-icon {
		width: 44px;
		height: 44px;
		border-radius: var(--border-radius-xs);
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.t-details {
		flex: 1;
		min-width: 0;
	}

	.t-title {
		font-size: 0.98rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.2;
	}

	.t-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-top: 3px;
		flex-wrap: wrap;
	}

	.tag-pill {
		font-size: 0.72rem;
		font-weight: 800;
		padding: 2px 7px;
		border-radius: var(--border-radius-pill);
	}

	.tag-need { background: rgba(16, 185, 129, 0.2); color: #10B981; }
	.tag-want { background: rgba(56, 189, 248, 0.2); color: #38BDF8; }
	.tag-growth { background: rgba(99, 102, 241, 0.2); color: #818CF8; }
	.tag-regret { background: rgba(244, 63, 94, 0.2); color: #F43F5E; }

	.time-cost-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.74rem;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 2px 7px;
		border-radius: var(--border-radius-pill);
		color: var(--text-secondary);
		font-weight: 700;
	}

	.t-amount {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.income-amount {
		color: #10B981;
	}

	.empty-state-box {
		text-align: center;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.empty-state-box p {
		font-size: 0.92rem;
		color: var(--text-muted);
		margin: 0;
	}
</style>
