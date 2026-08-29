<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		expenses,
		debts,
		transfers,
		budgets,
		categories,
		wallets,
		studentProfile,
		healthScore,
		exportData,
		importData,
		clearAllData,
		formatCurrency
	} from '$lib/stores';
	import { lockApp, passwordExists } from '$lib/stores/auth';
	import {
		Settings,
		Info,
		Download,
		Upload,
		Lock,
		FolderOpen,
		Trash2,
		X,
		Moon,
		Sun,
		Award,
		GraduationCap,
		Check,
		Sparkles
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import { loadStudentDemoData } from '$lib/utils/mockData';

	let showToast = $state(false);
	let toastMessage = $state('');
	let showResetModal = $state(false);
	let resetConfirmText = $state('');
	let showImportModal = $state(false);
	let importFileInput: HTMLInputElement;
	let importPreview = $state<any>(null);

	let theme = $state<'light' | 'dark'>('dark');

	let editAllowance = $state('');
	let editDay = $state('1');
	let editWage = $state('200');
	let editCollege = $state('');

	$effect(() => {
		if ($studentProfile) {
			editAllowance = ($studentProfile.monthlyAllowance / 100).toString();
			editDay = ($studentProfile.allowanceDay || 1).toString();
			editWage = (($studentProfile.hourlyWageRate || 20000) / 100).toString();
			editCollege = $studentProfile.collegeName || '';
		}
	});

	async function handleSaveStudentProfile() {
		const allowance = parseFloat(editAllowance);
		const day = parseInt(editDay);
		const wage = parseFloat(editWage);

		if (isNaN(allowance) || allowance < 0) {
			showToastMessage('Please enter a valid allowance');
			return;
		}

		await studentProfile.update({
			monthlyAllowance: Math.round(allowance * 100),
			allowanceDay: Math.min(31, Math.max(1, day || 1)),
			hourlyWageRate: Math.round(wage * 100),
			collegeName: editCollege.trim() || undefined
		});

		showToastMessage('Student profile & runway recalibrated! 🎓');
	}

	async function handleLoadDemo() {
		if (confirm('Load authentic college student demo data? (Includes realistic UPI wallets, chai habits, group splits, and semester trip goals)')) {
			try {
				await loadStudentDemoData();
				showToastMessage('College demo data loaded successfully! 🎓');
				goto('/');
			} catch (err) {
				console.error(err);
				showToastMessage('Failed to load demo data');
			}
		}
	}

	onMount(() => {
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

	async function handleExportData() {
		try {
			await exportData();
			showToastMessage('Data exported successfully! 💾');
		} catch (error) {
			console.error('Export failed:', error);
			showToastMessage('Export failed ❌');
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

			if (!data.expenses || !data.wallets || !data.categories) {
				throw new Error('Invalid data format');
			}

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
			showToastMessage('Invalid file format ❌');
		}

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
			showToastMessage('Data imported successfully! ⚡');
		} catch (error) {
			console.error('Import failed:', error);
			showToastMessage('Import failed ❌');
		}
	}

	function openResetModal() {
		showResetModal = true;
		resetConfirmText = '';
	}

	async function confirmReset() {
		if (resetConfirmText !== 'DELETE') {
			showToastMessage('Please type DELETE to confirm ❌');
			return;
		}

		try {
			await clearAllData();
			showResetModal = false;
			resetConfirmText = '';
			showToastMessage('All data reset to blank state!');
		} catch (error) {
			console.error('Reset failed:', error);
			showToastMessage('Reset failed ❌');
		}
	}

	function handleLockApp() {
		lockApp();
		showToastMessage('App locked');
		setTimeout(() => {
			goto('/login');
		}, 1000);
	}

	function showToastMessage(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => (showToast = false), 3000);
	}
</script>

<div class="settings-page">
	{#if showToast}
		<div class="toast-pill">{toastMessage}</div>
	{/if}

	<div class="page-header">
		<div>
			<span class="campus-sub">System Engine</span>
			<h1 class="page-title">Settings & Profile</h1>
		</div>
	</div>

	<!-- 1. Student Financial Profile Card -->
	<div class="card profile-card">
		<div class="card-header-line">
			<div class="c-title-wrap">
				<GraduationCap size={20} color="var(--accent-primary)" />
				<h3 class="card-heading">Campus Student Profile</h3>
			</div>
			<button class="demo-pill-btn" onclick={handleLoadDemo}>
				<Sparkles size={13} />
				<span>Load Demo Data</span>
			</button>
		</div>
		<p class="card-desc">
			Configures your monthly allowance cadence and hourly campus gig rate to calculate the daily Safe-to-Spend runway.
		</p>

		<div class="form-grid-two">
			<div class="form-col">
				<label for="p-allowance">Monthly Allowance (₹)</label>
				<input id="p-allowance" type="number" bind:value={editAllowance} placeholder="10000" class="tabular" />
			</div>

			<div class="form-col">
				<label for="p-day">Cycle Reset Day (1-31)</label>
				<input id="p-day" type="number" min="1" max="31" bind:value={editDay} placeholder="1" class="tabular" />
			</div>
		</div>

		<div class="form-grid-two">
			<div class="form-col">
				<label for="p-wage">Hourly Freelance / Gig Rate (₹/hr)</label>
				<input id="p-wage" type="number" bind:value={editWage} placeholder="200" class="tabular" />
			</div>

			<div class="form-col">
				<label for="p-college">College / University Name</label>
				<input id="p-college" type="text" bind:value={editCollege} placeholder="e.g. IIT Bombay / DU / BITS" />
			</div>
		</div>

		<button class="save-profile-btn" onclick={handleSaveStudentProfile}>
			<Check size={16} />
			<span>Save Profile & Recalibrate Runway</span>
		</button>
	</div>

	<!-- 2. Appearance & Theme -->
	<div class="card theme-card">
		<div class="theme-switch-row">
			<div class="theme-info">
				<span class="theme-title">Dark Mode Appearance</span>
				<span class="theme-sub">Obsidian theme with electric emerald & neon accents</span>
			</div>
			<button class="theme-toggle-btn" onclick={toggleTheme} aria-label="Toggle Theme">
				{#if theme === 'dark'}
					<Moon size={18} color="var(--accent-primary)" />
				{:else}
					<Sun size={18} color="#F59E0B" />
				{/if}
			</button>
		</div>
	</div>

	<!-- 3. Achievement Badges Grid -->
	<div class="card badges-card">
		<div class="card-header-line">
			<div class="c-title-wrap">
				<Award size={20} color="var(--accent-primary)" />
				<h3 class="card-heading">Achievement Badges ({$healthScore.unlockedBadgesCount}/{$healthScore.badges.length})</h3>
			</div>
		</div>
		<p class="card-desc">Milestones unlocked through healthy student financial discipline:</p>

		<div class="badges-grid">
			{#each $healthScore.badges as badge}
				<div class="badge-item-box" class:unlocked={badge.unlocked}>
					<span class="badge-emoji">{badge.emoji}</span>
					<div class="badge-texts">
						<strong class="badge-name">{badge.title}</strong>
						<span class="badge-desc">{badge.desc}</span>
					</div>
					<span class="badge-status-tag">
						{badge.unlocked ? 'Unlocked ✨' : 'Locked 🔒'}
					</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- 4. Data Management & Backup -->
	<div class="card data-card">
		<h3 class="card-heading">Data Backup & Reset</h3>
		<p class="card-desc">Export full JSON backups or restore previous data snapshots:</p>

		<div class="data-actions-row">
			<button class="data-btn export" onclick={handleExportData}>
				<Download size={16} />
				<span>Export JSON Backup</span>
			</button>

			<input
				type="file"
				accept=".json"
				bind:this={importFileInput}
				onchange={handleFileSelect}
				style="display: none;"
			/>

			<button class="data-btn import" onclick={handleImportClick}>
				<Upload size={16} />
				<span>Import JSON Backup</span>
			</button>
		</div>

		{#if $passwordExists}
			<div class="lock-row">
				<button class="data-btn lock" onclick={handleLockApp}>
					<Lock size={16} />
					<span>Lock App (Biometrics/PIN)</span>
				</button>
			</div>
		{/if}

		<div class="danger-zone-box">
			<div>
				<strong class="danger-title">Wipe Local Database</strong>
				<span class="danger-sub">Irreversibly clears all wallets, tabs, and expenses</span>
			</div>
			<button class="danger-btn" onclick={openResetModal}>
				<Trash2 size={14} />
				<span>Reset</span>
			</button>
		</div>
	</div>
</div>

<!-- Reset Modal -->
{#if showResetModal}
	<div
		class="modal-backdrop"
		onclick={() => (showResetModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showResetModal = false)}
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
				<h3 style="color: var(--danger);">Reset All Data</h3>
				<button class="close-btn" onclick={() => (showResetModal = false)}>✕</button>
			</div>

			<p class="sheet-desc">
				Type <strong>DELETE</strong> below to confirm wiping all records from this browser.
			</p>

			<div class="form-col" style="margin-bottom: 1rem;">
				<input type="text" placeholder="Type DELETE to confirm" bind:value={resetConfirmText} />
			</div>

			<button class="danger-btn-full" onclick={confirmReset}>
				Permanently Clear All Records
			</button>
		</div>
	</div>
{/if}

<!-- Import Modal Preview -->
{#if showImportModal && importPreview}
	<div
		class="modal-backdrop"
		onclick={() => (showImportModal = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showImportModal = false)}
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
				<h3>Confirm Data Restore</h3>
				<button class="close-btn" onclick={() => (showImportModal = false)}>✕</button>
			</div>

			<p class="sheet-desc">
				Found {importPreview.expenses} expenses, {importPreview.wallets} wallets, and {importPreview.debts} debts in this file. Overwrite current data?
			</p>

			<button class="primary-btn-full" onclick={confirmImport}>
				Confirm Restore
			</button>
		</div>
	</div>
{/if}

<style>
	.settings-page {
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
		margin-bottom: 0.25rem;
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

	.card-header-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.c-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card-heading {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
	}

	.demo-pill-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: var(--accent-primary);
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.card-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 0.85rem;
		line-height: 1.45;
	}

	/* Profile Card */
	.profile-card {
		padding: 1.35rem;
	}

	.form-grid-two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 0.75rem;
	}

	.form-col {
		display: flex;
		flex-direction: column;
	}

	.save-profile-btn {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--accent-primary);
		color: #080C14;
		font-weight: 800;
		font-size: 0.92rem;
		padding: 0.8rem;
		border-radius: var(--border-radius-pill);
		box-shadow: 0 4px 14px var(--accent-glow);
		margin-top: 0.45rem;
	}

	/* Theme Card */
	.theme-card {
		padding: 1.15rem 1.35rem;
	}

	.theme-switch-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.theme-info {
		display: flex;
		flex-direction: column;
	}

	.theme-title {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
	}

	.theme-sub {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.theme-toggle-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Badges */
	.badges-card {
		padding: 1.35rem;
	}

	.badges-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.badge-item-box {
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		opacity: 0.55;
	}

	.badge-item-box.unlocked {
		opacity: 1;
		border-color: rgba(16, 185, 129, 0.3);
		background: rgba(16, 185, 129, 0.05);
	}

	.badge-emoji {
		font-size: 1.35rem;
	}

	.badge-name {
		font-size: 0.82rem;
		font-weight: 800;
		color: var(--text-primary);
		display: block;
	}

	.badge-desc {
		font-size: 0.68rem;
		color: var(--text-muted);
		display: block;
	}

	.badge-status-tag {
		font-size: 0.65rem;
		font-weight: 700;
		margin-top: 4px;
		color: var(--text-secondary);
	}

	/* Data Card */
	.data-card {
		padding: 1.35rem;
	}

	.data-actions-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 0.85rem;
	}

	.data-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0.65rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.82rem;
		font-weight: 700;
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
	}

	.lock-row {
		margin-bottom: 0.85rem;
	}

	.data-btn.lock {
		width: 100%;
	}

	.danger-zone-box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid var(--border-subtle);
		padding-top: 0.85rem;
	}

	.danger-title {
		font-size: 0.84rem;
		color: var(--danger);
		display: block;
	}

	.danger-sub {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.danger-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--danger-bg);
		border: 1px solid var(--danger-border);
		color: var(--danger);
		font-size: 0.74rem;
		font-weight: 800;
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
	}

	/* Modal */
	.sheet-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.85rem;
	}

	.sheet-desc {
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
		line-height: 1.45;
	}

	.danger-btn-full {
		width: 100%;
		background: var(--danger);
		color: white;
		font-weight: 800;
		font-size: 0.92rem;
		padding: 0.8rem;
		border-radius: var(--border-radius-pill);
	}

	.primary-btn-full {
		width: 100%;
		background: var(--accent-primary);
		color: #080C14;
		font-weight: 800;
		font-size: 0.92rem;
		padding: 0.8rem;
		border-radius: var(--border-radius-pill);
	}

	@media (max-width: 520px) {
		.form-grid-two,
		.badges-grid,
		.data-actions-row {
			grid-template-columns: 1fr;
		}
	}
</style>
