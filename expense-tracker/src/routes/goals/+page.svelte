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
		Flame,
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
	let formColor = $state('#7C3AED');
	let formEmoji = $state('🌴');

	// Contribute Form State
	let contributeAmountStr = $state('500');
	let contributeWalletId = $state($wallets[0]?.id || '');
	let contributeNote = $state('Stashing campus savings');

	// Preset Goal Templates
	const presets = [
		{ title: 'Semester Road Trip', amount: 15000, category: 'travel' as GoalCategory, color: '#F59E0B', emoji: '🌴' },
		{ title: 'New Tech / Laptop Fund', amount: 60000, category: 'tech' as GoalCategory, color: '#3B82F6', emoji: '💻' },
		{ title: 'Hostel / Flat Deposit', amount: 20000, category: 'security_deposit' as GoalCategory, color: '#10B981', emoji: '🏠' },
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
			showSuccessToast('Sinking fund goal created!');
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
			showSuccessToast('Added to sinking fund!');
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
		<div class="toast">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="eyebrow">Milestone Stashing</span>
			<h1 class="page-title">Sinking Funds & Goals</h1>
		</div>
		<button class="add-goal-btn" onclick={() => (showAddModal = true)}>
			<Plus size={18} />
			<span>New Goal</span>
		</button>
	</div>

	<!-- 1. Sinking Funds Macro Overview -->
	<div class="goals-hero-card">
		<div class="hero-top">
			<div>
				<span class="hero-label">Total Sinking Pool</span>
				<div class="hero-amount">{formatCurrency($goalStats.totalSaved)}</div>
			</div>
			<div class="progress-pill">
				<Sparkles size={14} />
				<span><strong>{$goalStats.overallProgress}%</strong> Funded</span>
			</div>
		</div>

		<div class="macro-progress-bar">
			<div class="macro-fill" style="width: {$goalStats.overallProgress}%;"></div>
		</div>

		<div class="hero-footer-stats">
			<span>Target: <strong>{formatCurrency($goalStats.totalTarget)}</strong></span>
			<span>Remaining: <strong>{formatCurrency($goalStats.totalRemaining)}</strong></span>
		</div>
	</div>

	<!-- 2. Fast Preset Goal Accelerators -->
	<div class="presets-section">
		<span class="presets-title">⚡ Fast Preset Sinking Funds</span>
		<div class="preset-cards-grid">
			{#each presets as p}
				<button class="preset-card" onclick={() => applyPreset(p)}>
					<div class="preset-icon" style="background: {p.color}20; color: {p.color};">
						{#if p.category === 'travel'}
							<Palmtree size={18} />
						{:else if p.category === 'tech'}
							<Laptop size={18} />
						{:else if p.category === 'security_deposit'}
							<Home size={18} />
						{:else}
							<Ticket size={18} />
						{/if}
					</div>
					<div class="preset-info">
						<span class="preset-name">{p.title}</span>
						<span class="preset-val">₹{p.amount.toLocaleString('en-IN')}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- 3. Active Goals List & Daily Pacing Simulator -->
	<div class="goals-list-section">
		<h2 class="section-title">Active Sinking Funds ({$goalStats.goalsCount})</h2>

		<div class="goals-stack">
			{#each $goalStats.enrichedGoals as goal (goal.id)}
				<div class="goal-item-card" class:completed={goal.isCompleted}>
					<div class="goal-card-top">
						<div class="goal-meta-col">
							<div class="goal-title-row">
								<h3 class="goal-title">{goal.title}</h3>
								{#if goal.isCompleted}
									<span class="badge-complete">🎉 Achieved</span>
								{/if}
							</div>
							<div class="goal-saved-ratio">
								<strong>{formatCurrency(goal.currentAmount)}</strong> of {formatCurrency(goal.targetAmount)}
							</div>
						</div>

						<div class="goal-pct-badge" style="color: {goal.color || '#7C3AED'};">
							{goal.progressPercent}%
						</div>
					</div>

					<div class="goal-progress-track">
						<div
							class="goal-progress-fill"
							style="width: {goal.progressPercent}%; background: {goal.color || '#7C3AED'};"
						></div>
					</div>

					<!-- Daily & Weekly Pacing Forecast -->
					{#if !goal.isCompleted && goal.targetDate}
						<div class="pacing-forecast-banner">
							<div class="pacing-item">
								<Calendar size={13} class="text-accent" />
								<span><strong>{goal.daysLeft}</strong> days left</span>
							</div>
							<div class="pacing-item">
								<Coins size={13} class="text-accent" />
								<span>Save <strong>{formatCurrency(goal.requiredDailyPaise)}/day</strong> (or {formatCurrency(goal.requiredWeeklyPaise)}/wk)</span>
							</div>
						</div>
					{/if}

					<div class="goal-actions-row">
						{#if !goal.isCompleted}
							<button class="contribute-btn" onclick={() => openContribute(goal)}>
								<PiggyBank size={14} />
								<span>Stash Money</span>
							</button>
						{/if}
						<button class="delete-goal-btn" onclick={() => handleDeleteGoal(goal.id)}>
							<Trash2 size={14} />
						</button>
					</div>
				</div>
			{:else}
				<div class="empty-goals-card">
					<PiggyBank size={36} class="empty-icon" />
					<p>No active goals yet. Create a sinking fund for your next semester trip or tech upgrade!</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Contribute Modal -->
{#if showContributeModal && selectedGoal}
	<div class="modal-backdrop" onclick={() => (showContributeModal = false)} role="button" tabindex="0">
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title">Stash into {selectedGoal.title}</h3>
				<button class="close-btn" onclick={() => (showContributeModal = false)}>✕</button>
			</div>

			<div class="modal-form-stack">
				<div class="quick-stash-chips">
					<button type="button" class="stash-chip" onclick={() => (contributeAmountStr = '100')}>+₹100</button>
					<button type="button" class="stash-chip" onclick={() => (contributeAmountStr = '250')}>+₹250</button>
					<button type="button" class="stash-chip" onclick={() => (contributeAmountStr = '500')}>+₹500</button>
					<button type="button" class="stash-chip" onclick={() => (contributeAmountStr = '1000')}>+₹1,000</button>
				</div>

				<div class="field-col">
					<label for="contrib-amount">Amount to Stash (₹) *</label>
					<input id="contrib-amount" type="number" bind:value={contributeAmountStr} step="1" min="1" />
				</div>

				<div class="field-col">
					<label for="contrib-wallet">Deduct from Wallet</label>
					<select id="contrib-wallet" bind:value={contributeWalletId}>
						{#each $wallets as w}
							<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
						{/each}
					</select>
				</div>

				<div class="field-col">
					<label for="contrib-note">Note / Savings Source</label>
					<input id="contrib-note" type="text" placeholder="e.g. Skipped canteen treat savings" bind:value={contributeNote} />
				</div>

				<div class="modal-actions">
					<button class="secondary-btn" onclick={() => (showContributeModal = false)}>Cancel</button>
					<button class="primary-btn" onclick={handleContribute}>Confirm Stash</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Add Goal Modal -->
{#if showAddModal}
	<div class="modal-backdrop" onclick={() => (showAddModal = false)} role="button" tabindex="0">
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title">Create Sinking Fund</h3>
				<button class="close-btn" onclick={() => (showAddModal = false)}>✕</button>
			</div>

			<div class="modal-form-stack">
				<div class="form-row">
					<div class="field-col flex-2">
						<label for="goal-name">Goal Name *</label>
						<input id="goal-name" type="text" placeholder="e.g. Goa Trip, New iPad" bind:value={formTitle} />
					</div>
					<div class="field-col flex-1">
						<label for="goal-amount">Target (₹) *</label>
						<input id="goal-amount" type="number" placeholder="15000" bind:value={formTargetAmount} step="1" min="1" />
					</div>
				</div>

				<div class="form-row">
					<div class="field-col flex-1">
						<label for="goal-cat">Category</label>
						<select id="goal-cat" bind:value={formCategory}>
							<option value="travel">Semester Road Trip</option>
							<option value="tech">Tech / Gadget Upgrade</option>
							<option value="security_deposit">Flat / PG Security Deposit</option>
							<option value="fest">Concert / Fest Pass</option>
							<option value="academics">Course Certification</option>
							<option value="emergency">Personal Emergency Buffer</option>
						</select>
					</div>
					<div class="field-col flex-1">
						<label for="goal-date">Target Date</label>
						<input id="goal-date" type="date" bind:value={formTargetDate} />
					</div>
				</div>

				<div class="modal-actions">
					<button class="secondary-btn" onclick={() => (showAddModal = false)}>Cancel</button>
					<button class="primary-btn" onclick={handleAddGoal}>Create Goal</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.goals-page {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
		animation: fadeIn 0.4s ease-out;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 20px;
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

	.add-goal-btn {
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 9px 16px;
		border-radius: 9999px;
		font-weight: 700;
		font-size: 0.82rem;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 4px 15px var(--accent-glow);
		cursor: pointer;
	}

	/* Hero Card */
	.goals-hero-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 26px;
		padding: 22px;
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
	}

	.hero-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}

	.hero-label {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.hero-amount {
		font-size: 2.2rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
	}

	.progress-pill {
		background: rgba(124, 58, 237, 0.1);
		color: var(--accent-primary);
		padding: 6px 12px;
		border-radius: 9999px;
		font-size: 0.78rem;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.macro-progress-bar {
		height: 10px;
		border-radius: 9999px;
		background: var(--bg-primary);
		overflow: hidden;
		margin-bottom: 12px;
	}

	.macro-fill {
		height: 100%;
		background: var(--accent-gradient);
		border-radius: 9999px;
		transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.hero-footer-stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
		color: var(--text-secondary);
	}

	/* Preset Fast Chips */
	.presets-section {
		margin-bottom: 24px;
	}

	.presets-title {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 10px;
	}

	.preset-cards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	.preset-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 12px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
		text-align: left;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.preset-card:active {
		transform: scale(0.98);
	}

	.preset-icon {
		width: 36px;
		height: 36px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preset-name {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-primary);
		display: block;
	}

	.preset-val {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	/* Stack */
	.goals-list-section {
		margin-top: 10px;
	}

	.section-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.goals-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.goal-item-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 22px;
		padding: 18px;
		box-shadow: var(--shadow-sm);
	}

	.goal-card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.goal-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.goal-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.badge-complete {
		background: rgba(16, 185, 129, 0.15);
		color: #059669;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.goal-saved-ratio {
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.goal-pct-badge {
		font-size: 1.15rem;
		font-weight: 800;
	}

	.goal-progress-track {
		height: 8px;
		border-radius: 9999px;
		background: var(--bg-primary);
		overflow: hidden;
		margin-bottom: 14px;
	}

	.goal-progress-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.5s ease;
	}

	.pacing-forecast-banner {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 10px 12px;
		border-radius: 14px;
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 14px;
		flex-wrap: wrap;
		gap: 6px;
	}

	.pacing-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.goal-actions-row {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.contribute-btn {
		background: var(--accent-primary);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

	.delete-goal-btn {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--danger);
		padding: 8px 12px;
		border-radius: 12px;
		cursor: pointer;
	}

	.empty-goals-card {
		text-align: center;
		padding: 40px 20px;
		background: var(--bg-card);
		border-radius: 20px;
		border: 1px dashed var(--border-color);
		color: var(--text-muted);
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(5px);
		z-index: 1000;
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
		max-height: 85vh;
		overflow-y: auto;
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.modal-title {
		font-size: 1.15rem;
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

	.modal-form-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.quick-stash-chips {
		display: flex;
		gap: 8px;
	}

	.stash-chip {
		flex: 1;
		padding: 8px;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--accent-primary);
		cursor: pointer;
	}

	.form-row {
		display: flex;
		gap: 10px;
	}

	.field-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.flex-2 { flex: 2; }
	.flex-1 { flex: 1; }

	label {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	input, select {
		padding: 10px 14px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.88rem;
		font-weight: 600;
	}

	input:focus, select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		margin-top: 10px;
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

	.primary-btn {
		flex: 2;
		background: var(--accent-gradient);
		color: white;
		border: none;
		padding: 12px;
		border-radius: 14px;
		font-weight: 800;
		cursor: pointer;
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
