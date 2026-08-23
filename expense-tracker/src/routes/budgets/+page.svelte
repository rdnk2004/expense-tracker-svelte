<script lang="ts">
	import {
		budgets,
		categories,
		currentMonth,
		currentMonthExpenses,
		studentProfile,
		buckets,
		setBudget,
		setCategoryBucket,
		updateBucketSplit,
		formatCurrency,
		goToPreviousMonth,
		goToNextMonth,
		getMonthName
	} from '$lib/stores';
	import type { BudgetBucketType, Category } from '$lib/types';
	import {
		Target,
		ChevronLeft,
		ChevronRight,
		ChartPie,
		CheckCircle,
		CircleAlert,
		Wallet,
		FolderOpen,
		TrendingUp,
		Loader2,
		ShieldCheck,
		Sparkles,
		PiggyBank,
		Sliders,
		AlertTriangle,
		ArrowRight,
		Plus,
		Edit3
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	// Form & modal state
	let overallBudgetAmount = $state('');
	let categoryBudgetInputs = $state<Record<string, string>>({});
	let selectedMonth = $state($currentMonth);
	let showToast = $state(false);
	let toastMessage = $state('');
	let showSplitModal = $state(false);
	let activeTab = $state<'buckets' | 'categories'>('buckets');

	// Split adjustment state
	let customSurvival = $state($studentProfile.survivalBucketPercent || 50);
	let customFun = $state($studentProfile.funBucketPercent || 30);
	let customFuture = $state($studentProfile.futureBucketPercent || 20);

	// Computed values
	let overallBudget = $derived(
		$budgets.find((b) => b.type === 'overall' && b.month === selectedMonth)
	);

	let categoryBudgets = $derived(
		$budgets.filter((b) => b.type === 'category' && b.month === selectedMonth)
	);

	let totalExpenses = $derived($currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0));

	let categorySpending = $derived(
		$currentMonthExpenses.reduce(
			(acc, expense) => {
				acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
				return acc;
			},
			{} as Record<string, number>
		)
	);

	let categoriesWithBudgets = $derived(
		$categories.map((cat) => {
			const budget = categoryBudgets.find((b) => b.categoryId === cat.id);
			const spent = categorySpending[cat.id] || 0;
			return {
				category: cat,
				budget,
				spent,
				percentage: budget ? (spent / budget.amount) * 100 : 0
			};
		})
	);

	let daysInMonth = $derived(
		new Date(
			parseInt(selectedMonth.split('-')[0]),
			parseInt(selectedMonth.split('-')[1]),
			0
		).getDate()
	);
	let daysElapsed = $derived(selectedMonth === $currentMonth ? new Date().getDate() : daysInMonth);
	let daysRemaining = $derived(Math.max(0, daysInMonth - daysElapsed));
	let averageDailySpending = $derived(daysElapsed > 0 ? totalExpenses / daysElapsed : 0);
	let projectedMonthlySpending = $derived(averageDailySpending * daysInMonth);

	async function handleSetOverallBudget() {
		if (!overallBudgetAmount || parseFloat(overallBudgetAmount) <= 0) {
			showSuccessToast('Please enter a valid amount');
			return;
		}

		try {
			await setBudget('overall', Math.round(parseFloat(overallBudgetAmount) * 100));
			overallBudgetAmount = '';
			showSuccessToast('Monthly budget updated!');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showSuccessToast('Failed to set budget');
		}
	}

	async function handleSetCategoryBudget(categoryId: string) {
		const amount = categoryBudgetInputs[categoryId];
		if (!amount || parseFloat(amount) <= 0) {
			showSuccessToast('Please enter a valid amount');
			return;
		}

		try {
			await setBudget('category', Math.round(parseFloat(amount) * 100), categoryId);
			categoryBudgetInputs = { ...categoryBudgetInputs, [categoryId]: '' };
			showSuccessToast('Category budget set successfully!');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showSuccessToast('Failed to set budget');
		}
	}

	async function handleCategoryBucketChange(categoryId: string, bucketType: BudgetBucketType) {
		try {
			await setCategoryBucket(categoryId, bucketType);
			showSuccessToast('Category bucket updated!');
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSaveCustomSplit() {
		const total = Number(customSurvival) + Number(customFun) + Number(customFuture);
		if (total !== 100) {
			showSuccessToast(`Percentages must add up to 100% (currently ${total}%)`);
			return;
		}
		await updateBucketSplit(Number(customSurvival), Number(customFun), Number(customFuture));
		showSplitModal = false;
		showSuccessToast('3-Bucket allocations saved!');
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function getBudgetColor(percentage: number): string {
		if (percentage < 70) return 'var(--success, #10B981)';
		if (percentage < 90) return 'var(--warning, #F59E0B)';
		if (percentage < 100) return '#fb8c00';
		return 'var(--danger, #FF3366)';
	}
</script>

<div class="budgets-page">
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<div class="page-header-row">
		<div>
			<span class="eyebrow">Smart Allocation</span>
			<h1 class="page-title">Student Budgeting</h1>
		</div>
		<button class="settings-btn" onclick={() => (showSplitModal = true)} aria-label="Adjust 3-Bucket Split">
			<Sliders size={18} />
			<span>Adjust Split</span>
		</button>
	</div>

	<!-- Month Selector -->
	<div class="month-selector-card">
		<button class="month-nav-btn" onclick={goToPreviousMonth} aria-label="Previous month">
			<ChevronLeft size={22} />
		</button>
		<div class="month-display">{getMonthName(selectedMonth)}</div>
		<button class="month-nav-btn" onclick={goToNextMonth} aria-label="Next month">
			<ChevronRight size={22} />
		</button>
	</div>

	<!-- Tab Switcher -->
	<div class="tab-control">
		<button
			class="tab-btn"
			class:active={activeTab === 'buckets'}
			onclick={() => (activeTab = 'buckets')}
		>
			<ChartPie size={16} />
			<span>3-Bucket System (50/30/20)</span>
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'categories'}
			onclick={() => (activeTab = 'categories')}
		>
			<FolderOpen size={16} />
			<span>Category Limits</span>
		</button>
	</div>

	{#if activeTab === 'buckets'}
		<!-- 3-BUCKET SYSTEM -->
		<div class="buckets-container">
			<!-- Survival 50% Card -->
			<div class="bucket-card-hero bucket-survival">
				<div class="bucket-card-header">
					<div class="bucket-title-group">
						<div class="bucket-icon-badge survival">
							<ShieldCheck size={20} />
						</div>
						<div>
							<h3 class="b-title">{$buckets.survival.name} ({$buckets.survival.targetPercent}%)</h3>
							<p class="b-desc">{$buckets.survival.description}</p>
						</div>
					</div>
					<span class="bucket-status-badge status-{$buckets.survival.status}">
						{$buckets.survival.status === 'safe' ? 'On Track' : $buckets.survival.status === 'warning' ? 'Near Limit' : 'Exceeded'}
					</span>
				</div>

				<div class="bucket-figures">
					<div class="spent-figure">
						<span class="fig-label">Spent</span>
						<span class="fig-val">{formatCurrency($buckets.survival.spentAmount)}</span>
					</div>
					<div class="limit-figure">
						<span class="fig-label">Allocated</span>
						<span class="fig-val">{formatCurrency($buckets.survival.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track">
					<div
						class="progress-bar-fill survival-fill"
						style="width: {Math.min(100, $buckets.survival.spentPercent)}%;"
					></div>
				</div>

				<div class="bucket-categories-chips">
					{#each $buckets.survival.categories as cat}
						<span class="cat-chip">
							<CategoryIcon icon={cat.icon} size={14} />
							{cat.name}
						</span>
					{/each}
				</div>
			</div>

			<!-- Fun & Social 30% Card -->
			<div class="bucket-card-hero bucket-fun">
				<div class="bucket-card-header">
					<div class="bucket-title-group">
						<div class="bucket-icon-badge fun">
							<Sparkles size={20} />
						</div>
						<div>
							<h3 class="b-title">{$buckets.fun.name} ({$buckets.fun.targetPercent}%)</h3>
							<p class="b-desc">{$buckets.fun.description}</p>
						</div>
					</div>
					<span class="bucket-status-badge status-{$buckets.fun.status}">
						{$buckets.fun.status === 'safe' ? 'Guilt-Free' : $buckets.fun.status === 'warning' ? 'High Fun Burn' : 'Exceeded'}
					</span>
				</div>

				<div class="bucket-figures">
					<div class="spent-figure">
						<span class="fig-label">Spent</span>
						<span class="fig-val">{formatCurrency($buckets.fun.spentAmount)}</span>
					</div>
					<div class="limit-figure">
						<span class="fig-label">Allocated</span>
						<span class="fig-val">{formatCurrency($buckets.fun.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track">
					<div
						class="progress-bar-fill fun-fill"
						style="width: {Math.min(100, $buckets.fun.spentPercent)}%;"
					></div>
				</div>

				<div class="bucket-categories-chips">
					{#each $buckets.fun.categories as cat}
						<span class="cat-chip">
							<CategoryIcon icon={cat.icon} size={14} />
							{cat.name}
						</span>
					{/each}
				</div>
			</div>

			<!-- Future & Sinking Buffer 20% Card -->
			<div class="bucket-card-hero bucket-future">
				<div class="bucket-card-header">
					<div class="bucket-title-group">
						<div class="bucket-icon-badge future">
							<PiggyBank size={20} />
						</div>
						<div>
							<h3 class="b-title">{$buckets.future.name} ({$buckets.future.targetPercent}%)</h3>
							<p class="b-desc">{$buckets.future.description}</p>
						</div>
					</div>
					<span class="bucket-status-badge status-{$buckets.future.status}">
						{$buckets.future.status === 'safe' ? 'Buffer Protected' : 'Low Savings'}
					</span>
				</div>

				<div class="bucket-figures">
					<div class="spent-figure">
						<span class="fig-label">Saved / Allocated</span>
						<span class="fig-val">{formatCurrency($buckets.future.spentAmount)}</span>
					</div>
					<div class="limit-figure">
						<span class="fig-label">Goal Target</span>
						<span class="fig-val">{formatCurrency($buckets.future.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track">
					<div
						class="progress-bar-fill future-fill"
						style="width: {Math.min(100, $buckets.future.spentPercent)}%;"
					></div>
				</div>

				<div class="bucket-categories-chips">
					{#each $buckets.future.categories as cat}
						<span class="cat-chip">
							<CategoryIcon icon={cat.icon} size={14} />
							{cat.name}
						</span>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- CATEGORY BUDGETS -->
		<div class="category-budgets-section">
			<!-- Overall Budget Setup -->
			<div class="card-section">
				<div class="section-title-bar">
					<Wallet size={20} class="text-accent" />
					<h2 class="card-title">Base Monthly Budget</h2>
				</div>

				<div class="budget-form-row">
					<input
						type="number"
						bind:value={overallBudgetAmount}
						placeholder={overallBudget ? `${overallBudget.amount / 100}` : 'e.g. 8000'}
						step="1"
						min="0"
					/>
					<button class="primary-btn" onclick={handleSetOverallBudget}>
						{overallBudget ? 'Update Limit' : 'Set Budget'}
					</button>
				</div>
			</div>

			<!-- Individual Category Limits List -->
			<div class="category-list-grid">
				{#each categoriesWithBudgets as { category, budget, spent, percentage } (category.id)}
					<div class="category-card-item">
						<div class="cat-top-row">
							<div class="cat-info">
								<span class="cat-icon-wrap">
									<CategoryIcon icon={category.icon} size={20} />
								</span>
								<div>
									<div class="cat-name">{category.name}</div>
									<div class="cat-bucket-select">
										<select
											value={category.bucketType || 'fun'}
											onchange={(e) => handleCategoryBucketChange(category.id, e.currentTarget.value as BudgetBucketType)}
										>
											<option value="survival">Survival (50%)</option>
											<option value="fun">Fun & Social (30%)</option>
											<option value="future">Future/Savings (20%)</option>
										</select>
									</div>
								</div>
							</div>
							<div class="cat-spent-col">
								<div class="spent-val">{formatCurrency(spent)}</div>
								{#if budget}
									<div class="budget-limit-val">/ {formatCurrency(budget.amount)}</div>
								{/if}
							</div>
						</div>

						{#if budget}
							<div class="progress-track mini">
								<div
									class="progress-bar-fill"
									style="width: {Math.min(100, percentage)}%; background: {getBudgetColor(percentage)};"
								></div>
							</div>
						{:else}
							<div class="cat-quick-set">
								<input
									type="number"
									bind:value={categoryBudgetInputs[category.id]}
									placeholder="Set limit..."
									step="1"
									min="0"
								/>
								<button class="mini-btn" onclick={() => handleSetCategoryBudget(category.id)}>
									Save
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Custom Split Modal -->
	{#if showSplitModal}
		<div class="modal-backdrop" onclick={() => (showSplitModal = false)}>
			<div class="modal-sheet" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3 class="modal-title">Customize 3-Bucket Split</h3>
					<button class="close-btn" onclick={() => (showSplitModal = false)}>✕</button>
				</div>
				<p class="modal-sub">Allocate your monthly allowance across your 3 student macro-buckets.</p>

				<div class="sliders-stack">
					<div class="slider-box survival-box">
						<div class="slider-label-row">
							<span>🛡️ Survival & Essentials</span>
							<strong>{customSurvival}%</strong>
						</div>
						<input type="range" min="20" max="80" bind:value={customSurvival} />
					</div>

					<div class="slider-box fun-box">
						<div class="slider-label-row">
							<span>✨ Fun & Social</span>
							<strong>{customFun}%</strong>
						</div>
						<input type="range" min="10" max="60" bind:value={customFun} />
					</div>

					<div class="slider-box future-box">
						<div class="slider-label-row">
							<span>🐖 Future Buffer & Goals</span>
							<strong>{customFuture}%</strong>
						</div>
						<input type="range" min="5" max="50" bind:value={customFuture} />
					</div>
				</div>

				<div class="modal-total-bar" class:invalid={Number(customSurvival) + Number(customFun) + Number(customFuture) !== 100}>
					Total: <strong>{Number(customSurvival) + Number(customFun) + Number(customFuture)}%</strong>
					{#if Number(customSurvival) + Number(customFun) + Number(customFuture) !== 100}
						<span class="warning-text">(Must equal 100%)</span>
					{/if}
				</div>

				<div class="modal-actions">
					<button class="secondary-btn" onclick={() => (showSplitModal = false)}>Cancel</button>
					<button class="primary-btn" onclick={handleSaveCustomSplit}>Save Allocations</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.budgets-page {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
		animation: fadeIn 0.3s ease-out;
	}

	.page-header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 18px;
		padding-top: 8px;
	}

	.eyebrow {
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

	.settings-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 8px 14px;
		border-radius: 9999px;
		font-weight: 700;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: var(--shadow-sm);
	}

	.month-selector-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 10px 16px;
		margin-bottom: 18px;
		box-shadow: var(--shadow-sm);
	}

	.month-nav-btn {
		background: transparent;
		border: none;
		color: var(--accent-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.month-display {
		font-weight: 800;
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	/* Tab Control */
	.tab-control {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		background: var(--bg-card);
		padding: 6px;
		border-radius: 18px;
		border: 1px solid var(--border-color);
		margin-bottom: 20px;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border-radius: 14px;
		border: none;
		background: transparent;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-btn.active {
		background: var(--accent-primary);
		color: white;
		box-shadow: 0 4px 15px var(--accent-glow);
	}

	/* Buckets Hero Stack */
	.buckets-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.bucket-card-hero {
		background: var(--bg-card);
		border-radius: 26px;
		padding: 22px;
		border: 1px solid var(--border-color);
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}

	.bucket-card-hero::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
	}

	.bucket-survival::before { background: #3B82F6; }
	.bucket-fun::before { background: #EC4899; }
	.bucket-future::before { background: #10B981; }

	.bucket-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 18px;
	}

	.bucket-title-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.bucket-icon-badge {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bucket-icon-badge.survival { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
	.bucket-icon-badge.fun { background: rgba(236, 72, 153, 0.12); color: #DB2777; }
	.bucket-icon-badge.future { background: rgba(16, 185, 129, 0.12); color: #059669; }

	.b-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.b-desc {
		font-size: 0.74rem;
		color: var(--text-muted);
		margin-top: 1px;
	}

	.bucket-status-badge {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 9999px;
	}

	.status-safe { background: rgba(16, 185, 129, 0.12); color: #059669; }
	.status-warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }
	.status-exceeded { background: rgba(255, 51, 102, 0.12); color: #FF3366; }

	.bucket-figures {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.fig-label {
		display: block;
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
	}

	.fig-val {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.progress-track {
		height: 10px;
		background: var(--bg-primary);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 16px;
	}

	.progress-track.mini {
		height: 6px;
		margin-top: 10px;
		margin-bottom: 0;
	}

	.progress-bar-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.survival-fill { background: #3B82F6; }
	.fun-fill { background: #EC4899; }
	.future-fill { background: #10B981; }

	.bucket-categories-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.cat-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border-radius: 10px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 600;
	}

	/* Category Limits View */
	.category-budgets-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.card-section {
		background: var(--bg-card);
		border-radius: 22px;
		padding: 18px;
		border: 1px solid var(--border-color);
	}

	.section-title-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.budget-form-row {
		display: flex;
		gap: 10px;
	}

	.budget-form-row input {
		flex: 1;
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-weight: 700;
	}

	.primary-btn {
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 10px 18px;
		border-radius: 14px;
		font-weight: 700;
		cursor: pointer;
	}

	.category-list-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.category-card-item {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 18px;
		padding: 14px 16px;
	}

	.cat-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.cat-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.cat-icon-wrap {
		width: 36px;
		height: 36px;
		border-radius: 12px;
		background: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cat-name {
		font-weight: 700;
		font-size: 0.92rem;
		color: var(--text-primary);
	}

	.cat-bucket-select select {
		font-size: 0.7rem;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-weight: 600;
		cursor: pointer;
		padding: 0;
	}

	.cat-spent-col {
		text-align: right;
	}

	.spent-val {
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.budget-limit-val {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.cat-quick-set {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}

	.cat-quick-set input {
		flex: 1;
		padding: 6px 10px;
		border-radius: 10px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		font-size: 0.8rem;
	}

	.mini-btn {
		background: var(--accent-primary);
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 999;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.modal-sheet {
		background: var(--bg-card);
		border-radius: 28px 28px 0 0;
		padding: 24px;
		width: 100%;
		max-width: 600px;
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.modal-title {
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 1.2rem;
		color: var(--text-muted);
		cursor: pointer;
	}

	.modal-sub {
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-bottom: 20px;
	}

	.sliders-stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: 18px;
	}

	.slider-box {
		background: var(--bg-primary);
		padding: 14px;
		border-radius: 16px;
		border: 1px solid var(--border-color);
	}

	.slider-label-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.slider-box input[type='range'] {
		width: 100%;
		accent-color: var(--accent-primary);
	}

	.modal-total-bar {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
		padding: 10px;
		margin-bottom: 18px;
	}

	.modal-total-bar.invalid {
		color: var(--danger);
	}

	.modal-actions {
		display: flex;
		gap: 12px;
	}

	.secondary-btn {
		flex: 1;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 12px;
		border-radius: 14px;
		font-weight: 700;
		cursor: pointer;
	}

	.modal-actions .primary-btn {
		flex: 1;
		padding: 12px;
	}

	.toast {
		position: fixed;
		top: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent-primary);
		color: white;
		padding: 10px 20px;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 700;
		box-shadow: var(--shadow-md);
		z-index: 1001;
	}
</style>
