<script lang="ts">
	import { wallets, categories, addExpense, addDebt, formatCurrency } from '$lib/stores';
	import * as db from '$lib/db';
	import {
		Users,
		Plus,
		Trash2,
		X,
		Check,
		Share2,
		Receipt,
		CreditCard,
		Sparkles
	} from 'lucide-svelte';

	let { open = $bindable(false), onSuccess = () => {} } = $props<{
		open: boolean;
		onSuccess?: () => void;
	}>();

	let title = $state('Campus Group Split');
	let totalAmountStr = $state('');
	let selectedWalletId = $state($wallets[0]?.id || '');
	let splitMethod = $state<'equal' | 'custom'>('equal');
	let youIncluded = $state(true);

	let friends = $state<Array<{ name: string; amountStr: string; upiId: string }>>([
		{ name: 'Rohan', amountStr: '', upiId: '' },
		{ name: 'Aarav', amountStr: '', upiId: '' }
	]);

	let totalAmountPaise = $derived(
		totalAmountStr ? Math.round(parseFloat(totalAmountStr) * 100) : 0
	);

	let totalPeopleCount = $derived((youIncluded ? 1 : 0) + friends.filter((f) => f.name.trim()).length);

	let equalSharePaise = $derived(
		totalPeopleCount > 0 && totalAmountPaise > 0
			? Math.round(totalAmountPaise / totalPeopleCount)
			: 0
	);

	function addFriendRow() {
		friends = [...friends, { name: '', amountStr: '', upiId: '' }];
	}

	function removeFriendRow(index: number) {
		friends = friends.filter((_, i) => i !== index);
	}

	async function handleSaveSplit() {
		if (totalAmountPaise <= 0) {
			alert('Please enter a valid bill amount');
			return;
		}

		const validFriends = friends.filter((f) => f.name.trim());
		if (validFriends.length === 0) {
			alert('Please add at least one friend to split with');
			return;
		}

		try {
			// 1. Calculate each friend's share
			const participants = validFriends.map((f) => {
				const share =
					splitMethod === 'equal'
						? equalSharePaise
						: Math.round((parseFloat(f.amountStr) || 0) * 100);
				return {
					name: f.name.trim(),
					shareAmount: share,
					upiId: f.upiId.trim() || undefined,
					isPaid: false
				};
			});

			const yourSharePaise = youIncluded
				? totalAmountPaise - participants.reduce((sum, p) => sum + p.shareAmount, 0)
				: 0;

			// 2. Log full expense or your share to wallet
			const foodCategory = (await db.getCategories()).find((c) =>
				c.name.toLowerCase().includes('food')
			);

			// Log your personal share as an Expense
			if (youIncluded && yourSharePaise > 0) {
				await addExpense({
					walletId: selectedWalletId || $wallets[0]?.id,
					categoryId: foodCategory?.id || 'cat-food',
					subcategory: 'Group Split',
					amount: yourSharePaise,
					date: new Date().toISOString(),
					note: `${title} (My Share)`,
					valueTag: 'want'
				});
			}

			// 3. Create 'receive' Debts for all friends
			for (const p of participants) {
				await addDebt({
					person: p.name,
					amount: p.shareAmount,
					direction: 'receive',
					date: new Date().toISOString(),
					note: `${title} split share`,
					upiId: p.upiId
				});
			}

			// 4. Save to BillSplits collection
			await db.addBillSplit({
				title,
				totalAmount: totalAmountPaise,
				payerWalletId: selectedWalletId,
				payerName: 'You',
				date: new Date().toISOString(),
				participants
			});

			open = false;
			onSuccess();
		} catch (err) {
			console.error('Failed to save bill split:', err);
		}
	}
</script>

{#if open}
	<div
		class="modal-backdrop"
		onclick={() => (open = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
	>
		<div
			class="modal-sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<div class="title-wrap">
					<Users size={22} class="text-accent" />
					<h3 class="modal-title">Campus Bill Splitter</h3>
				</div>
				<button class="close-btn" onclick={() => (open = false)}>✕</button>
			</div>

			<div class="modal-body">
				<!-- Title & Total Amount -->
				<div class="form-row">
					<div class="field-col flex-2">
						<label for="split-title">Bill / Event Name</label>
						<input id="split-title" type="text" bind:value={title} placeholder="e.g. Swiggy treat, Canteen bill" />
					</div>
					<div class="field-col flex-1">
						<label for="split-amount">Total Bill (₹)</label>
						<input id="split-amount" type="number" bind:value={totalAmountStr} placeholder="900" step="1" min="0" />
					</div>
				</div>

				<!-- Wallet Selection -->
				<div class="wallet-select-row">
					<label for="split-wallet">Paid From Wallet:</label>
					<select id="split-wallet" bind:value={selectedWalletId}>
						{#each $wallets as w}
							<option value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
						{/each}
					</select>
				</div>

				<!-- Split Method Controls -->
				<div class="method-toggle-row">
					<div class="toggle-group">
						<button
							type="button"
							class="toggle-btn"
							class:active={splitMethod === 'equal'}
							onclick={() => (splitMethod = 'equal')}
						>
							Split Equally
						</button>
						<button
							type="button"
							class="toggle-btn"
							class:active={splitMethod === 'custom'}
							onclick={() => (splitMethod = 'custom')}
						>
							Custom Amounts
						</button>
					</div>

					<label class="checkbox-label">
						<input type="checkbox" bind:checked={youIncluded} />
						<span>Include Me in Split</span>
					</label>
				</div>

				{#if splitMethod === 'equal' && totalAmountPaise > 0}
					<div class="split-preview-banner">
						<span>Each person pays: <strong>{formatCurrency(equalSharePaise)}</strong> ({totalPeopleCount} people)</span>
					</div>
				{/if}

				<!-- Friends List -->
				<div class="friends-section">
					<div class="friends-header">
						<span>Friends Sharing This Bill</span>
						<button type="button" class="add-friend-btn" onclick={addFriendRow}>
							<Plus size={14} /> Add Friend
						</button>
					</div>

					<div class="friends-list-stack">
						{#each friends as friend, index}
							<div class="friend-row-card">
								<input
									type="text"
									placeholder="Friend's Name"
									bind:value={friend.name}
									class="friend-name-input"
								/>
								{#if splitMethod === 'custom'}
									<input
										type="number"
										placeholder="₹ Amount"
										bind:value={friend.amountStr}
										class="friend-amount-input"
										step="1"
									/>
								{:else}
									<div class="equal-badge">{formatCurrency(equalSharePaise)}</div>
								{/if}
								<input
									type="text"
									placeholder="UPI ID (optional)"
									bind:value={friend.upiId}
									class="friend-upi-input"
								/>
								<button
									type="button"
									class="remove-btn"
									onclick={() => removeFriendRow(index)}
									disabled={friends.length <= 1}
								>
									<Trash2 size={15} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="secondary-btn" onclick={() => (open = false)}>Cancel</button>
				<button class="primary-btn" onclick={handleSaveSplit}>
					Split & Create Receivables
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
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
		box-shadow: var(--shadow-lg);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
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

	.form-row {
		display: flex;
		gap: 10px;
		margin-bottom: 14px;
	}

	.field-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.flex-2 { flex: 2; }
	.flex-1 { flex: 1; }

	label {
		font-size: 0.75rem;
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
		font-size: 0.9rem;
		font-weight: 600;
	}

	input:focus, select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.wallet-select-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}

	.wallet-select-row select {
		flex: 1;
	}

	.method-toggle-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 8px;
	}

	.toggle-group {
		display: flex;
		background: var(--bg-primary);
		padding: 3px;
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.toggle-btn {
		padding: 6px 12px;
		border-radius: 9px;
		border: none;
		background: transparent;
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--text-muted);
		cursor: pointer;
	}

	.toggle-btn.active {
		background: var(--accent-primary);
		color: white;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		color: var(--text-secondary);
		cursor: pointer;
		font-weight: 600;
	}

	.split-preview-banner {
		background: rgba(124, 58, 237, 0.08);
		border: 1px solid rgba(124, 58, 237, 0.2);
		color: var(--accent-primary);
		padding: 8px 14px;
		border-radius: 12px;
		font-size: 0.82rem;
		margin-bottom: 14px;
		text-align: center;
	}

	.friends-section {
		margin-bottom: 18px;
	}

	.friends-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.add-friend-btn {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--accent-primary);
		padding: 4px 10px;
		border-radius: 8px;
		font-size: 0.74rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.friends-list-stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.friend-row-card {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-primary);
		padding: 8px 12px;
		border-radius: 14px;
		border: 1px solid var(--border-color);
	}

	.friend-name-input {
		flex: 2;
		padding: 8px 10px;
		font-size: 0.85rem;
	}

	.friend-amount-input {
		flex: 1;
		padding: 8px 10px;
		font-size: 0.85rem;
	}

	.equal-badge {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
		padding: 0 8px;
	}

	.friend-upi-input {
		flex: 2;
		padding: 8px 10px;
		font-size: 0.8rem;
	}

	.remove-btn {
		background: transparent;
		border: none;
		color: var(--danger, #FF3366);
		cursor: pointer;
		padding: 4px;
	}

	.modal-footer {
		display: flex;
		gap: 10px;
		margin-top: 14px;
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
		box-shadow: 0 4px 15px var(--accent-glow);
	}
</style>
