<script lang="ts">
	import {
		subscriptions,
		subscriptionStats,
		studentProfile,
		wallets,
		categories,
		addExpense,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import type { Subscription, SubscriptionCycle } from '$lib/types';
	import {
		Radio,
		Calendar,
		Plus,
		Trash2,
		X,
		Check,
		Flame,
		Smartphone,
		RefreshCw
	} from 'lucide-svelte';

	let showAddModal = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	let formName = $state('');
	let formAmount = $state('');
	let formCycle = $state<SubscriptionCycle>('monthly');
	let formNextDate = $state(new Date().toISOString().split('T')[0]);
	let formWalletId = $state($wallets[0]?.id || '');
	let formCategoryId = $state($categories[0]?.id || '');
	let formIsEssential = $state(false);

	let dailyHabitCost = $state(30);
	let habitName = $state('Campus Chai / Coffee');

	let habitMonthly = $derived(Math.round(dailyHabitCost * 30.4));
	let habitAnnual = $derived(Math.round(dailyHabitCost * 365));
	let habitCollegeYears = $derived(Math.round(dailyHabitCost * 365 * 4));

	let leakageRatio = $derived(
		$studentProfile.monthlyAllowance > 0
			? Math.round(($subscriptionStats.monthlyTotal / $studentProfile.monthlyAllowance) * 100)
			: 0
	);

	function setPresetHabit(name: string, cost: number) {
		habitName = name;
		dailyHabitCost = cost;
	}

	async function handleAddSubscription() {
		const amount = parseFloat(formAmount);
		if (!formName.trim() || isNaN(amount) || amount <= 0) {
			showToastMessage('Please enter a valid name and amount');
			return;
		}

		try {
			await subscriptions.add({
				name: formName.trim(),
				amount: Math.round(amount * 100),
				billingCycle: formCycle,
				nextRenewalDate: formNextDate,
				walletId: formWalletId || $wallets[0]?.id,
				categoryId: formCategoryId || $categories[0]?.id,
				isEssential: formIsEssential,
				active: true
			});

			formName = '';
			formAmount = '';
			showAddModal = false;
			showToastMessage('Subscription added to radar! 📡');
		} catch (err) {
			console.error('Failed to add subscription:', err);
		}
	}

	async function handleDeleteSub(id: string) {
		if (confirm('Remove this subscription?')) {
			await subscriptions.delete(id);
			showToastMessage('Subscription removed');
		}
	}

	async function handleQuickLogExpense(sub: Subscription) {
		try {
			await addExpense({
				walletId: sub.walletId || $wallets[0]?.id,
				categoryId: sub.categoryId || 'cat-subscriptions',
				subcategory: 'Subscription',
				amount: sub.amount,
				date: new Date().toISOString(),
				note: `${sub.name} (Recurring Renewal)`,
				valueTag: sub.isEssential ? 'need' : 'want',
				isRecurring: true,
				subscriptionId: sub.id
			});
			showToastMessage(`Logged ${sub.name} renewal to expenses! ⚡`);
		} catch (err) {
			console.error('Failed to log renewal:', err);
		}
	}

	function getDaysUntilRenewal(dateStr: string): number {
		const target = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		target.setHours(0, 0, 0, 0);
		return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}

	function showToastMessage(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => (showToast = false), 3000);
	}
</script>

<div class="subs-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="campus-sub">Recurring Drain Audit</span>
			<h1 class="page-title">Subscriptions Radar</h1>
		</div>
		<button class="add-sub-btn" onclick={() => (showAddModal = true)}>
			<Plus size={16} />
			<span>Add Sub</span>
		</button>
	</div>

	<!-- Monthly Recurring Drain Hero -->
	<div class="card drain-hero-card">
		<div class="hero-top-row">
			<div>
				<span class="hero-label">Monthly Auto-Debit Drain</span>
				<div class="hero-amount tabular">{formatCurrency($subscriptionStats.monthlyTotal)}<small>/ mo</small></div>
			</div>
			<div class="ratio-pill" class:ratio-warn={leakageRatio > 25}>
				<Radio size={14} color="var(--accent-primary)" />
				<span><strong class="tabular">{leakageRatio}%</strong> of allowance</span>
			</div>
		</div>

		<div class="drain-sub-grid">
			<div class="drain-stat-col">
				<span class="d-stat-lbl">Annualized Drain</span>
				<span class="d-stat-val tabular">{formatCurrency($subscriptionStats.annualTotal)}/yr</span>
			</div>
			<div class="drain-stat-col">
				<span class="d-stat-lbl">Essential vs Fun</span>
				<span class="d-stat-val tabular">{formatCurrency($subscriptionStats.essentialMonthly)} / {formatCurrency($subscriptionStats.discretionaryMonthly)}</span>
			</div>
			<div class="drain-stat-col">
				<span class="d-stat-lbl">Active Services</span>
				<span class="d-stat-val tabular">{$subscriptionStats.count} subs</span>
			</div>
		</div>
	</div>

	<!-- Micro-Habit Compounding Calculator -->
	<div class="card habit-calc-card">
		<div class="calc-header-row">
			<div class="calc-title-wrap">
				<Flame size={18} color="#F59E0B" />
				<h3 class="calc-heading">Micro-Habit Compounding Radar</h3>
			</div>
			<span class="calc-badge">Silent Campus Drain</span>
		</div>
		<p class="calc-desc">Small daily habits compound into massive college fortunes:</p>

		<!-- Habit Presets -->
		<div class="habit-chips-row">
			<button class="habit-chip" class:active={dailyHabitCost === 20} onclick={() => setPresetHabit('Canteen Chai', 20)}>
				☕ Chai (₹20/d)
			</button>
			<button class="habit-chip" class:active={dailyHabitCost === 60} onclick={() => setPresetHabit('Iced Latte / Boba', 60)}>
				🧋 Boba (₹60/d)
			</button>
			<button class="habit-chip" class:active={dailyHabitCost === 120} onclick={() => setPresetHabit('Late Swiggy Snack', 120)}>
				🍟 Swiggy (₹120/d)
			</button>
			<button class="habit-chip" class:active={dailyHabitCost === 80} onclick={() => setPresetHabit('Vape / Puff', 80)}>
				💨 Vape (₹80/d)
			</button>
		</div>

		<!-- Daily Slider -->
		<div class="habit-slider-container">
			<div class="slider-val-line">
				<span>Daily Cost:</span>
				<strong class="tabular">₹{dailyHabitCost}/day</strong>
			</div>
			<input type="range" min="10" max="300" step="5" bind:value={dailyHabitCost} class="range-slider" />
		</div>

		<!-- 3 Horizon Cards -->
		<div class="horizon-cards-grid">
			<div class="horizon-card">
				<span class="h-time">1 Month</span>
				<span class="h-amount tabular">₹{habitMonthly.toLocaleString('en-IN')}</span>
				<span class="h-sub">1 textbook</span>
			</div>
			<div class="horizon-card">
				<span class="h-time">1 Year</span>
				<span class="h-amount text-warning tabular">₹{habitAnnual.toLocaleString('en-IN')}</span>
				<span class="h-sub">1 Goa road trip</span>
			</div>
			<div class="horizon-card highlight">
				<span class="h-time">4-Year Degree</span>
				<span class="h-amount text-danger tabular">₹{habitCollegeYears.toLocaleString('en-IN')}</span>
				<span class="h-sub">New MacBook / Bike!</span>
			</div>
		</div>
	</div>

	<!-- Active Subscriptions List -->
	<div class="card subs-ledger-card">
		<h2 class="card-heading">Active Subscriptions ({$subscriptionStats.count})</h2>

		<div class="subs-grid-list">
			{#each $subscriptions as sub (sub.id)}
				{@const days = getDaysUntilRenewal(sub.nextRenewalDate)}
				<div class="sub-item-card">
					<div class="sub-card-header">
						<div class="sub-identity-group">
							<div class="sub-icon-badge">
								<Smartphone size={16} color="var(--accent-primary)" />
							</div>
							<div>
								<h3 class="sub-name">{sub.name}</h3>
								<span class="sub-cycle-lbl">{sub.billingCycle} • {sub.isEssential ? '⚡ Essential' : '✨ Discretionary'}</span>
							</div>
						</div>

						<div class="sub-cost-val tabular">
							{formatCurrency(sub.amount)}
						</div>
					</div>

					<div class="sub-footer-line">
						<div class="renewal-countdown" class:soon={days <= 3}>
							<Calendar size={12} />
							<span>{days > 0 ? `Renews in ${days} days` : days === 0 ? 'Renews today!' : 'Overdue for renewal'}</span>
						</div>

						<div class="sub-actions-row">
							<button class="quick-log-renewal-btn" title="Log this renewal into expenses" onclick={() => handleQuickLogExpense(sub)}>
								<RefreshCw size={12} />
								<span>Log Bill</span>
							</button>
							<button class="delete-sub-btn" onclick={() => handleDeleteSub(sub.id)} aria-label="Delete subscription">
								<Trash2 size={13} />
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="empty-subs">
					<Radio size={32} color="var(--text-muted)" />
					<p>No active subscriptions tracked yet.</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Add Subscription Bottom Sheet -->
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
				<h3>Add Subscription to Radar</h3>
				<button class="close-btn" onclick={() => (showAddModal = false)}>✕</button>
			</div>

			<div class="form-group-custom">
				<label for="sub-n">Service / Subscription Name</label>
				<input id="sub-n" type="text" placeholder="Spotify, Netflix, Hostel WiFi..." bind:value={formName} />
			</div>

			<div class="form-group-custom">
				<label for="sub-a">Renewal Cost (₹)</label>
				<input id="sub-a" type="number" placeholder="179" bind:value={formAmount} class="tabular" />
			</div>

			<div class="form-group-custom">
				<label for="sub-c">Billing Cycle</label>
				<select id="sub-c" bind:value={formCycle}>
					<option value="monthly">Monthly</option>
					<option value="quarterly">Quarterly</option>
					<option value="annual">Annual</option>
					<option value="weekly">Weekly</option>
				</select>
			</div>

			<div class="form-group-custom">
				<label for="sub-d">Next Renewal Date</label>
				<input id="sub-d" type="date" bind:value={formNextDate} />
			</div>

			<label class="essential-check-label">
				<input type="checkbox" bind:checked={formIsEssential} />
				<span>Essential necessity (e.g. WiFi, SIM Plan)</span>
			</label>

			<button class="primary-btn-full" onclick={handleAddSubscription}>
				Activate on Radar
			</button>
		</div>
	</div>
{/if}

<style>
	.subs-page {
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

	.add-sub-btn {
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
	}

	/* Drain Hero Card */
	.drain-hero-card {
		padding: 1.35rem;
		background: linear-gradient(135deg, var(--bg-card) 0%, var(--surface-2) 100%);
	}

	.hero-top-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.15rem;
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

	.hero-amount small {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.ratio-pill {
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

	.ratio-warn {
		border-color: var(--danger-border);
		color: var(--danger);
	}

	.drain-sub-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.65rem;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.85rem;
	}

	.drain-stat-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.d-stat-lbl {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.d-stat-val {
		font-size: 0.84rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Habit Calculator */
	.habit-calc-card {
		padding: 1.35rem;
	}

	.calc-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.35rem;
	}

	.calc-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.calc-heading {
		font-size: 0.98rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.calc-badge {
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: rgba(245, 158, 11, 0.15);
		color: #F59E0B;
		padding: 2px 6px;
		border-radius: var(--border-radius-pill);
	}

	.calc-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.habit-chips-row {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 4px;
		margin-bottom: 0.85rem;
	}

	.habit-chip {
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.habit-chip.active {
		background: var(--text-primary);
		color: var(--bg-primary);
		border-color: var(--text-primary);
	}

	.habit-slider-container {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-subtle);
		margin-bottom: 0.85rem;
	}

	.slider-val-line {
		display: flex;
		justify-content: space-between;
		font-size: 0.78rem;
		margin-bottom: 0.35rem;
	}

	.range-slider {
		width: 100%;
		accent-color: var(--accent-primary);
	}

	.horizon-cards-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.horizon-card {
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-sm);
		padding: 0.65rem 0.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.horizon-card.highlight {
		border-color: var(--danger-border);
		background: rgba(244, 63, 94, 0.05);
	}

	.h-time {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.h-amount {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.h-sub {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	/* Subs Ledger */
	.subs-ledger-card {
		padding: 1.35rem;
	}

	.card-heading {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.subs-grid-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sub-item-card {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 0.95rem;
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.sub-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sub-identity-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sub-icon-badge {
		width: 34px;
		height: 34px;
		border-radius: var(--border-radius-xs);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sub-name {
		font-size: 0.92rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.sub-cycle-lbl {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.sub-cost-val {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.sub-footer-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.5rem;
	}

	.renewal-countdown {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.renewal-countdown.soon {
		color: var(--warning);
		font-weight: 700;
	}

	.sub-actions-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.quick-log-renewal-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.25rem 0.55rem;
		border-radius: var(--border-radius-pill);
	}

	.delete-sub-btn {
		color: var(--text-muted);
		background: transparent;
		padding: 3px;
	}

	.delete-sub-btn:hover {
		color: var(--danger);
	}

	.empty-subs {
		text-align: center;
		padding: 2.5rem 1rem;
		color: var(--text-muted);
		font-size: 0.84rem;
	}

	/* Sheet */
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
		font-size: 0.76rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
	}

	.essential-check-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		color: var(--text-primary);
		cursor: pointer;
		margin-bottom: 1rem;
		text-transform: none;
		letter-spacing: normal;
	}

	.essential-check-label input {
		width: 16px;
		height: 16px;
		min-height: auto;
	}

	.primary-btn-full {
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
