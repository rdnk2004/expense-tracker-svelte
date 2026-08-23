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
		AlertCircle,
		ShieldCheck,
		Sparkles,
		Flame,
		Coffee,
		Zap,
		TrendingUp,
		Clock,
		Smartphone
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	let showAddModal = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');

	// Add Form State
	let formName = $state('');
	let formAmount = $state('');
	let formCycle = $state<SubscriptionCycle>('monthly');
	let formNextDate = $state(new Date().toISOString().split('T')[0]);
	let formWalletId = $state($wallets[0]?.id || '');
	let formCategoryId = $state($categories[0]?.id || '');
	let formIsEssential = $state(false);

	// Micro-Habit Calculator State
	let dailyHabitCost = $state(30); // ₹30/day default (chai/coffee)
	let habitName = $state('Campus Chai / Coffee');

	let habitMonthly = $derived(Math.round(dailyHabitCost * 30.4));
	let habitAnnual = $derived(Math.round(dailyHabitCost * 365));
	let habitCollegeYears = $derived(Math.round(dailyHabitCost * 365 * 4));

	// Leakage vs Allowance Ratio
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
			showSuccessToast('Please enter a valid subscription name and amount');
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
			showSuccessToast('Subscription added to radar!');
		} catch (err) {
			console.error('Failed to add subscription:', err);
		}
	}

	async function handleDeleteSub(id: string) {
		if (confirm('Remove this subscription?')) {
			await subscriptions.delete(id);
			showSuccessToast('Subscription removed');
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
			showSuccessToast(`Logged ${sub.name} renewal to expenses!`);
		} catch (err) {
			console.error('Failed to log renewal:', err);
		}
	}

	function getDaysUntilRenewal(dateStr: string): number {
		const target = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		target.setHours(0, 0, 0, 0);
		const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		return diff;
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<div class="subscriptions-page">
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="eyebrow">Recurring Drain Audit</span>
			<h1 class="page-title">Subscriptions Radar</h1>
		</div>
		<button class="add-sub-btn" onclick={() => (showAddModal = true)}>
			<Plus size={18} />
			<span>Add Sub</span>
		</button>
	</div>

	<!-- 1. Recurring Leakage Hero Metric -->
	<div class="leakage-hero-card">
		<div class="hero-top">
			<div>
				<span class="leakage-label">Monthly Auto-Debit Drain</span>
				<div class="leakage-amount">{formatCurrency($subscriptionStats.monthlyTotal)}<span class="sub-freq">/ mo</span></div>
			</div>
			<div class="ratio-pill" class:ratio-warn={leakageRatio > 25}>
				<Radio size={14} class="pulse-icon" />
				<span><strong>{leakageRatio}%</strong> of allowance</span>
			</div>
		</div>

		<div class="leakage-sub-grid">
			<div class="sub-col">
				<span class="col-lbl">Annualized Drain</span>
				<span class="col-val">{formatCurrency($subscriptionStats.annualTotal)}/yr</span>
			</div>
			<div class="sub-col">
				<span class="col-lbl">Essential vs Fun</span>
				<span class="col-val">{formatCurrency($subscriptionStats.essentialMonthly)} / {formatCurrency($subscriptionStats.discretionaryMonthly)}</span>
			</div>
			<div class="sub-col">
				<span class="col-lbl">Active Subs</span>
				<span class="col-val">{$subscriptionStats.count} services</span>
			</div>
		</div>
	</div>

	<!-- 2. Micro-Habit Compounding Multiplier Calculator -->
	<div class="habit-calculator-card">
		<div class="calc-header">
			<div class="calc-title-wrap">
				<Flame size={20} class="text-accent" />
				<h3 class="calc-title">Micro-Habit Compounding Radar</h3>
			</div>
			<span class="calc-tag">The Hidden Drain</span>
		</div>
		<p class="calc-desc">Small daily campus habits seem harmless, but silently compound into massive fortunes:</p>

		<!-- Preset Habit Buttons -->
		<div class="preset-chips">
			<button class="preset-chip" class:active={dailyHabitCost === 20} onclick={() => setPresetHabit('Canteen Chai', 20)}>
				☕ Chai (₹20/d)
			</button>
			<button class="preset-chip" class:active={dailyHabitCost === 60} onclick={() => setPresetHabit('Iced Latte / Boba', 60)}>
				🧋 Boba (₹60/d)
			</button>
			<button class="preset-chip" class:active={dailyHabitCost === 120} onclick={() => setPresetHabit('Late Swiggy Snack', 120)}>
				🍟 Swiggy (₹120/d)
			</button>
			<button class="preset-chip" class:active={dailyHabitCost === 80} onclick={() => setPresetHabit('Vape / Smoking', 80)}>
				💨 Vape (₹80/d)
			</button>
		</div>

		<!-- Interactive Custom Amount Slider -->
		<div class="habit-slider-row">
			<div class="slider-info">
				<span>Daily Cost:</span>
				<strong>₹{dailyHabitCost}/day</strong>
			</div>
			<input type="range" min="10" max="300" step="5" bind:value={dailyHabitCost} />
		</div>

		<!-- Compounding Projection Cards -->
		<div class="compound-results-grid">
			<div class="res-card">
				<span class="res-time">1 Month</span>
				<span class="res-amount">₹{habitMonthly.toLocaleString('en-IN')}</span>
				<span class="res-sub">1 good textbook</span>
			</div>
			<div class="res-card">
				<span class="res-time">1 Year</span>
				<span class="res-amount text-warning">₹{habitAnnual.toLocaleString('en-IN')}</span>
				<span class="res-sub">1 Goa road trip</span>
			</div>
			<div class="res-card highlight">
				<span class="res-time">4-Year Degree</span>
				<span class="res-amount text-danger">₹{habitCollegeYears.toLocaleString('en-IN')}</span>
				<span class="res-sub">1 New MacBook / Bike!</span>
			</div>
		</div>
	</div>

	<!-- 3. Active Subscriptions List -->
	<div class="subs-section">
		<h2 class="section-title">Active Subscriptions ({$subscriptionStats.count})</h2>

		<div class="subs-grid">
			{#each $subscriptions as sub (sub.id)}
				{@const days = getDaysUntilRenewal(sub.nextRenewalDate)}
				{@const cat = $categories.find(c => c.id === sub.categoryId)}
				<div class="sub-card-item" class:inactive={!sub.active}>
					<div class="sub-card-top">
						<div class="sub-info-col">
							<div class="sub-icon-badge">
								<Smartphone size={20} />
							</div>
							<div>
								<div class="sub-name">{sub.name}</div>
								<div class="sub-cycle-text">{sub.billingCycle} • {sub.isEssential ? '🛡️ Essential' : '✨ Nice-to-have'}</div>
							</div>
						</div>

						<div class="sub-amount-col">
							<div class="sub-price">{formatCurrency(sub.amount)}</div>
							<div class="sub-renewal-pill" class:due-soon={days <= 3 && days >= 0} class:overdue={days < 0}>
								<Calendar size={12} />
								{#if days < 0}
									<span>Passed ({Math.abs(days)}d ago)</span>
								{:else if days === 0}
									<span>Renews Today!</span>
								{:else}
									<span>Renews in {days}d</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="sub-card-actions">
						<button class="sub-action-btn log" onclick={() => handleQuickLogExpense(sub)}>
							<Check size={13} />
							<span>Auto-Log Expense</span>
						</button>
						<button class="sub-action-btn del" onclick={() => handleDeleteSub(sub.id)}>
							<Trash2 size={13} />
						</button>
					</div>
				</div>
			{:else}
				<div class="empty-subs-card">
					<Radio size={32} class="empty-icon" />
					<p>No active subscriptions tracked. Keep your fixed leaks near zero!</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Add Subscription Modal -->
{#if showAddModal}
	<div class="modal-backdrop" onclick={() => (showAddModal = false)} role="button" tabindex="0">
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title">Track Recurring Subscription</h3>
				<button class="close-btn" onclick={() => (showAddModal = false)}>✕</button>
			</div>

			<div class="modal-form-stack">
				<div class="form-row">
					<div class="field-col flex-2">
						<label for="sub-name">Service / App Name *</label>
						<input id="sub-name" type="text" placeholder="e.g. Spotify Student, Netflix, WiFi" bind:value={formName} />
					</div>
					<div class="field-col flex-1">
						<label for="sub-amount">Amount (₹) *</label>
						<input id="sub-amount" type="number" placeholder="149" bind:value={formAmount} step="1" min="0" />
					</div>
				</div>

				<div class="form-row">
					<div class="field-col flex-1">
						<label for="sub-cycle">Billing Frequency</label>
						<select id="sub-cycle" bind:value={formCycle}>
							<option value="monthly">Monthly</option>
							<option value="quarterly">Quarterly (3 Mo)</option>
							<option value="annual">Annual (12 Mo)</option>
							<option value="weekly">Weekly</option>
						</select>
					</div>
					<div class="field-col flex-1">
						<label for="sub-date">Next Renewal Date</label>
						<input id="sub-date" type="date" bind:value={formNextDate} />
					</div>
				</div>

				<div class="form-row">
					<div class="field-col flex-1">
						<label for="sub-wallet">Auto-Debit Wallet</label>
						<select id="sub-wallet" bind:value={formWalletId}>
							{#each $wallets as w}
								<option value={w.id}>{w.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<label class="checkbox-row">
					<input type="checkbox" bind:checked={formIsEssential} />
					<span>This is an Essential requirement (e.g. WiFi, Phone SIM, Course)</span>
				</label>

				<div class="modal-actions">
					<button class="secondary-btn" onclick={() => (showAddModal = false)}>Cancel</button>
					<button class="primary-btn" onclick={handleAddSubscription}>Save to Radar</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.subscriptions-page {
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

	.add-sub-btn {
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

	/* Leakage Hero Card */
	.leakage-hero-card {
		background: var(--hero-gradient);
		border-radius: 26px;
		padding: 22px;
		color: white;
		margin-bottom: 20px;
		box-shadow: 0 15px 35px rgba(31, 38, 135, 0.3);
	}

	.hero-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 18px;
	}

	.leakage-label {
		font-size: 0.78rem;
		font-weight: 600;
		opacity: 0.8;
		text-transform: uppercase;
	}

	.leakage-amount {
		font-size: 2.2rem;
		font-weight: 800;
		letter-spacing: -0.5px;
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.sub-freq {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.ratio-pill {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 6px 12px;
		border-radius: 9999px;
		font-size: 0.76rem;
		display: flex;
		align-items: center;
		gap: 6px;
		backdrop-filter: blur(10px);
	}

	.ratio-warn {
		background: rgba(255, 51, 102, 0.25);
		border-color: #FF3366;
	}

	.leakage-sub-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		padding-top: 14px;
	}

	.sub-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.col-lbl {
		font-size: 0.7rem;
		opacity: 0.75;
		text-transform: uppercase;
	}

	.col-val {
		font-size: 0.92rem;
		font-weight: 700;
	}

	/* Habit Calculator */
	.habit-calculator-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 20px;
		margin-bottom: 24px;
		box-shadow: var(--shadow-sm);
	}

	.calc-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.calc-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.calc-title {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.calc-tag {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 9999px;
		background: rgba(245, 158, 11, 0.12);
		color: #D97706;
	}

	.calc-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 14px;
	}

	.preset-chips {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 6px;
		margin-bottom: 14px;
	}

	.preset-chip {
		padding: 6px 12px;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
		background: var(--bg-primary);
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-secondary);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.preset-chip.active {
		background: var(--accent-primary);
		color: white;
		border-color: var(--accent-primary);
	}

	.habit-slider-row {
		background: var(--bg-primary);
		padding: 12px 14px;
		border-radius: 16px;
		border: 1px solid var(--border-color);
		margin-bottom: 14px;
	}

	.slider-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		margin-bottom: 6px;
		color: var(--text-primary);
	}

	.habit-slider-row input[type='range'] {
		width: 100%;
		accent-color: var(--accent-primary);
	}

	.compound-results-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.res-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 10px;
		border-radius: 14px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.res-card.highlight {
		border-color: var(--accent-primary);
		background: rgba(124, 58, 237, 0.06);
	}

	.res-time {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.res-amount {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.res-sub {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	/* Subs List */
	.subs-section {
		margin-top: 10px;
	}

	.section-title {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.subs-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.sub-card-item {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 16px;
		box-shadow: var(--shadow-sm);
	}

	.sub-card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.sub-info-col {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.sub-icon-badge {
		width: 42px;
		height: 42px;
		border-radius: 14px;
		background: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-primary);
	}

	.sub-name {
		font-weight: 800;
		font-size: 0.98rem;
		color: var(--text-primary);
	}

	.sub-cycle-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: capitalize;
	}

	.sub-amount-col {
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.sub-price {
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--text-primary);
	}

	.sub-renewal-pill {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 9999px;
		background: var(--bg-primary);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.sub-renewal-pill.due-soon {
		background: rgba(245, 158, 11, 0.15);
		color: #D97706;
	}

	.sub-renewal-pill.overdue {
		background: rgba(255, 51, 102, 0.15);
		color: #FF3366;
	}

	.sub-card-actions {
		display: flex;
		gap: 8px;
		border-top: 1px solid var(--border-color);
		padding-top: 10px;
		justify-content: flex-end;
	}

	.sub-action-btn {
		padding: 6px 12px;
		border-radius: 10px;
		font-size: 0.74rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.sub-action-btn.log {
		background: var(--accent-primary);
		color: white;
		border: none;
	}

	.sub-action-btn.del {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--danger);
	}

	.empty-subs-card {
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

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		color: var(--text-secondary);
		cursor: pointer;
		font-weight: 600;
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
