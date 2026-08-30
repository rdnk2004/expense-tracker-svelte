<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		wallets,
		currentMonthExpenses,
		totalBalance,
		categories,
		unsettledDebts,
		currentMonthBudgets,
		currentMonth,
		runway,
		studentProfile,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import {
		Wallet,
		ChartPie,
		Target,
		Handshake,
		Receipt,
		Smartphone,
		Banknote,
		ArrowRight,
		ChevronRight,
		Plus,
		Users,
		Sparkles,
		PiggyBank,
		ArrowDownLeft,
		ArrowUpRight,
		Clock
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import SafeSpendCard from '$lib/components/SafeSpendCard.svelte';
	import HealthScoreCard from '$lib/components/HealthScoreCard.svelte';
	import AnalystNudgeCard from '$lib/components/AnalystNudgeCard.svelte';

	let monthlyExpense = $derived(
		$currentMonthExpenses
			.filter((e) => e.categoryId !== 'income')
			.reduce((sum, e) => sum + e.amount, 0)
	);
	let monthlyIncome = $derived(
		$currentMonthExpenses
			.filter((e) => e.categoryId === 'income')
			.reduce((sum, e) => sum + e.amount, 0)
	);

	let recentExpenses = $derived(
		[...$currentMonthExpenses]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 6)
	);

	let totalReceivable = $derived(
		$unsettledDebts
			.filter((d) => d.direction === 'receive')
			.reduce((sum, d) => sum + d.amount, 0)
	);

	let bucketSpending = $derived.by(() => {
		let survival = 0;
		let fun = 0;
		let future = 0;

		$currentMonthExpenses.forEach((exp) => {
			if (exp.categoryId === 'income') return;
			const cat = $categories.find((c) => c.id === exp.categoryId);
			const bucket = cat?.bucketType || 'fun';
			if (bucket === 'survival') survival += exp.amount;
			else if (bucket === 'future') future += exp.amount;
			else fun += exp.amount;
		});

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

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}

	function calculateTimeCost(amount: number) {
		const hourlyRatePaise = $studentProfile.hourlyWageRate || 20000;
		const hours = amount / hourlyRatePaise;
		if (hours < 0.1) return null;
		return hours < 1 ? `${Math.round(hours * 60)}m labor` : `${hours.toFixed(1)}h labor`;
	}
</script>

<div class="dashboard-page">
	<!-- Top Greeting & Action Header (Desktop & Mobile Adaptive) -->
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
				<Plus size={18} />
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
					<Wallet size={15} color="#10B981" />
					<span>Total Liquid Capital</span>
				</div>
				<a href="/wallets" class="icon-btn-ghost" aria-label="Manage wallets">
					<ChevronRight size={18} />
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
						<ArrowDownLeft size={15} color="#10B981" />
						<span>Inflow</span>
					</div>
					<div class="stat-value text-success tabular">{formatCurrency(monthlyIncome)}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						<ArrowUpRight size={15} color="#F43F5E" />
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
				<a href="/budgets" class="view-all-link">Details <ChevronRight size={14} /></a>
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
					<Handshake size={22} color="#818CF8" />
				</div>
				<div class="alert-content-col">
					<strong class="tabular">{formatCurrency(totalReceivable)}</strong> owed to you from {$unsettledDebts.filter(d => d.direction === 'receive').length} friend splits.
				</div>
				<a href="/debts" class="alert-action-btn">
					Settle <ChevronRight size={14} />
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
				<a href="/expenses" class="view-all-link">All <ChevronRight size={14} /></a>
			</div>

			<div class="transactions-list">
				{#each recentExpenses as exp}
					{@const cat = getCategoryById(exp.categoryId)}
					{@const laborCost = calculateTimeCost(exp.amount)}
					<div class="transaction-row" onclick={() => goto('/expenses')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && goto('/expenses')}>
						<div class="t-icon">
							<CategoryIcon icon={cat?.icon || 'Receipt'} color={cat?.color || '#10B981'} size={20} />
						</div>
						<div class="t-details">
							<div class="t-title">{exp.note || cat?.name || 'Expense'}</div>
							<div class="t-meta">
								<span>{formatDate(exp.date)}</span>
								{#if exp.valueTag}
									<span class="tag-pill tag-{exp.valueTag}">
										{exp.valueTag === 'need' ? '⚡ Need' : exp.valueTag === 'want' ? '✨ Want' : '📚 Growth'}
									</span>
								{/if}
								{#if exp.satisfactionRating === 'regretted'}
									<span class="tag-pill tag-regret">💀 Regret</span>
								{/if}
								{#if laborCost && exp.categoryId !== 'income'}
									<span class="time-cost-pill" title="Time cost based on student hourly rate">
										<Clock size={11} />
										<span>{laborCost}</span>
									</span>
								{/if}
							</div>
						</div>
						<div class="t-amount tabular" class:income-amount={exp.categoryId === 'income'}>
							{exp.categoryId === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
						</div>
					</div>
				{:else}
					<div class="empty-state-box">
						<Receipt size={36} color="var(--text-muted)" />
						<p>No transactions logged in this cycle.</p>
						<a href="/expenses/new" class="btn btn-secondary">Log your first spend</a>
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
		margin-bottom: 1.15rem;
		gap: 0.85rem;
	}

	.campus-tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 0.2rem 0.65rem;
		border-radius: var(--border-radius-pill);
		margin-bottom: 0.3rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.75rem;
		}
	}

	.quick-log-btn {
		background: var(--accent-primary);
		color: #FFFFFF;
		padding: 0.6rem 1.1rem;
		border-radius: var(--border-radius-pill);
		font-weight: 800;
		font-size: 0.85rem;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 2px 10px var(--accent-glow);
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		flex-shrink: 0;
		min-height: 40px;
	}

	.quick-log-btn:hover {
		filter: brightness(1.1);
	}

	.dashboard-stream {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Hero Card */
	.card-header-hero {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.account-selector {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.1);
		padding: 5px 12px;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 700;
		border: 1px solid rgba(255, 255, 255, 0.16);
	}

	.icon-btn-ghost {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.icon-btn-ghost:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.balance-section {
		margin-bottom: 1rem;
	}

	.label-sm {
		display: block;
		font-size: 0.75rem;
		opacity: 0.8;
		margin-bottom: 4px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.balance-display {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.03em;
		color: #FFFFFF;
		margin: 0;
	}

	@media (min-width: 768px) {
		.balance-display {
			font-size: 2.35rem;
		}
	}

	.wallet-pills-row {
		display: flex;
		gap: 6px;
		margin-bottom: 1rem;
		padding-bottom: 4px;
	}

	.wallet-mini-pill {
		background: rgba(255, 255, 255, 0.1);
		padding: 5px 12px;
		border-radius: var(--border-radius-xs);
		font-size: 0.78rem;
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.wallet-mini-pill:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.wallet-pill-name {
		opacity: 0.8;
	}

	.wallet-pill-val {
		font-weight: 800;
	}

	.stats-row {
		display: flex;
		gap: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		padding-top: 0.85rem;
	}

	.stat-item {
		flex: 1;
	}

	.stat-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.74rem;
		opacity: 0.8;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 2px;
	}

	.stat-value {
		font-size: 1.15rem;
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
		padding: 1.15rem;
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.sub-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		display: block;
		margin-top: 2px;
	}

	.view-all-link {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.8rem;
		font-weight: 700;
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
		margin-bottom: 0.85rem;
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
		gap: 2px;
		background: var(--surface-2);
		padding: 0.65rem 0.4rem;
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--border-color);
		text-align: center;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		margin: 0 auto 2px;
	}

	.dot.survival { background: #10B981; }
	.dot.fun { background: #38BDF8; }
	.dot.future { background: #818CF8; }

	.b-name {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.b-val {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.b-pct {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	/* Receivables Alert */
	.alert-banner-receivable {
		background: rgba(99, 102, 241, 0.12);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.alert-icon-col {
		flex-shrink: 0;
	}

	.alert-content-col {
		flex: 1;
		font-size: 0.86rem;
		color: var(--text-primary);
		font-weight: 600;
	}

	.alert-action-btn {
		background: var(--surface-2);
		border: 1px solid rgba(99, 102, 241, 0.35);
		color: #818CF8;
		padding: 5px 12px;
		border-radius: var(--border-radius-pill);
		font-size: 0.78rem;
		font-weight: 800;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		flex-shrink: 0;
	}

	/* Recent Transactions */
	.section-recent {
		padding: 1.15rem;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.transaction-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.5rem;
		border-radius: var(--border-radius-sm);
		transition: background 0.2s ease;
		cursor: pointer;
	}

	.transaction-row:hover {
		background: var(--surface-2);
	}

	.t-icon {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-xs);
		background: var(--surface-2);
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
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.t-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
		flex-wrap: wrap;
	}

	.tag-pill {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 1px 6px;
		border-radius: var(--border-radius-pill);
	}

	.tag-need { background: rgba(16, 185, 129, 0.18); color: #10B981; }
	.tag-want { background: rgba(56, 189, 248, 0.18); color: #38BDF8; }
	.tag-growth { background: rgba(99, 102, 241, 0.18); color: #818CF8; }
	.tag-regret { background: rgba(244, 63, 94, 0.18); color: #F43F5E; }

	.time-cost-pill {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.68rem;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 1px 6px;
		border-radius: var(--border-radius-pill);
		color: var(--text-secondary);
		font-weight: 600;
	}

	.t-amount {
		font-size: 0.98rem;
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
		font-size: 0.88rem;
		color: var(--text-muted);
		margin: 0;
	}
</style>
