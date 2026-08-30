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
		Wallet,
		FolderOpen,
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

	let overallBudgetAmount = $state('');
	let categoryBudgetInputs = $state<Record<string, string>>({});
	let selectedMonth = $state($currentMonth);
	let showToast = $state(false);
	let toastMessage = $state('');
	let showSplitModal = $state(false);
	let activeTab = $state<'buckets' | 'categories'>('buckets');

	let customSurvival = $state($studentProfile.survivalBucketPercent || 50);
	let customFun = $state($studentProfile.funBucketPercent || 30);
	let customFuture = $state($studentProfile.futureBucketPercent || 20);

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

	async function handleSetOverallBudget() {
		if (!overallBudgetAmount || parseFloat(overallBudgetAmount) <= 0) {
			showToastMessage('Please enter a valid amount');
			return;
		}

		try {
			await setBudget('overall', Math.round(parseFloat(overallBudgetAmount) * 100));
			overallBudgetAmount = '';
			showToastMessage('Monthly budget updated! 🎯');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showToastMessage('Failed to set budget');
		}
	}

	async function handleSetCategoryBudget(categoryId: string) {
		const amount = categoryBudgetInputs[categoryId];
		if (!amount || parseFloat(amount) <= 0) {
			showToastMessage('Please enter a valid amount');
			return;
		}

		try {
			await setBudget('category', Math.round(parseFloat(amount) * 100), categoryId);
			categoryBudgetInputs = { ...categoryBudgetInputs, [categoryId]: '' };
			showToastMessage('Category limit saved!');
		} catch (error) {
			console.error('Failed to set budget:', error);
			showToastMessage('Failed to set budget');
		}
	}

	async function handleCategoryBucketChange(categoryId: string, bucketType: BudgetBucketType) {
		try {
			await setCategoryBucket(categoryId, bucketType);
			showToastMessage('Category bucket updated!');
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSaveCustomSplit() {
		const total = Number(customSurvival) + Number(customFun) + Number(customFuture);
		if (total !== 100) {
			showToastMessage(`Percentages must add up to 100% (currently ${total}%)`);
			return;
		}
		await updateBucketSplit(Number(customSurvival), Number(customFun), Number(customFuture));
		showSplitModal = false;
		showToastMessage('3-Bucket allocations saved! 🚀');
	}

	function showToastMessage(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => (showToast = false), 3000);
	}

	function getBudgetColor(percentage: number): string {
		if (percentage < 70) return '#10B981';
		if (percentage < 90) return '#F59E0B';
		return '#F43F5E';
	}
</script>

<div class="budgets-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<!-- Header -->
	<div class="page-header">
		<div>
			<span class="campus-sub">Macro Budgeting</span>
			<h1 class="page-title">3-Bucket Framework</h1>
		</div>
		<button class="adjust-split-btn" onclick={() => (showSplitModal = true)}>
			<Sliders size={15} />
			<span>Customize Split</span>
		</button>
	</div>

	<!-- Month Switcher Dock -->
	<div class="month-dock-card">
		<button class="m-dock-btn" onclick={goToPreviousMonth} aria-label="Previous month">
			<ChevronLeft size={18} />
		</button>
		<div class="m-dock-name">{getMonthName(selectedMonth)}</div>
		<button class="m-dock-btn" onclick={goToNextMonth} aria-label="Next month">
			<ChevronRight size={18} />
		</button>
	</div>

	<!-- View Toggle Tabs -->
	<div class="tab-pill-switcher">
		<button
			class="tab-pill"
			class:active={activeTab === 'buckets'}
			onclick={() => (activeTab = 'buckets')}
		>
			<ChartPie size={16} />
			<span>3-Bucket Macro</span>
		</button>
		<button
			class="tab-pill"
			class:active={activeTab === 'categories'}
			onclick={() => (activeTab = 'categories')}
		>
			<FolderOpen size={16} />
			<span>Category Limits</span>
		</button>
	</div>

	{#if activeTab === 'buckets'}
		<!-- 3-BUCKET SYSTEM DECK -->
		<div class="buckets-deck">
			<!-- Survival 50% Card -->
			<div class="bucket-hero-card survival-theme">
				<div class="bucket-top-line">
					<div class="bucket-brand-group">
						<div class="bucket-badge-icon survival">
							<ShieldCheck size={18} />
						</div>
						<div>
							<h3 class="bucket-heading">{$buckets.survival.name} ({$buckets.survival.targetPercent}%)</h3>
							<p class="bucket-sub-desc">{$buckets.survival.description}</p>
						</div>
					</div>
					<span class="status-indicator-tag status-{$buckets.survival.status}">
						{$buckets.survival.status === 'safe' ? 'On Track' : $buckets.survival.status === 'warning' ? 'Near Limit' : 'Exceeded'}
					</span>
				</div>

				<div class="bucket-figures-row">
					<div class="figure-block">
						<span class="figure-lbl">Spent</span>
						<span class="figure-val tabular">{formatCurrency($buckets.survival.spentAmount)}</span>
					</div>
					<div class="figure-block align-right">
						<span class="figure-lbl">Allocated</span>
						<span class="figure-val tabular">{formatCurrency($buckets.survival.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track-neo">
					<div
						class="progress-fill-neo survival-bar"
						style="width: {Math.min(100, $buckets.survival.spentPercent)}%;"
					></div>
				</div>

				<div class="category-chips-strip">
					{#each $buckets.survival.categories as cat}
						<span class="mini-cat-chip">
							<CategoryIcon icon={cat.icon} size={13} />
							<span>{cat.name}</span>
						</span>
					{/each}
				</div>
			</div>

			<!-- Fun & Social 30% Card -->
			<div class="bucket-hero-card fun-theme">
				<div class="bucket-top-line">
					<div class="bucket-brand-group">
						<div class="bucket-badge-icon fun">
							<Sparkles size={18} />
						</div>
						<div>
							<h3 class="bucket-heading">{$buckets.fun.name} ({$buckets.fun.targetPercent}%)</h3>
							<p class="bucket-sub-desc">{$buckets.fun.description}</p>
						</div>
					</div>
					<span class="status-indicator-tag status-{$buckets.fun.status}">
						{$buckets.fun.status === 'safe' ? 'Guilt-Free' : $buckets.fun.status === 'warning' ? 'High Pace' : 'Exceeded'}
					</span>
				</div>

				<div class="bucket-figures-row">
					<div class="figure-block">
						<span class="figure-lbl">Spent</span>
						<span class="figure-val tabular">{formatCurrency($buckets.fun.spentAmount)}</span>
					</div>
					<div class="figure-block align-right">
						<span class="figure-lbl">Allocated</span>
						<span class="figure-val tabular">{formatCurrency($buckets.fun.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track-neo">
					<div
						class="progress-fill-neo fun-bar"
						style="width: {Math.min(100, $buckets.fun.spentPercent)}%;"
					></div>
				</div>

				<div class="category-chips-strip">
					{#each $buckets.fun.categories as cat}
						<span class="mini-cat-chip">
							<CategoryIcon icon={cat.icon} size={13} />
							<span>{cat.name}</span>
						</span>
					{/each}
				</div>
			</div>

			<!-- Future & Sinking Buffer 20% Card -->
			<div class="bucket-hero-card future-theme">
				<div class="bucket-top-line">
					<div class="bucket-brand-group">
						<div class="bucket-badge-icon future">
							<PiggyBank size={18} />
						</div>
						<div>
							<h3 class="bucket-heading">{$buckets.future.name} ({$buckets.future.targetPercent}%)</h3>
							<p class="bucket-sub-desc">{$buckets.future.description}</p>
						</div>
					</div>
					<span class="status-indicator-tag status-{$buckets.future.status}">
						{$buckets.future.status === 'safe' ? 'Buffer Protected' : 'Low Savings'}
					</span>
				</div>

				<div class="bucket-figures-row">
					<div class="figure-block">
						<span class="figure-lbl">Allocated</span>
						<span class="figure-val tabular">{formatCurrency($buckets.future.spentAmount)}</span>
					</div>
					<div class="figure-block align-right">
						<span class="figure-lbl">Goal Target</span>
						<span class="figure-val tabular">{formatCurrency($buckets.future.allocatedAmount)}</span>
					</div>
				</div>

				<div class="progress-track-neo">
					<div
						class="progress-fill-neo future-bar"
						style="width: {Math.min(100, $buckets.future.spentPercent)}%;"
					></div>
				</div>

				<div class="category-chips-strip">
					{#each $buckets.future.categories as cat}
						<span class="mini-cat-chip">
							<CategoryIcon icon={cat.icon} size={13} />
							<span>{cat.name}</span>
						</span>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- CATEGORY LIMITS VIEW -->
		<div class="category-limits-view">
			<!-- Overall Base Budget -->
			<div class="card base-budget-card">
				<div class="card-top-line">
					<div class="base-budget-title">
						<Wallet size={18} color="var(--accent-primary)" />
						<h3>Base Monthly Cap</h3>
					</div>
					{#if overallBudget}
						<span class="active-cap-tag tabular">{formatCurrency(overallBudget.amount)}</span>
					{/if}
				</div>

				<div class="base-input-row">
					<input
						type="number"
						bind:value={overallBudgetAmount}
						placeholder={overallBudget ? `${overallBudget.amount / 100}` : 'e.g. 8000'}
						step="1"
						min="0"
						class="base-input"
					/>
					<button class="save-cap-btn" onclick={handleSetOverallBudget}>
						{overallBudget ? 'Update Limit' : 'Set Cap'}
					</button>
				</div>
			</div>

			<!-- Individual Category Limits List -->
			<div class="category-cards-grid">
				{#each categoriesWithBudgets as { category, budget, spent, percentage } (category.id)}
					<div class="card cat-budget-card">
						<div class="cat-card-header">
							<div class="cat-info-group">
								<div class="cat-icon-frame" style="background: {category.color}20; color: {category.color};">
									<CategoryIcon icon={category.icon} size={18} />
								</div>
								<div>
									<h4 class="cat-title">{category.name}</h4>
									<select
										class="bucket-dropdown"
										value={category.bucketType || 'fun'}
										onchange={(e) => handleCategoryBucketChange(category.id, e.currentTarget.value as BudgetBucketType)}
									>
										<option value="survival">Survival (50%)</option>
										<option value="fun">Fun (30%)</option>
										<option value="future">Future (20%)</option>
									</select>
								</div>
							</div>

							<div class="cat-spent-stats">
								<span class="cat-spent-val tabular">{formatCurrency(spent)}</span>
								{#if budget}
									<span class="cat-limit-sub tabular">/ {formatCurrency(budget.amount)}</span>
								{/if}
							</div>
						</div>

						{#if budget}
							<div class="progress-track-neo mini">
								<div
									class="progress-fill-neo"
									style="width: {Math.min(100, percentage)}%; background: {getBudgetColor(percentage)};"
								></div>
							</div>
						{:else}
							<div class="cat-quick-input-row">
								<input
									type="number"
									bind:value={categoryBudgetInputs[category.id]}
									placeholder="Set monthly limit (₹)..."
									step="1"
									min="0"
									class="cat-limit-input"
								/>
								<button class="cat-save-btn" onclick={() => handleSetCategoryBudget(category.id)}>
									Save
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- 3-Bucket Split Customizer Bottom Sheet -->
{#if showSplitModal}
	<div
		class="modal-backdrop"
		onclick={() => (showSplitModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showSplitModal = false)}
	>
		<div
			class="modal-sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="sheet-top-row">
				<h3>Customize 3-Bucket Allocations</h3>
				<button class="close-btn" onclick={() => (showSplitModal = false)}>✕</button>
			</div>

			<p class="sheet-sub">Calibrate your allowance distribution according to your campus expenses.</p>

			<div class="sliders-stack">
				<div class="slider-block survival-theme-block">
					<div class="slider-header-line">
						<span>🛡️ Survival (Mess, Rent, Books)</span>
						<strong class="tabular">{customSurvival}%</strong>
					</div>
					<input type="range" min="20" max="80" bind:value={customSurvival} class="range-slider" />
				</div>

				<div class="slider-block fun-theme-block">
					<div class="slider-header-line">
						<span>✨ Fun & Social (Canteen, Outings)</span>
						<strong class="tabular">{customFun}%</strong>
					</div>
					<input type="range" min="10" max="60" bind:value={customFun} class="range-slider" />
				</div>

				<div class="slider-block future-theme-block">
					<div class="slider-header-line">
						<span>🐖 Future Buffer (Sinking Funds)</span>
						<strong class="tabular">{customFuture}%</strong>
					</div>
					<input type="range" min="5" max="50" bind:value={customFuture} class="range-slider" />
				</div>
			</div>

			<div class="total-allocation-bar" class:invalid={Number(customSurvival) + Number(customFun) + Number(customFuture) !== 100}>
				<span>Total: <strong class="tabular">{Number(customSurvival) + Number(customFun) + Number(customFuture)}%</strong></span>
				{#if Number(customSurvival) + Number(customFun) + Number(customFuture) !== 100}
					<span class="warning-tag">Must equal 100%</span>
				{/if}
			</div>

			<div class="sheet-action-row">
				<button class="save-split-btn" onclick={handleSaveCustomSplit}>
					Apply Allocation Split
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.budgets-page {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.toast-pill {
		position: fixed;
		top: 1.25rem;
		left: 50%;
		transform: translateX(-50%);
		background: #10B981;
		color: #080C14;
		font-weight: 800;
		font-size: 0.85rem;
		padding: 0.55rem 1.25rem;
		border-radius: var(--border-radius-pill);
		box-shadow: var(--shadow-lg);
		z-index: 10000;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.campus-sub {
		display: block;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-primary);
		margin-bottom: 2px;
	}

	.page-title {
		font-size: 1.65rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.04em;
		margin: 0;
	}

	.adjust-split-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.55rem 0.95rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.adjust-split-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent-primary);
	}

	/* Month Dock */
	.month-dock-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-pill);
		padding: 4px 6px;
	}

	.m-dock-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.m-dock-btn:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.m-dock-name {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	/* Tab Switcher */
	.tab-pill-switcher {
		display: flex;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 3px;
		border-radius: var(--border-radius-pill);
	}

	.tab-pill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0.55rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.tab-pill.active {
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: var(--shadow-xs);
	}

	/* Buckets Deck */
	.buckets-deck {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.bucket-hero-card {
		border-radius: 24px;
		padding: 1.35rem;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-color);
		background: var(--bg-card);
	}

	.survival-theme {
		border-top: 3px solid #10B981;
	}

	.fun-theme {
		border-top: 3px solid #38BDF8;
	}

	.future-theme {
		border-top: 3px solid #818CF8;
	}

	.bucket-top-line {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.15rem;
		gap: 8px;
	}

	.bucket-brand-group {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.bucket-badge-icon {
		width: 38px;
		height: 38px;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.bucket-badge-icon.survival { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
	.bucket-badge-icon.fun { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }
	.bucket-badge-icon.future { background: rgba(99, 102, 241, 0.15); color: #818CF8; border: 1px solid rgba(99, 102, 241, 0.3); }

	.bucket-heading {
		font-size: 0.98rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.bucket-sub-desc {
		font-size: 0.74rem;
		color: var(--text-muted);
		margin: 2px 0 0;
	}

	.status-indicator-tag {
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.2rem 0.55rem;
		border-radius: var(--border-radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.status-safe { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
	.status-warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
	.status-exceeded { background: rgba(244, 63, 94, 0.15); color: #F43F5E; border: 1px solid rgba(244, 63, 94, 0.3); }

	.bucket-figures-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.figure-block {
		display: flex;
		flex-direction: column;
	}

	.figure-lbl {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.figure-val {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.align-right {
		text-align: right;
	}

	.progress-track-neo {
		height: 8px;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
		margin-bottom: 1rem;
	}

	.progress-fill-neo {
		height: 100%;
		border-radius: var(--border-radius-pill);
		transition: width 0.4s ease;
	}

	.survival-bar { background: #10B981; }
	.fun-bar { background: #38BDF8; }
	.future-bar { background: #818CF8; }

	.category-chips-strip {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.mini-cat-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 0.25rem 0.55rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	/* Category Limits View */
	.category-limits-view {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
	}

	.base-budget-card {
		padding: 1.25rem;
	}

	.base-budget-title {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.base-budget-title h3 {
		font-size: 1rem;
		font-weight: 800;
		margin: 0;
	}

	.active-cap-tag {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--accent-primary);
	}

	.base-input-row {
		display: flex;
		gap: 8px;
		margin-top: 0.85rem;
	}

	.base-input {
		flex: 1;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		font-size: 16px;
		color: var(--text-primary);
		min-height: 48px;
	}

	.save-cap-btn {
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		padding: 0.75rem 1.25rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.88rem;
		box-shadow: 0 2px 10px var(--accent-glow);
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.category-cards-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cat-budget-card {
		padding: 1rem 1.25rem;
	}

	.cat-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.65rem;
	}

	.cat-info-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.cat-icon-frame {
		width: 36px;
		height: 36px;
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.cat-title {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0 0 2px;
	}

	.bucket-dropdown {
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-pill);
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-secondary);
		padding: 2px 6px;
		min-height: auto;
	}

	.cat-spent-stats {
		text-align: right;
	}

	.cat-spent-val {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		display: block;
	}

	.cat-limit-sub {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.cat-quick-input-row {
		display: flex;
		gap: 6px;
		margin-top: 0.5rem;
	}

	.cat-limit-input {
		flex: 1;
		min-height: 36px;
		padding: 0.4rem 0.75rem;
		font-size: 0.82rem;
	}

	.cat-save-btn {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		font-size: 0.78rem;
		font-weight: 700;
		padding: 0 0.85rem;
		border-radius: var(--border-radius);
	}

	/* Split Modal Sheet */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.sheet-top-row h3 {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.sheet-sub {
		font-size: 0.82rem;
		color: var(--text-secondary);
		margin-bottom: 1.25rem;
	}

	.sliders-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.slider-block {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		border: 1px solid var(--border-subtle);
	}

	.slider-header-line {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.range-slider {
		width: 100%;
		accent-color: var(--accent-primary);
	}

	.total-allocation-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		font-size: 0.88rem;
		font-weight: 700;
		margin-bottom: 1.25rem;
	}

	.total-allocation-bar.invalid {
		border: 1px solid var(--danger);
		color: var(--danger);
	}

	.warning-tag {
		font-size: 0.74rem;
		color: var(--danger);
	}

	.sheet-action-row {
		display: flex;
	}

	.save-split-btn {
		width: 100%;
		background: var(--accent-primary);
		color: #080C14;
		font-weight: 800;
		font-size: 0.95rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
	}
</style>
