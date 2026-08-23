<script lang="ts">
	import {
		expenses,
		transfers,
		categories,
		wallets,
		studentProfile,
		formatCurrency,
		formatDate
	} from '$lib/stores';
	import type { ValueTag, SatisfactionRating, Expense } from '$lib/types';
	import { calculateHoursOfWork } from '$lib/utils';
	import * as db from '$lib/db';
	import {
		Receipt,
		ArrowRightLeft,
		ArrowDownLeft,
		ArrowUpRight,
		Search,
		Filter,
		Zap,
		Sparkles,
		GraduationCap,
		Clock,
		Flame,
		Smile,
		Meh,
		Frown,
		Trash2,
		X
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	let activeSegment = $state<'all' | 'expense' | 'income' | 'transfer'>('all');
	let activeValueFilter = $state<'all' | 'need' | 'want' | 'growth' | 'regretted'>('all');
	let searchQuery = $state('');

	// Selected transaction for satisfaction rating modal
	let selectedExpense = $state<Expense | null>(null);
	let showSatisfactionModal = $state(false);

	// Merge and process transactions
	let allTransactions = $derived.by(() => {
		const expenseItems = $expenses.map((e) => ({
			...e,
			type: e.categoryId === 'income' ? 'income' : 'expense',
			displayName: e.note || (e.categoryId === 'income' ? 'Income' : 'Expense'),
			walletName: $wallets.find((w) => w.id === e.walletId)?.name
		}));

		const transferItems = $transfers.map((t) => ({
			...t,
			type: 'transfer',
			categoryId: 'transfer',
			displayName: t.note || 'Transfer',
			walletName: `${$wallets.find((w) => w.id === t.fromWalletId)?.name} -> ${$wallets.find((w) => w.id === t.toWalletId)?.name}`
		}));

		// @ts-ignore - Merging types loosely for display
		return [...expenseItems, ...transferItems].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);
	});

	let filteredTransactions = $derived(
		allTransactions.filter((t) => {
			const matchesSegment = activeSegment === 'all' || t.type === activeSegment;
			const matchesSearch =
				searchQuery === '' ||
				t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.amount.toString().includes(searchQuery);

			let matchesValueFilter = true;
			if (activeValueFilter !== 'all') {
				if (activeValueFilter === 'regretted') {
					matchesValueFilter = (t as any).satisfactionRating === 'regretted';
				} else {
					matchesValueFilter = (t as any).valueTag === activeValueFilter;
				}
			}

			return matchesSegment && matchesSearch && matchesValueFilter;
		})
	);

	function getCategoryById(id: string) {
		return $categories.find((c) => c.id === id);
	}

	async function handleUpdateSatisfaction(rating: SatisfactionRating) {
		if (!selectedExpense) return;
		await db.updateExpense(selectedExpense.id, { satisfactionRating: rating });
		const updatedExpenses = await db.getExpenses();
		expenses.set(updatedExpenses);
		showSatisfactionModal = false;
		selectedExpense = null;
	}

	async function handleDeleteExpense(id: string) {
		if (confirm('Delete this transaction?')) {
			await db.deleteExpense(id);
			const updatedExpenses = await db.getExpenses();
			expenses.set(updatedExpenses);
			showSatisfactionModal = false;
		}
	}
</script>

<div class="page-container">
	<div class="header-section">
		<h1 class="page-title">Transactions & Audit</h1>

		<!-- Search Bar -->
		<div class="search-bar">
			<Search size={18} class="search-input-icon" />
			<input type="text" placeholder="Search transactions, notes, items..." bind:value={searchQuery} />
		</div>

		<!-- Segment Control -->
		<div class="segment-control">
			<button
				class="segment-btn"
				class:active={activeSegment === 'all'}
				onclick={() => (activeSegment = 'all')}
			>
				All
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'expense'}
				onclick={() => (activeSegment = 'expense')}
			>
				Expense
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'income'}
				onclick={() => (activeSegment = 'income')}
			>
				Income
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'transfer'}
				onclick={() => (activeSegment = 'transfer')}
			>
				Transfer
			</button>
		</div>

		<!-- Value Tag Filter Pills (for Mindful Spending Review) -->
		{#if activeSegment === 'all' || activeSegment === 'expense'}
			<div class="value-filter-chips">
				<button
					class="v-chip"
					class:active={activeValueFilter === 'all'}
					onclick={() => (activeValueFilter = 'all')}
				>
					All Tags
				</button>
				<button
					class="v-chip chip-need"
					class:active={activeValueFilter === 'need'}
					onclick={() => (activeValueFilter = 'need')}
				>
					⚡ Needs
				</button>
				<button
					class="v-chip chip-want"
					class:active={activeValueFilter === 'want'}
					onclick={() => (activeValueFilter = 'want')}
				>
					✨ Wants
				</button>
				<button
					class="v-chip chip-growth"
					class:active={activeValueFilter === 'growth'}
					onclick={() => (activeValueFilter = 'growth')}
				>
					📚 Growth
				</button>
				<button
					class="v-chip chip-regret"
					class:active={activeValueFilter === 'regretted'}
					onclick={() => (activeValueFilter = 'regretted')}
				>
					💀 Regretted
				</button>
			</div>
		{/if}
	</div>

	<div class="transactions-list">
		{#each filteredTransactions as transaction (transaction.id)}
			{@const isExpense = transaction.type === 'expense'}
			{@const isIncome = transaction.type === 'income'}
			{@const isTransfer = transaction.type === 'transfer'}
			{@const category = getCategoryById(transaction.categoryId)}
			{@const exp = isExpense ? (transaction as unknown as Expense) : null}

			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="transaction-card"
				onclick={() => {
					if (isExpense && exp) {
						selectedExpense = exp;
						showSatisfactionModal = true;
					}
				}}
			>
				<div class="icon-wrapper" class:income={isIncome} class:transfer={isTransfer}>
					{#if isTransfer}
						<ArrowRightLeft size={20} />
					{:else if isIncome}
						<ArrowDownLeft size={20} />
					{:else}
						<CategoryIcon icon={category?.icon || 'Receipt'} size={20} />
					{/if}
				</div>

				<div class="details">
					<div class="title-row">
						<span class="title">
							{#if isTransfer}
								Transfer
							{:else}
								{category?.name || (isIncome ? 'Income' : 'General')}
							{/if}
						</span>
						{#if isExpense && exp}
							<div class="tag-badges-row">
								{#if exp.valueTag}
									<span class="tag-pill tag-{exp.valueTag}">
										{exp.valueTag === 'need' ? '⚡ Need' : exp.valueTag === 'want' ? '✨ Want' : '📚 Growth'}
									</span>
								{/if}
								{#if exp.satisfactionRating === 'worth_it'}
									<span class="tag-pill tag-worth">🔥 Worth It</span>
								{:else if exp.satisfactionRating === 'regretted'}
									<span class="tag-pill tag-regret">💀 Regret</span>
								{/if}
							</div>
						{/if}
					</div>

					<div class="subtitle">
						{transaction.displayName} • {formatDate(transaction.date)}
					</div>

					{#if isExpense}
						<div class="time-cost-sub">
							<Clock size={11} />
							<span>{calculateHoursOfWork(transaction.amount, $studentProfile.hourlyWageRate)} of work</span>
						</div>
					{/if}
				</div>

				<div class="amount" class:positive={isIncome} class:neutral={isTransfer}>
					{isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<p>No transactions found matching criteria.</p>
			</div>
		{/each}
	</div>
</div>

<!-- Satisfaction Audit Modal -->
{#if showSatisfactionModal && selectedExpense}
	<div
		class="modal-backdrop"
		onclick={() => (showSatisfactionModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showSatisfactionModal = false)}
	>
		<div class="modal-sheet" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title">Spend Satisfaction Check</h3>
				<button class="close-btn" onclick={() => (showSatisfactionModal = false)}>✕</button>
			</div>

			<div class="audit-item-info">
				<div class="audit-item-note">{selectedExpense.note || 'Expense'}</div>
				<div class="audit-item-amount">{formatCurrency(selectedExpense.amount)}</div>
				<div class="audit-item-meta">
					Logged on {formatDate(selectedExpense.date)} • Cost: {calculateHoursOfWork(selectedExpense.amount, $studentProfile.hourlyWageRate)} of work
				</div>
			</div>

			<p class="audit-question">Looking back, was this purchase genuinely worth it?</p>

			<div class="satisfaction-grid">
				<button
					class="satisfaction-btn btn-worth"
					class:selected={selectedExpense.satisfactionRating === 'worth_it'}
					onclick={() => handleUpdateSatisfaction('worth_it')}
				>
					<span class="emoji">🔥</span>
					<strong>Worth It</strong>
					<span class="sub">No regrets, loved it</span>
				</button>

				<button
					class="satisfaction-btn btn-neutral"
					class:selected={selectedExpense.satisfactionRating === 'neutral'}
					onclick={() => handleUpdateSatisfaction('neutral')}
				>
					<span class="emoji">😐</span>
					<strong>Neutral</strong>
					<span class="sub">Routine necessity</span>
				</button>

				<button
					class="satisfaction-btn btn-regret"
					class:selected={selectedExpense.satisfactionRating === 'regretted'}
					onclick={() => handleUpdateSatisfaction('regretted')}
				>
					<span class="emoji">💀</span>
					<strong>Regretted</strong>
					<span class="sub">Impulse / peer pressure</span>
				</button>
			</div>

			<div class="modal-actions-row">
				<button class="delete-btn" onclick={() => handleDeleteExpense(selectedExpense!.id)}>
					<Trash2 size={16} />
					<span>Delete Transaction</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		max-width: 620px;
		margin: 0 auto;
		padding: 0 16px 120px 16px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.header-section {
		margin-bottom: 20px;
		padding-top: 8px;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 800;
		margin-bottom: 16px;
		color: var(--text-primary);
	}

	.search-bar {
		position: relative;
		margin-bottom: 14px;
	}

	.search-input-icon {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}

	.search-bar input {
		width: 100%;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		padding: 12px 14px 12px 42px;
		border-radius: 16px;
		font-size: 0.92rem;
		color: var(--text-primary);
		transition: all 0.2s;
	}

	.search-bar input:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}

	.segment-control {
		display: flex;
		background: var(--bg-card);
		padding: 4px;
		border-radius: 16px;
		border: 1px solid var(--border-color);
		margin-bottom: 12px;
	}

	.segment-btn {
		flex: 1;
		padding: 8px;
		text-align: center;
		border-radius: 12px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-muted);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.segment-btn.active {
		background: var(--accent-primary);
		color: white;
		box-shadow: 0 4px 12px var(--accent-glow);
		font-weight: 700;
	}

	.value-filter-chips {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.v-chip {
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		color: var(--text-muted);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.v-chip.active {
		background: var(--text-primary);
		color: var(--bg-primary);
		border-color: var(--text-primary);
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.transaction-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 20px;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		gap: 14px;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.transaction-card:active {
		transform: scale(0.98);
	}

	.icon-wrapper {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		background: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-primary);
	}

	.icon-wrapper.income {
		background: rgba(16, 185, 129, 0.12);
		color: #10B981;
	}

	.icon-wrapper.transfer {
		background: rgba(124, 58, 237, 0.12);
		color: #7C3AED;
	}

	.details {
		flex: 1;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
		flex-wrap: wrap;
	}

	.title {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	.tag-badges-row {
		display: flex;
		gap: 4px;
	}

	.tag-pill {
		padding: 2px 7px;
		border-radius: 9999px;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.tag-need { background: rgba(37, 99, 235, 0.12); color: #2563EB; }
	.tag-want { background: rgba(219, 39, 119, 0.12); color: #DB2777; }
	.tag-growth { background: rgba(5, 150, 105, 0.12); color: #059669; }
	.tag-worth { background: rgba(245, 158, 11, 0.15); color: #D97706; }
	.tag-regret { background: rgba(255, 51, 102, 0.15); color: #FF3366; }

	.subtitle {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.time-cost-sub {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		color: var(--accent-primary);
		font-weight: 600;
		margin-top: 2px;
	}

	.amount {
		font-weight: 800;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.amount.positive {
		color: var(--success, #10B981);
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: var(--text-muted);
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
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
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

	.audit-item-info {
		background: var(--bg-primary);
		padding: 14px;
		border-radius: 18px;
		border: 1px solid var(--border-color);
		margin-bottom: 16px;
	}

	.audit-item-note {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.audit-item-amount {
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--accent-primary);
		margin: 2px 0;
	}

	.audit-item-meta {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.audit-question {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.satisfaction-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 20px;
	}

	.satisfaction-btn {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 12px 8px;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.satisfaction-btn .emoji {
		font-size: 1.5rem;
	}

	.satisfaction-btn strong {
		font-size: 0.82rem;
		color: var(--text-primary);
	}

	.satisfaction-btn .sub {
		font-size: 0.65rem;
		color: var(--text-muted);
		text-align: center;
	}

	.btn-worth.selected {
		border-color: #F59E0B;
		background: rgba(245, 158, 11, 0.12);
	}

	.btn-neutral.selected {
		border-color: var(--accent-primary);
		background: rgba(124, 58, 237, 0.12);
	}

	.btn-regret.selected {
		border-color: #FF3366;
		background: rgba(255, 51, 102, 0.12);
	}

	.modal-actions-row {
		display: flex;
		justify-content: flex-end;
	}

	.delete-btn {
		background: transparent;
		border: none;
		color: var(--danger, #FF3366);
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
