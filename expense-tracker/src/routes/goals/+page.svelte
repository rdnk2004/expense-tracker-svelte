<script lang="ts">
	import {
		goals,
		goalStats,
		wallets,
		studentProfile,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import type { SavingsGoal, GoalCategory } from '$lib/types';
	import {
		Target,
		Compass,
		Plus,
		Check,
		X,
		Trash2,
		Sparkles,
		Calendar,
		Coins,
		PiggyBank,
		Palmtree,
		Laptop,
		Home,
		Ticket,
		ArrowRight
	} from 'lucide-svelte';

	let showAddModal = $state(false);
	let showContributeModal = $state(false);
	let selectedGoal = $state<SavingsGoal | null>(null);

	let showToast = $state(false);
	let toastMessage = $state('');

	// Add Goal Form State
	let formTitle = $state('');
	let formTargetAmount = $state('');
	let formCategory = $state<GoalCategory>('travel');
	let formTargetDate = $state(
		new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
	);
	let formColor = $state('#10B981');
	let formEmoji = $state('🌴');

	// Contribute Form State
	let contributeAmountStr = $state('500');
	let contributeWalletId = $state($wallets[0]?.id || '');
	let contributeNote = $state('Stashing campus savings');

	// Preset Templates
	const presets = [
		{ title: 'Semester Road Trip', amount: 15000, category: 'travel' as GoalCategory, color: '#38BDF8', emoji: '🌴' },
		{ title: 'New Laptop / iPad Fund', amount: 55000, category: 'tech' as GoalCategory, color: '#6366F1', emoji: '💻' },
		{ title: 'Hostel / Security Deposit', amount: 20000, category: 'security_deposit' as GoalCategory, color: '#10B981', emoji: '🏠' },
		{ title: 'Concert & Fest Pass', amount: 3500, category: 'fest' as GoalCategory, color: '#EC4899', emoji: '🎟️' }
	];

	function applyPreset(p: typeof presets[0]) {
		formTitle = p.title;
		formTargetAmount = p.amount.toString();
		formCategory = p.category;
		formColor = p.color;
		formEmoji = p.emoji;
		showAddModal = true;
	}

	async function handleAddGoal() {
		const targetAmount = parseFloat(formTargetAmount);
		if (!formTitle.trim() || isNaN(targetAmount) || targetAmount <= 0) {
			showSuccessToast('Please enter a valid title and target amount');
			return;
		}

		try {
			await goals.add({
				title: formTitle.trim(),
				targetAmount: Math.round(targetAmount * 100),
				targetDate: formTargetDate,
				category: formCategory,
				emoji: formEmoji,
				color: formColor
			});

			formTitle = '';
			formTargetAmount = '';
			showAddModal = false;
			showSuccessToast('Sinking fund goal created! 🎯');
		} catch (err) {
			console.error('Failed to create goal:', err);
		}
	}

	function openContribute(goal: SavingsGoal) {
		selectedGoal = goal;
		showContributeModal = true;
	}

	async function handleContribute() {
		if (!selectedGoal) return;
		const amount = parseFloat(contributeAmountStr);
		if (isNaN(amount) || amount <= 0) {
			showSuccessToast('Please enter a valid contribution amount');
			return;
		}

		try {
			await goals.contribute(
				selectedGoal.id,
				Math.round(amount * 100),
				contributeWalletId || undefined,
				contributeNote.trim() || undefined
			);

			showContributeModal = false;
			selectedGoal = null;
			showSuccessToast('Stashed into goal! 💰');
		} catch (err: any) {
			showSuccessToast(err.message || 'Failed to contribute');
		}
	}

	async function handleDeleteGoal(id: string) {
		if (confirm('Delete this goal?')) {
			await goals.delete(id);
			showSuccessToast('Goal removed');
		}
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<div class="goals-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="campus-sub">Sinking Funds</span>
			<h1 class="page-title">Goals & Future Reserves</h1>
		</div>
		<button class="add-goal-btn" onclick={() => (showAddModal = true)}>
			<Plus size={16} />
			<span>New Goal</span>
		</button>
	</div>

	<!-- Sinking Funds Macro Overview -->
	<div class="card goals-hero-card">
		<div class="hero-top-row">
			<div>
				<span class="hero-label">Total Stashed Pool</span>
				<div class="hero-amount tabular">{formatCurrency($goalStats.totalSaved)}</div>
			</div>
			<div class="progress-pill">
				<Sparkles size={14} color="var(--accent-primary)" />
				<span><strong class="tabular">{$goalStats.overallProgress}%</strong> Funded</span>
			</div>
		</div>

		<div class="macro-track">
			<div class="macro-fill" style="width: {$goalStats.overallProgress}%;"></div>
		</div>

		<div class="hero-bottom-stats">
			<span>Target Pool: <strong class="tabular">{formatCurrency($goalStats.totalTarget)}</strong></span>
			<span>Remaining: <strong class="tabular">{formatCurrency($goalStats.totalRemaining)}</strong></span>
		</div>
	</div>

	<!-- Fast Preset Accelerators -->
	<div class="presets-section">
		<span class="presets-label">⚡ Fast Preset Sinking Funds</span>
		<div class="preset-chips-grid">
			{#each presets as p}
				<button class="preset-card-item" onclick={() => applyPreset(p)}>
					<div class="preset-icon" style="background: {p.color}20; color: {p.color};">
						{#if p.category === 'travel'}
							<Palmtree size={16} />
						{:else if p.category === 'tech'}
							<Laptop size={16} />
						{:else if p.category === 'security_deposit'}
							<Home size={16} />
						{:else}
							<Ticket size={16} />
						{/if}
					</div>
					<div class="preset-text">
						<span class="p-title">{p.title}</span>
						<span class="p-val tabular">₹{p.amount.toLocaleString('en-IN')}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Active Goals Stack -->
	<div class="card goals-ledger-card">
		<h2 class="card-heading">Active Sinking Funds ({$goalStats.goalsCount})</h2>

		<div class="goals-list">
			{#each $goalStats.enrichedGoals as goal (goal.id)}
				<div class="goal-card-item" class:completed={goal.isCompleted}>
					<div class="goal-header-line">
						<div class="goal-title-wrap">
							<span class="goal-emoji">{goal.emoji || '🎯'}</span>
							<div>
								<h3 class="goal-title-txt">{goal.title}</h3>
								<span class="goal-ratio-txt tabular">
									{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
								</span>
							</div>
						</div>

						<div class="goal-pct-pill tabular" style="color: {goal.color || '#10B981'};">
							{goal.progressPercent}%
						</div>
					</div>

					<div class="goal-progress-track">
						<div
							class="goal-progress-fill"
							style="width: {goal.progressPercent}%; background: {goal.color || '#10B981'};"
						></div>
					</div>

					<!-- Daily & Weekly Pacing Forecast -->
					{#if !goal.isCompleted && goal.targetDate}
						<div class="pacing-row">
							<div class="pacing-item">
								<Calendar size={12} color="var(--accent-primary)" />
								<span><strong class="tabular">{goal.daysLeft}</strong> days left</span>
							</div>
							<div class="pacing-item">
								<Coins size={12} color="var(--accent-primary)" />
								<span>Save <strong class="tabular">{formatCurrency(goal.requiredDailyPaise)}/day</strong></span>
							</div>
						</div>
					{/if}

					<div class="goal-actions-row">
						{#if !goal.isCompleted}
							<button class="deposit-btn" onclick={() => openContribute(goal)}>
								<Plus size={13} />
								<span>Deposit / Stash</span>
							</button>
						{:else}
							<span class="achieved-tag">🎉 Goal Accomplished</span>
						{/if}
						<button class="delete-goal-icon" onclick={() => handleDeleteGoal(goal.id)} aria-label="Delete Goal">
							<Trash2 size={14} />
						</button>
					</div>
				</div>
			{:else}
				<div class="empty-goals">
					<PiggyBank size={32} color="var(--text-muted)" />
					<p>No active goals yet. Create one or pick a preset above!</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Add Goal Bottom Sheet -->
{#if showAddModal}
	<div
		class="modal-backdrop"
		onclick={() => (showAddModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showAddModal = false)}
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
				<h3>New Sinking Fund Goal</h3>
				<button class="close-btn" onclick={() => (showAddModal = false)}>✕</button>
			</div>

			<div class="form-group-custom">
				<label for="g-title">Goal Name</label>
				<input id="g-title" type="text" placeholder="e.g. Goa Trip, New iPad..." bind:value={formTitle} />
			</div>

			<div class="form-group-custom">
				<label for="g-target">Target Amount (₹)</label>
				<input id="g-target" type="number" placeholder="15000" bind:value={formTargetAmount} class="tabular" />
			</div>

			<div class="form-group-custom">
				<label for="g-date">Target Deadline</label>
				<input id="g-date" type="date" bind:value={formTargetDate} />
			</div>

			<button class="primary-btn-full" onclick={handleAddGoal}>
				Create Sinking Fund
			</button>
		</div>
	</div>
{/if}

<!-- Contribute / Stash Bottom Sheet -->
{#if showContributeModal && selectedGoal}
	<div
		class="modal-backdrop"
		onclick={() => (showContributeModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showContributeModal = false)}
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
				<h3>Stash into {selectedGoal.title}</h3>
				<button class="close-btn" onclick={() => (showContributeModal = false)}>✕</button>
			</div>

			<div class="form-group-custom">
				<label for="c-amt">Deposit Amount (₹)</label>
				<input id="c-amt" type="number" placeholder="500" bind:value={contributeAmountStr} class="tabular" />
			</div>

			<div class="form-group-custom">
				<label for="c-wallet">Deduct From Wallet</label>
				<select id="c-wallet" bind:value={contributeWalletId}>
					{#each $wallets as w}
						<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
					{/each}
				</select>
			</div>

			<button class="primary-btn-full" onclick={handleContribute}>
				Confirm Stash
			</button>
		</div>
	</div>
{/if}

<style>
	.goals-page {
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
		margin-bottom: 1.15rem;
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
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.65rem;
		}
	}

	.add-goal-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--accent-primary);
		color: #080C14;
		padding: 0.55rem 1rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		box-shadow: 0 4px 14px var(--accent-glow);
		transition: all 0.2s ease;
	}

	/* Hero Card */
	.goals-hero-card {
		padding: 1.15rem;
		background: linear-gradient(135deg, var(--bg-card) 0%, var(--surface-2) 100%);
	}

	.hero-top-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.hero-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.hero-amount {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.1;
	}

	.progress-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.76rem;
		color: var(--text-secondary);
	}

	.macro-track {
		height: 8px;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
		margin-bottom: 0.85rem;
	}

	.macro-fill {
		height: 100%;
		background: linear-gradient(90deg, #10B981, #06B6D4);
		border-radius: var(--border-radius-pill);
		transition: width 0.4s ease;
	}

	.hero-bottom-stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.76rem;
		color: var(--text-muted);
	}

	.hero-bottom-stats strong {
		color: var(--text-primary);
	}

	/* Presets */
	.presets-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.presets-label {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.preset-chips-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.preset-card-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0.85rem 1rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		text-align: left;
		transition: all 0.2s ease;
	}

	.preset-card-item:hover {
		background: var(--bg-hover);
		border-color: var(--border-medium);
	}

	.preset-icon {
		width: 42px;
		height: 42px;
		border-radius: var(--border-radius-xs);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.preset-text {
		display: flex;
		flex-direction: column;
	}

	.p-title {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.p-val {
		font-size: 0.74rem;
		color: var(--text-muted);
	}

	/* Active Goals */
	.goals-ledger-card {
		padding: 1.15rem;
	}

	.card-heading {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.goals-list {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.goal-card-item {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 0.85rem 1rem;
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.goal-header-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.goal-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.goal-emoji {
		font-size: 1.25rem;
	}

	.goal-title-txt {
		font-size: 0.92rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.goal-ratio-txt {
		font-size: 0.74rem;
		color: var(--text-muted);
	}

	.goal-pct-pill {
		font-size: 0.95rem;
		font-weight: 800;
	}

	.goal-progress-track {
		height: 6px;
		background: var(--bg-card);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
	}

	.goal-progress-fill {
		height: 100%;
		border-radius: var(--border-radius-pill);
		transition: width 0.3s ease;
	}

	.pacing-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
		color: var(--text-secondary);
		background: var(--bg-card);
		border-radius: var(--border-radius-pill);
		padding: 4px 10px;
		border: 1px solid var(--border-color);
		font-weight: 600;
	}

	.pacing-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.goal-actions-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 4px;
	}

	.deposit-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--accent-primary);
		color: #FFFFFF;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 0.4rem 0.85rem;
		border-radius: var(--border-radius-pill);
		min-height: 36px;
	}

	.achieved-tag {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--success);
	}

	.delete-goal-icon {
		color: var(--text-muted);
		background: transparent;
		padding: 6px;
	}

	.delete-goal-icon:hover {
		color: var(--danger);
	}

	.empty-goals {
		text-align: center;
		padding: 2.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-muted);
		font-size: 0.88rem;
	}

	/* Sheet Forms */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.sheet-top-row h3 {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.form-group-custom {
		margin-bottom: 1rem;
	}

	.form-group-custom label {
		display: block;
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
	}

	.primary-btn-full {
		width: 100%;
		background: var(--accent-primary);
		color: #FFFFFF;
		font-weight: 800;
		font-size: 0.95rem;
		padding: 0.85rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
		margin-top: 0.5rem;
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 480px) {
		.preset-chips-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
