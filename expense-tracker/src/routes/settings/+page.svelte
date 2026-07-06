<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		expenses,
		debts,
		transfers,
		budgets,
		categories,
		wallets,
		exportData,
		importData,
		clearAllData
	} from '$lib/stores';
	import { lockApp, passwordExists } from '$lib/stores/auth';
	import {
		Settings,
		Info,
		Download,
		Upload,
		Lock,
		FolderOpen,
		TriangleAlert,
		Trash2,
		X,
		Moon,
		Sun
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';

	// UI State
	let showToast = $state(false);
	let toastMessage = $state('');
	let showResetModal = $state(false);
	let resetConfirmText = $state('');
	let showImportModal = $state(false);
	let importFileInput: HTMLInputElement;
	let importPreview = $state<any>(null);

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		// Initialize theme state
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (savedTheme) {
			theme = savedTheme;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		}
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}
	let totalExpensesCount = $derived($expenses.length);
	let totalDebtsCount = $derived($debts.length);
	let totalTransfersCount = $derived($transfers.length);
	let totalBudgetsCount = $derived($budgets.length);

	let dateRange = $derived(() => {
		const allDates = [
			...$expenses.map((e) => new Date(e.date)),
			...$debts.map((d) => new Date(d.date))
		].sort((a, b) => a.getTime() - b.getTime());

		if (allDates.length === 0) return null;

		return {
			first: allDates[0].toLocaleDateString(),
			last: allDates[allDates.length - 1].toLocaleDateString()
		};
	});

	async function handleExportData() {
		try {
			await exportData();
			showSuccessToast('Data exported successfully!');
		} catch (error) {
			console.error('Export failed:', error);
			showSuccessToast('Export failed ❌');
		}
	}

	function handleImportClick() {
		importFileInput?.click();
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			// Validate data structure
			if (!data.expenses || !data.wallets || !data.categories) {
				throw new Error('Invalid data format');
			}

			// Set preview
			importPreview = {
				expenses: data.expenses?.length || 0,
				wallets: data.wallets?.length || 0,
				debts: data.debts?.length || 0,
				transfers: data.transfers?.length || 0,
				budgets: data.budgets?.length || 0,
				categories: data.categories?.length || 0
			};

			showImportModal = true;
		} catch (error) {
			console.error('Failed to parse file:', error);
			showSuccessToast('Invalid file format ❌');
		}

		// Reset input
		target.value = '';
	}

	async function confirmImport() {
		if (!importFileInput?.files?.[0]) return;

		try {
			const text = await importFileInput.files[0].text();
			const data = JSON.parse(text);
			await importData(data);

			showImportModal = false;
			importPreview = null;
			showSuccessToast('Data imported successfully!');
		} catch (error) {
			console.error('Import failed:', error);
			showSuccessToast('Import failed ❌');
		}
	}

	function openResetModal() {
		showResetModal = true;
		resetConfirmText = '';
	}

	async function confirmReset() {
		if (resetConfirmText !== 'DELETE') {
			showSuccessToast('Please type DELETE to confirm ❌');
			return;
		}

		try {
			await clearAllData();
			showResetModal = false;
			resetConfirmText = '';
			showSuccessToast('All data cleared successfully!');
		} catch (error) {
			console.error('Reset failed:', error);
			showSuccessToast('Reset failed ❌');
		}
	}

	function handleLockApp() {
		lockApp();
		showSuccessToast('App locked');
		setTimeout(() => {
			goto('/login');
		}, 1000);
	}

	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<div class="settings-page">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast">{toastMessage}</div>
	{/if}

	<h1 class="page-title">
		<Settings class="inline-icon" size={32} /> Settings
	</h1>

	<!-- Appearance Section -->
	<div class="section">
		<h2 class="section-title">
			<Sun class="inline-icon" size={20} /> Appearance
		</h2>
		<p class="section-description">Customize the look and feel of the application.</p>
		<div class="appearance-row">
			<div class="appearance-label-group">
				<span class="label-main">Dark Mode</span>
				<span class="label-sub">Switch between light and dark themes</span>
			</div>
			<button
				class="toggle-switch"
				class:checked={theme === 'dark'}
				onclick={toggleTheme}
				aria-label="Toggle dark mode"
				role="switch"
				aria-checked={theme === 'dark'}
			>
				<div class="toggle-thumb">
					{#if theme === 'dark'}
						<Moon size={12} color="#000" />
					{:else}
						<Sun size={12} color="#FDB813" />
					{/if}
				</div>
			</button>
		</div>
	</div>

	<!-- App Info Section -->
	<div class="section">
		<h2 class="section-title">
			<Info class="inline-icon" size={20} /> App Information
		</h2>
		<div class="info-grid">
			<div class="info-item">
				<span class="info-label">Version</span>
				<span class="info-value">1.0.0</span>
			</div>
			<div class="info-item">
				<span class="info-label">Schema Version</span>
				<span class="info-value">1</span>
			</div>
			<div class="info-item">
				<span class="info-label">Total Expenses</span>
				<span class="info-value">{totalExpensesCount}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Total Debts</span>
				<span class="info-value">{totalDebtsCount}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Total Transfers</span>
				<span class="info-value">{totalTransfersCount}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Total Budgets</span>
				<span class="info-value">{totalBudgetsCount}</span>
			</div>
			{#if dateRange()}
				{@const range = dateRange()}
				<div class="info-item full-width">
					<span class="info-label">Date Range</span>
					<span class="info-value">{range?.first} → {range?.last}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Export Data Section -->
	<div class="section">
		<h2 class="section-title">
			<Download class="inline-icon" size={20} /> Export Data
		</h2>
		<p class="section-description">
			Download a complete backup of all your financial data as a JSON file.
		</p>
		<button class="action-btn primary" onclick={handleExportData}>
			<Download size={20} />
			<span>Export All Data</span>
		</button>
	</div>

	<!-- Import Data Section -->
	<div class="section">
		<h2 class="section-title">
			<Upload class="inline-icon" size={20} /> Import Data
		</h2>
		<p class="section-description">
			Import data from a previously exported JSON file. This will overwrite all existing data.
		</p>
		<input
			type="file"
			accept=".json"
			bind:this={importFileInput}
			onchange={handleFileSelect}
			style="display: none;"
		/>
		<button class="action-btn secondary" onclick={handleImportClick}>
			<Upload size={20} />
			<span>Select File to Import</span>
		</button>
	</div>

	<!-- Security Section -->
	{#if $passwordExists}
		<div class="section">
			<h2 class="section-title">
				<Lock class="inline-icon" size={20} /> Security
			</h2>
			<p class="section-description">
				Lock the app to require password authentication. You'll need to enter your password to
				unlock.
			</p>
			<button class="action-btn secondary" onclick={handleLockApp}>
				<Lock size={20} />
				<span>Lock App Now</span>
			</button>
		</div>
	{/if}

	<!-- Category Management Section -->
	<div class="section">
		<h2 class="section-title">
			<FolderOpen class="inline-icon" size={20} /> Category Management
		</h2>
		<div class="categories-list">
			{#each $categories as category}
				<div class="category-item">
					<div class="category-icon">
						<CategoryIcon icon={category.icon} size={32} />
					</div>
					<div class="category-details">
						<div class="category-name">{category.name}</div>
						{#if category.subcategories.length > 0}
							<div class="category-subcategories">
								{category.subcategories.join(', ')}
							</div>
						{/if}
					</div>
					<div class="category-color" style="background: {category.color};"></div>
				</div>
			{/each}
		</div>
		<p class="help-text">
			<Info size={14} class="inline" /> Category customization (add, edit, delete) coming soon in a future
			update!
		</p>
	</div>

	<!-- Danger Zone -->
	<div class="section danger-zone">
		<h2 class="section-title">
			<TriangleAlert class="inline-icon" size={20} /> Danger Zone
		</h2>
		<p class="section-description">
			Irreversible actions. Please be careful. All data will be permanently deleted.
		</p>
		<button class="action-btn danger" onclick={openResetModal}>
			<Trash2 size={20} />
			<span>Clear All Data</span>
		</button>
	</div>

	<!-- Import Modal -->
	{#if showImportModal && importPreview}
		<div
			class="modal-overlay"
			onclick={() => (showImportModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showImportModal = false)}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<h2 class="modal-title">
					<Upload class="inline-icon" size={24} /> Import Data
				</h2>

				<div class="modal-warning">
					<strong>Warning:</strong> This will overwrite all existing data!
				</div>

				<div class="import-preview">
					<h3>Preview:</h3>
					<ul>
						<li>Expenses: {importPreview.expenses}</li>
						<li>Wallets: {importPreview.wallets}</li>
						<li>Debts: {importPreview.debts}</li>
						<li>Transfers: {importPreview.transfers}</li>
						<li>Budgets: {importPreview.budgets}</li>
						<li>Categories: {importPreview.categories}</li>
					</ul>
				</div>

				<div class="modal-actions">
					<button class="modal-btn danger" onclick={confirmImport}> Import & Overwrite </button>
					<button class="modal-btn secondary" onclick={() => (showImportModal = false)}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Reset Modal -->
	{#if showResetModal}
		<div
			class="modal-overlay"
			onclick={() => (showResetModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showResetModal = false)}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<h2 class="modal-title">
					<TriangleAlert class="inline-icon" size={24} /> Clear All Data
				</h2>

				<div class="modal-warning">
					<strong>Warning:</strong> This action cannot be undone!
					<br />
					All expenses, debts, transfers, budgets, and custom data will be permanently deleted.
				</div>

				<div class="confirmation-input">
					<label for="confirm-text">Type <strong>DELETE</strong> to confirm:</label>
					<input type="text" id="confirm-text" bind:value={resetConfirmText} placeholder="DELETE" />
				</div>

				<div class="modal-actions">
					<button
						class="modal-btn danger"
						onclick={confirmReset}
						disabled={resetConfirmText !== 'DELETE'}
					>
						Clear All Data
					</button>
					<button class="modal-btn secondary" onclick={() => (showResetModal = false)}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.settings-page {
		animation: fadeIn 0.3s ease-out;
		max-width: 900px;
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

	/* Toast */
	.toast {
		position: fixed;
		top: 2rem;
		right: 2rem;
		background: var(--success);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-lg);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Page Title */
	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: var(--text-primary);
	}

	/* Section */
	.section {
		background: linear-gradient(135deg, var(--bg-card) 0%, #1a1a1a 100%);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.section.danger-zone {
		border-color: var(--danger);
		background: linear-gradient(135deg, rgba(248, 113, 113, 0.05) 0%, #1a1a1a 100%);
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.section-description {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.help-text {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
	}

	/* Info Grid */
	.info-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.info-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item.full-width {
		grid-column: 1 / -1;
	}

	.info-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--accent-primary);
	}

	/* Action Buttons */
	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn.primary {
		background: var(--accent-primary);
		color: var(--bg-primary);
	}

	.action-btn.primary:hover {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
	}

	.action-btn.secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.action-btn.secondary:hover {
		background: var(--bg-hover);
		border-color: var(--accent-secondary);
	}

	.action-btn.danger {
		background: var(--danger);
		color: white;
	}

	.action-btn.danger:hover {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
	}

	/* Categories List */
	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		transition: all 0.2s;
	}

	.category-item:hover {
		background: var(--bg-hover);
		box-shadow: var(--shadow-sm);
	}

	.category-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.category-details {
		flex: 1;
	}

	.category-name {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.category-subcategories {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.category-color {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		flex-shrink: 0;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-lg);
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: var(--shadow-lg);
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.modal-warning {
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid var(--danger);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
		line-height: 1.6;
	}

	.import-preview {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.import-preview h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--text-primary);
	}

	.import-preview ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.import-preview li {
		padding: 0.5rem 0;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-color);
	}

	.import-preview li:last-child {
		border-bottom: none;
	}

	.confirmation-input {
		margin-bottom: 1.5rem;
	}

	.confirmation-input label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.confirmation-input input {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.75rem;
		border-radius: var(--border-radius);
		font-size: 1rem;
	}

	.confirmation-input input:focus {
		outline: none;
		border-color: var(--danger);
		box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
	}

	.modal-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-btn {
		padding: 1rem;
		border: none;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-btn.danger {
		background: var(--danger);
		color: white;
	}

	.modal-btn.danger:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
	}

	.modal-btn.danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-btn.secondary {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
	}

	.modal-btn.secondary:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.info-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.modal {
			padding: 1.5rem;
		}
	}

	/* Toggle Switch */
	.appearance-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.appearance-label-group {
		display: flex;
		flex-direction: column;
	}

	.label-main {
		font-weight: 600;
		color: var(--text-primary);
	}

	.label-sub {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.toggle-switch {
		width: 50px;
		height: 30px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 15px;
		position: relative;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		padding: 2px;
	}

	.toggle-switch.checked {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
	}

	.toggle-thumb {
		width: 24px;
		height: 24px;
		background: white;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-switch.checked .toggle-thumb {
		transform: translateX(20px);
	}
</style>
