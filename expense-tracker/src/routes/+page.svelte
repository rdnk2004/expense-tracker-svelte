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
		Package,
		ArrowRight,
		ChevronDown,
		MoreVertical,
		Bell,
		ArrowDownLeft,
		ArrowUpRight,
		ChevronRight,
		Plus,
		Users,
		Sparkles,
		PiggyBank,
		AlertCircle
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import SafeSpendCard from '$lib/components/SafeSpendCard.svelte';
	import HealthScoreCard from '$lib/components/HealthScoreCard.svelte';

	// Computed values
	let upiWallet = $derived($wallets.find((w) => w.name.toLowerCase().includes('upi')));
	let cashWallet = $derived($wallets.find((w) => w.name.toLowerCase().includes('cash')));

	// Calculate Income and Expense
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

	let totalOwed = $derived(
		$unsettledDebts
			.filter((d) => d.direction === 'give')
			.reduce((sum, d) => sum + d.amount, 0)
	);

	let totalReceivable = $derived(
		$unsettledDebts
			.filter((d) => d.direction === 'receive')
			.reduce((sum, d) => sum + d.amount, 0)
	);

	let overallBudget = $derived($currentMonthBudgets.find((b) => b.type === 'overall'));

	// 3-Bucket breakdown calculations
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
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<div>
			<span class="campus-badge">🎓 {$studentProfile.collegeName || 'Campus Student'} • {$studentProfile.semester || 'Active Term'}</span>
			<h1 class="page-title">Financial Command</h1>
		</div>
		<div class="header-actions">
			<a href="/expenses/new" class="quick-add-btn" aria-label="Add transaction">
				<Plus size={20} />
				<span>Log</span>
			</a>
		</div>
	</div>

	<div class="dashboard-container">
		<!-- 1. Dynamic Safe-to-Spend & Runway Engine Card -->
		<SafeSpendCard />

		<!-- 2. Wallet Overview Hero Card -->
		<div class="card card-hero">
			<div class="card-header-hero">
				<div class="account-selector">
					<Wallet size={15} />
					<span>Total Liquid Wealth</span>
				</div>
				<a href="/wallets" class="icon-btn-ghost" aria-label="Manage wallets">
					<ChevronRight size={18} />
				</a>
			</div>

			<div class="balance-section">
				<span class="label-sm">Combined Balance</span>
				<h1 class="balance-display">{formatCurrency($totalBalance)}</h1>
			</div>

			<!-- Individual Wallets Mini Pills -->
			<div class="wallet-pills-row">
				{#each $wallets as w}
					<div class="wallet-mini-pill">
						<span class="wallet-pill-name">{w.name}</span>
						<span class="wallet-pill-val">{formatCurrency(w.balance)}</span>
					</div>
				{/each}
			</div>

			<div class="stats-row">
				<div class="stat-item">
					<div class="stat-label">
						<ArrowDownLeft size={14} class="text-success" /> Inflow
					</div>
					<div class="stat-value text-success">{formatCurrency(monthlyIncome)}</div>
				</div>
				<div class="stat-item">
					<div class="stat-label">
						<ArrowUpRight size={14} class="text-danger" /> Outflow
					</div>
					<div class="stat-value">{formatCurrency(monthlyExpense)}</div>
				</div>
			</div>
		</div>

		<!-- 3. Student Financial Health Score & Badges -->
		<HealthScoreCard />

		<!-- 4. Student 3-Bucket Macro Pulse -->
		<div class="section-card">
			<div class="section-header-row">
				<div class="section-title-group">
					<h3 class="section-title">3-Bucket Balance</h3>
					<span class="sub-label">Survival vs Fun vs Future</span>
				</div>
				<a href="/budgets" class="view-all-link">Details <ChevronRight size={15} /></a>
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
						<span class="b-name">Survival (50%)</span>
						<span class="b-val">{formatCurrency(bucketSpending.survival)}</span>
					</div>
					<div class="bucket-legend-item">
						<span class="dot fun"></span>
						<span class="b-name">Fun (30%)</span>
						<span class="b-val">{formatCurrency(bucketSpending.fun)}</span>
					</div>
					<div class="bucket-legend-item">
						<span class="dot future"></span>
						<span class="b-name">Future (20%)</span>
						<span class="b-val">{formatCurrency(bucketSpending.future)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 4. Campus Receivables & Friend Tab Alert Banner -->
		{#if totalReceivable > 0}
			<div class="alert-banner-receivable">
				<div class="alert-icon-col">
					<Handshake size={20} />
				</div>
				<div class="alert-content-col">
					<strong>{formatCurrency(totalReceivable)}</strong> owed to you from {$unsettledDebts.filter(d => d.direction === 'receive').length} friend splits.
				</div>
				<a href="/debts" class="alert-action-btn">
					Settle <ChevronRight size={14} />
				</a>
			</div>
		{/if}

		<!-- 5. Recent Activity & Mindful Value Tags -->
		<div class="section-recent">
			<div class="section-header-row">
				<h3 class="section-title">Recent Transactions</h3>
				<a href="/expenses" class="view-all-link">View All <ChevronRight size={15} /></a>
			</div>

			<div class="transactions-list">
				{#each recentExpenses as exp}
					{@const cat = getCategoryById(exp.categoryId)}
					<div class="transaction-card">
						<div class="t-icon">
							<CategoryIcon icon={cat?.icon || 'Receipt'} color={cat?.color || '#7C3AED'} size={20} />
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
									<span class="tag-pill tag-regret">💀 Regretted</span>
								{/if}
							</div>
						</div>
						<div class="t-amount" class:income-amount={exp.categoryId === 'income'}>
							{exp.categoryId === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
						</div>
					</div>
				{:else}
					<div class="empty-state-card">
						<p>No transactions logged yet.</p>
						<a href="/expenses/new" class="text-button">Log your first expense</a>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 20px;
		padding-top: 8px;
	}

	.campus-badge {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: block;
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
	}

	.quick-add-btn {
		background: var(--accent-gradient);
		color: white;
		padding: 10px 16px;
		border-radius: 9999px;
		font-weight: 700;
		font-size: 0.88rem;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 8px 20px var(--accent-glow);
		text-decoration: none;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.quick-add-btn:active {
		transform: scale(0.96);
	}

	.dashboard-container {
		display: flex;
		flex-direction: column;
		gap: 18px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ===================================
	   HERO CARD
	   =================================== */
	.card-hero {
		background: var(--hero-gradient);
		border-radius: 28px;
		padding: 24px;
		color: white;
		box-shadow: 0 20px 40px -10px rgba(31, 38, 135, 0.35);
		position: relative;
		overflow: hidden;
	}

	.card-hero::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -20%;
		width: 260px;
		height: 260px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: 50%;
		filter: blur(35px);
		pointer-events: none;
	}

	.card-header-hero {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		position: relative;
		z-index: 2;
	}

	.account-selector {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.15);
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 0.82rem;
		font-weight: 600;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.icon-btn-ghost {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		padding: 6px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}

	.balance-section {
		margin-bottom: 20px;
		position: relative;
		z-index: 2;
	}

	.label-sm {
		display: block;
		font-size: 0.8rem;
		opacity: 0.8;
		margin-bottom: 4px;
		font-weight: 500;
	}

	.balance-display {
		font-size: 2.4rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.5px;
	}

	.wallet-pills-row {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		flex-wrap: wrap;
		position: relative;
		z-index: 2;
	}

	.wallet-mini-pill {
		background: rgba(255, 255, 255, 0.12);
		padding: 6px 12px;
		border-radius: 12px;
		font-size: 0.78rem;
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.wallet-pill-name {
		opacity: 0.75;
	}

	.wallet-pill-val {
		font-weight: 700;
	}

	.stats-row {
		display: flex;
		gap: 24px;
		position: relative;
		z-index: 2;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		padding-top: 16px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.78rem;
		opacity: 0.8;
	}

	.stat-value {
		font-size: 1.05rem;
		font-weight: 700;
	}

	/* ===================================
	   3-BUCKET SECTION
	   =================================== */
	.section-card {
		background: var(--bg-card);
		border-radius: 24px;
		padding: 20px;
		border: 1px solid var(--border-color);
		box-shadow: var(--shadow-sm);
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 14px;
	}

	.section-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.sub-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		display: block;
	}

	.view-all-link {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--accent-primary);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.bucket-stacked-bar {
		height: 10px;
		background: var(--bg-primary);
		border-radius: 9999px;
		overflow: hidden;
		display: flex;
		margin-bottom: 14px;
	}

	.bucket-segment.survival {
		background: #3B82F6;
	}

	.bucket-segment.fun {
		background: #EC4899;
	}

	.bucket-segment.future {
		background: #10B981;
	}

	.bucket-legend-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.bucket-legend-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 0.75rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		margin-bottom: 2px;
	}

	.dot.survival { background: #3B82F6; }
	.dot.fun { background: #EC4899; }
	.dot.future { background: #10B981; }

	.b-name {
		color: var(--text-muted);
		font-size: 0.72rem;
	}

	.b-val {
		font-weight: 700;
		color: var(--text-primary);
	}

	/* ===================================
	   ALERT BANNER
	   =================================== */
	.alert-banner-receivable {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
		border: 1px solid var(--accent-primary);
		border-radius: 20px;
		padding: 14px 18px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.alert-icon-col {
		color: var(--accent-primary);
	}

	.alert-content-col {
		flex: 1;
		font-size: 0.85rem;
		color: var(--text-primary);
	}

	.alert-action-btn {
		font-size: 0.8rem;
		font-weight: 700;
		color: white;
		background: var(--accent-primary);
		padding: 6px 12px;
		border-radius: 9999px;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	/* ===================================
	   RECENT TRANSACTIONS
	   =================================== */
	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
	}

	.transaction-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		gap: 14px;
		box-shadow: var(--shadow-sm);
		transition: transform 0.2s;
	}

	.t-icon {
		width: 44px;
		height: 44px;
		border-radius: 16px;
		background: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.t-details {
		flex: 1;
	}

	.t-title {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--text-primary);
		margin-bottom: 3px;
	}

	.t-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.tag-pill {
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: 0.68rem;
		font-weight: 700;
	}

	.tag-need {
		background: rgba(59, 130, 246, 0.12);
		color: #2563EB;
	}

	.tag-want {
		background: rgba(236, 72, 153, 0.12);
		color: #DB2777;
	}

	.tag-growth {
		background: rgba(16, 185, 129, 0.12);
		color: #059669;
	}

	.tag-regret {
		background: rgba(255, 51, 102, 0.12);
		color: #FF3366;
	}

	.t-amount {
		font-weight: 800;
		font-size: 0.98rem;
		color: var(--text-primary);
	}

	.income-amount {
		color: var(--success);
	}

	.empty-state-card {
		text-align: center;
		padding: 30px 20px;
		background: var(--bg-card);
		border-radius: 20px;
		border: 1px dashed var(--border-color);
		color: var(--text-muted);
	}

	.text-button {
		display: inline-block;
		margin-top: 6px;
		color: var(--accent-primary);
		font-weight: 700;
		text-decoration: none;
	}
</style>
