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
		Trash2,
		X
	} from 'lucide-svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	let activeSegment = $state<'all' | 'expense' | 'income' | 'transfer'>('all');
	let activeValueFilter = $state<'all' | 'need' | 'want' | 'growth' | 'regretted'>('all');
	let searchQuery = $state('');

	let selectedExpense = $state<Expense | null>(null);
	let showSatisfactionModal = $state(false);

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
			walletName: `${$wallets.find((w) => w.id === t.fromWalletId)?.name} ➔ ${$wallets.find((w) => w.id === t.toWalletId)?.name}`
		}));

		// @ts-ignore
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

<div class="transactions-page">
	<div class="header-section">
		<h1 class="page-title">Transactions & Audit</h1>

		<!-- Search Input Bar -->
		<div class="search-wrap">
			<Search size={18} class="search-icon" />
			<input type="text" placeholder="Search transactions, notes, items..." bind:value={searchQuery} />
		</div>

		<!-- Segment Switcher Tabs -->
		<div class="segment-tabs">
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
				Outflows
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'income'}
				onclick={() => (activeSegment = 'income')}
			>
				Inflows
			</button>
			<button
				class="segment-btn"
				class:active={activeSegment === 'transfer'}
				onclick={() => (activeSegment = 'transfer')}
			>
				Transfers
			</button>
		</div>

		<!-- Value Tag Filter Pills (Touch Horizontal Scroll) -->
		{#if activeSegment === 'all' || activeSegment === 'expense'}
			<div class="filter-chips-row touch-scroll-x">
				<button
					class="filter-chip"
					class:active={activeValueFilter === 'all'}
					onclick={() => (activeValueFilter = 'all')}
				>
					All Tags
				</button>
				<button
					class="filter-chip chip-need"
					class:active={activeValueFilter === 'need'}
					onclick={() => (activeValueFilter = 'need')}
				>
					⚡ Needs
				</button>
				<button
					class="filter-chip chip-want"
					class:active={activeValueFilter === 'want'}
					onclick={() => (activeValueFilter = 'want')}
				>
					✨ Wants
				</button>
				<button
					class="filter-chip chip-growth"
					class:active={activeValueFilter === 'growth'}
					onclick={() => (activeValueFilter = 'growth')}
				>
					📚 Growth
				</button>
				<button
					class="filter-chip chip-regret"
					class:active={activeValueFilter === 'regretted'}
					onclick={() => (activeValueFilter = 'regretted')}
				>
					💀 Regretted
				</button>
			</div>
		{/if}
	</div>

	<!-- Transaction List Feed -->
	<div class="feed-container">
		{#each filteredTransactions as transaction (transaction.id)}
			{@const isExpense = transaction.type === 'expense'}
			{@const isIncome = transaction.type === 'income'}
			{@const isTransfer = transaction.type === 'transfer'}
			{@const category = getCategoryById(transaction.categoryId)}
			{@const exp = isExpense ? (transaction as unknown as Expense) : null}

			<div
				class="transaction-row card"
				role="button"
				tabindex="0"
				onclick={() => {
					if (isExpense && exp) {
						selectedExpense = exp;
						showSatisfactionModal = true;
					}
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' && isExpense && exp) {
						selectedExpense = exp;
						showSatisfactionModal = true;
					}
				}}
			>
				<div class="icon-wrap" class:income={isIncome} class:transfer={isTransfer}>
					{#if isTransfer}
						<ArrowRightLeft size={18} color="var(--accent-primary)" />
					{:else if isIncome}
						<ArrowDownLeft size={18} color="#10B981" />
					{:else}
						<CategoryIcon icon={category?.icon || 'Receipt'} color={category?.color || '#10B981'} size={18} />
					{/if}
				</div>

				<div class="details-col">
					<div class="title-line">
						<span class="tx-title">
							{#if isTransfer}
								Transfer
							{:else}
								{category?.name || (isIncome ? 'Income' : 'General')}
							{/if}
						</span>
						{#if isExpense && exp}
							<div class="badges-wrap">
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

					<div class="meta-line">
						<span>{transaction.displayName}</span>
						<span class="bullet">•</span>
						<span>{formatDate(transaction.date)}</span>
						{#if transaction.walletName}
							<span class="bullet">•</span>
							<span class="wallet-tag">{transaction.walletName}</span>
						{/if}
					</div>
				</div>

				<div class="amount-col tabular" class:income-amount={isIncome}>
					{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
				</div>
			</div>
		{:else}
			<div class="empty-feed card">
				<Receipt size={36} color="var(--text-muted)" />
				<p>No matching transactions found.</p>
			</div>
		{/each}
	</div>
</div>

<!-- Mindful Satisfaction Rating & Audit Sheet -->
{#if showSatisfactionModal && selectedExpense}
	<div
		class="modal-backdrop"
		onclick={() => (showSatisfactionModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showSatisfactionModal = false)}
	>
		<div
			class="modal-sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="sheet-handle-bar"></div>
			<div class="sheet-top-row">
				<h3>Mindful Spending Audit</h3>
				<button class="close-btn" onclick={() => (showSatisfactionModal = false)}>✕</button>
			</div>

			<div class="audit-summary-box">
				<div class="audit-amount tabular">{formatCurrency(selectedExpense.amount)}</div>
				<div class="audit-note">{selectedExpense.note || 'Expense Outlay'} • {formatDate(selectedExpense.date)}</div>
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
					<span class="sub">High joy / utility</span>
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
					<span class="sub">Impulse purchase</span>
				</button>
			</div>

			<div class="sheet-delete-row">
				<button class="delete-btn" onclick={() => handleDeleteExpense(selectedExpense!.id)}>
					<Trash2 size={16} />
					<span>Delete Transaction</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.transactions-page {
		max-width: 680px;
		margin: 0 auto;
	}

	.header-section {
		margin-bottom: 1.15rem;
	}

	.page-title {
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin-bottom: 0.85rem;
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.page-title {
			font-size: 1.65rem;
		}
	}

	.search-wrap {
		position: relative;
		margin-bottom: 0.65rem;
	}

	.search-wrap input {
		width: 100%;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 0.75rem 1rem 0.75rem 2.6rem;
		border-radius: var(--border-radius-pill);
		font-size: 16px;
		color: var(--text-primary);
		min-height: 46px;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		pointer-events: none;
	}

	.segment-tabs {
		display: flex;
		background: var(--surface-2);
		padding: 3px;
		border-radius: var(--border-radius-pill);
		border: 1px solid var(--border-color);
		margin-bottom: 0.65rem;
	}

	.segment-btn {
		flex: 1;
		padding: 0.5rem 0.4rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.segment-btn.active {
		background: var(--bg-card);
		color: var(--text-primary);
		box-shadow: var(--shadow-xs);
		font-weight: 800;
	}

	.filter-chips-row {
		display: flex;
		gap: 6px;
		padding-bottom: 4px;
	}

	.filter-chip {
		padding: 0.35rem 0.8rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.76rem;
		font-weight: 700;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.filter-chip.active {
		background: var(--accent-primary);
		color: #FFFFFF;
		border-color: var(--accent-primary);
		box-shadow: 0 2px 8px var(--accent-glow);
	}

	.feed-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.transaction-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		cursor: pointer;
	}

	.icon-wrap {
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

	.details-col {
		flex: 1;
		min-width: 0;
	}

	.title-line {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 2px;
	}

	.tx-title {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.badges-wrap {
		display: flex;
		gap: 4px;
	}

	.meta-line {
		font-size: 0.75rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bullet {
		color: var(--border-medium);
	}

	.wallet-tag {
		color: var(--text-secondary);
		font-weight: 600;
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
	.tag-worth { background: rgba(245, 158, 11, 0.18); color: #F59E0B; }
	.tag-regret { background: rgba(244, 63, 94, 0.18); color: #F43F5E; }

	.amount-col {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.income-amount {
		color: #10B981;
	}

	.empty-feed {
		text-align: center;
		padding: 3rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-muted);
	}

	/* Audit Sheet */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.sheet-top-row h3 {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.audit-summary-box {
		background: var(--surface-2);
		border-radius: var(--border-radius);
		padding: 1rem;
		text-align: center;
		margin-bottom: 1.15rem;
		border: 1px solid var(--border-color);
	}

	.audit-amount {
		font-size: 1.85rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.audit-note {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 2px;
		font-weight: 600;
	}

	.audit-question {
		font-size: 0.9rem;
		color: var(--text-secondary);
		text-align: center;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.satisfaction-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 1.25rem;
	}

	.satisfaction-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.85rem 0.45rem;
		border-radius: var(--border-radius);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		text-align: center;
		gap: 2px;
		transition: all 0.2s ease;
	}

	.satisfaction-btn .emoji {
		font-size: 1.5rem;
		margin-bottom: 2px;
	}

	.satisfaction-btn strong {
		font-size: 0.82rem;
		color: var(--text-primary);
		font-weight: 800;
	}

	.satisfaction-btn .sub {
		font-size: 0.68rem;
		color: var(--text-muted);
	}

	.satisfaction-btn.selected {
		border-color: var(--accent-primary);
		background: var(--accent-glow);
	}

	.sheet-delete-row {
		display: flex;
		justify-content: center;
		padding-top: 0.5rem;
	}

	.delete-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--danger);
		background: var(--danger-bg);
		border: 1px solid var(--danger-border);
		padding: 0.65rem 1.25rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.85rem;
		font-weight: 800;
		min-height: 44px;
	}
</style>
