<script lang="ts">
	// Interactive Demonstration of Axiom Financial Intelligence
	// Uses real algorithms for 3-bucket partitioning, labor-hour conversion, and campus tabs.

	let allowance = $state(12000);
	let hourlyWage = $state(250);
	let purchaseAmount = $state(480);
	let purchaseDescription = $state('Late Delivery Dinner');
	let selectedCategory = $state<'survival' | 'fun' | 'future'>('fun');

	// Active demonstration tab
	let activeTab = $state<'calculator' | 'splits' | 'ledger'>('calculator');

	// Interactive Bill Split Simulator
	let billTitle = $state('Room WiFi and Router');
	let billTotal = $state(1050);
	let friendsCount = $state(3);
	let perPersonShare = $derived(Math.round(billTotal / friendsCount));
	let copiedNotice = $state(false);

	let whatsAppSampleText = $derived(
		`Hi, for ${billTitle}: total is ₹${billTotal.toLocaleString('en-IN')}. Split among ${friendsCount} of us is ₹${perPersonShare.toLocaleString('en-IN')} each. Please send via UPI when convenient.`
	);

	function copyWhatsAppText() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(whatsAppSampleText);
			copiedNotice = true;
			setTimeout(() => {
				copiedNotice = false;
			}, 2500);
		}
	}

	// 3-Bucket Allocations
	let survivalCap = $derived(Math.round(allowance * 0.5));
	let funCap = $derived(Math.round(allowance * 0.3));
	let futureCap = $derived(Math.round(allowance * 0.2));

	// Work-Valuation Conversion
	let workHours = $derived.by(() => {
		if (hourlyWage <= 0 || purchaseAmount <= 0) return { hours: 0, mins: 0, text: '0 mins' };
		const totalMinutes = Math.round((purchaseAmount / hourlyWage) * 60);
		const hrs = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		if (hrs === 0) return { hours: 0, mins, text: `${mins} minutes` };
		if (mins === 0) return { hours: hrs, mins: 0, text: `${hrs} hr${hrs > 1 ? 's' : ''}` };
		return { hours: hrs, mins, text: `${hrs} hr ${mins} mins` };
	});

	// Safe to spend calculation (assuming 30-day month, day 5)
	let safeDailySpend = $derived.by(() => {
		const remainingDays = 25;
		const remainingFun = Math.max(0, funCap - purchaseAmount);
		return Math.round(remainingFun / remainingDays);
	});

	// Preset sample purchases for quick click
	const samplePresets = [
		{ name: 'Late Delivery Dinner', amount: 480, category: 'fun' as const },
		{ name: 'Semester Algorithm Text', amount: 650, category: 'survival' as const },
		{ name: 'Campus Metro Card Top-up', amount: 200, category: 'survival' as const },
		{ name: 'Weekend Cafe Outing', amount: 350, category: 'fun' as const },
		{ name: 'Semester Trip Sinking Deposit', amount: 1200, category: 'future' as const }
	];

	function selectPreset(preset: typeof samplePresets[0]) {
		purchaseDescription = preset.name;
		purchaseAmount = preset.amount;
		selectedCategory = preset.category;
	}
</script>

<div class="interactive-demo-wrapper" id="interactive-demo">
	<div class="demo-card">
		<!-- Demo Header -->
		<div class="demo-card-header">
			<div class="demo-title-group">
				<span class="demo-eyebrow">Interactive Sandbox</span>
				<h3 class="demo-title">Test the mathematical engine with student parameters</h3>
			</div>
			<div class="demo-meta-pill">
				<span class="status-indicator"></span>
				<span>Client-Side Calculations</span>
			</div>
		</div>

		<!-- Demonstration Tab Bar -->
		<div class="demo-tabs-bar" role="tablist" aria-label="Demo interactive tools">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'calculator'}
				class="tab-btn"
				class:active={activeTab === 'calculator'}
				onclick={() => (activeTab = 'calculator')}
			>
				Work Value & Safe Daily Spend
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'splits'}
				class="tab-btn"
				class:active={activeTab === 'splits'}
				onclick={() => (activeTab = 'splits')}
			>
				Campus Tab & Message Generator
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'ledger'}
				class="tab-btn"
				class:active={activeTab === 'ledger'}
				onclick={() => (activeTab = 'ledger')}
			>
				Simulated Student Ledger
			</button>
		</div>

		<!-- TAB 1: CALCULATOR -->
		{#if activeTab === 'calculator'}
			<div class="tab-panel">
				<div class="demo-controls-grid">
					<!-- Column 1: Financial Profile Inputs -->
					<div class="control-box">
						<span class="box-heading">Student Profile Parameters</span>

						<div class="input-row">
							<div class="label-with-value">
								<label for="allowance-input">Monthly Allowance</label>
								<span class="mono-value">₹{allowance.toLocaleString('en-IN')}</span>
							</div>
							<input
								id="allowance-input"
								type="range"
								min="4000"
								max="30000"
								step="500"
								bind:value={allowance}
								class="range-slider"
								aria-label="Monthly allowance slider"
							/>
						</div>

						<div class="input-row">
							<div class="label-with-value">
								<label for="wage-input">Campus Work Hourly Wage</label>
								<span class="mono-value">₹{hourlyWage}/hr</span>
							</div>
							<input
								id="wage-input"
								type="range"
								min="100"
								max="800"
								step="25"
								bind:value={hourlyWage}
								class="range-slider"
								aria-label="Hourly wage slider"
							/>
							<span class="field-hint">Used to translate monetary spending into physical working hours.</span>
						</div>

						<div class="preset-section">
							<span class="preset-label">Test Purchase Scenarios:</span>
							<div class="preset-chips">
								{#each samplePresets as preset}
									<button
										type="button"
										class="chip-btn"
										class:active={purchaseDescription === preset.name}
										onclick={() => selectPreset(preset)}
									>
										{preset.name} (₹{preset.amount})
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Column 2: Live Engine Outputs -->
					<div class="results-box">
						<span class="box-heading">Calculated Financial Translation</span>

						<!-- Labor Cost Card -->
						<div class="metric-card prominent">
							<div class="metric-header">
								<span class="metric-caption">Work Valuation Cost</span>
								<span class="category-tag">{selectedCategory} bucket</span>
							</div>
							<div class="metric-number-row">
								<span class="metric-main-figure">{workHours.text}</span>
								<span class="metric-sub-detail">of campus labor</span>
							</div>
							<p class="metric-explanation">
								Spending ₹{purchaseAmount.toLocaleString('en-IN')} on {purchaseDescription} requires {workHours.text} of tutoring or freelancing at ₹{hourlyWage} per hour.
							</p>
						</div>

						<!-- Macro Bucket Partitioning -->
						<div class="buckets-summary">
							<span class="buckets-title">3-Bucket Monthly Allocation (₹{allowance.toLocaleString('en-IN')} total)</span>
							<div class="bucket-bars">
								<div class="bucket-row">
									<div class="bucket-info">
										<span class="bucket-name">Survival (50%)</span>
										<span class="bucket-amount">₹{survivalCap.toLocaleString('en-IN')}</span>
									</div>
									<div class="bar-track">
										<div class="bar-fill" style="width: 50%;"></div>
									</div>
								</div>

								<div class="bucket-row">
									<div class="bucket-info">
										<span class="bucket-name">Discretionary (30%)</span>
										<span class="bucket-amount">₹{funCap.toLocaleString('en-IN')}</span>
									</div>
									<div class="bar-track">
										<div class="bar-fill accent" style="width: 30%;"></div>
									</div>
								</div>

								<div class="bucket-row">
									<div class="bucket-info">
										<span class="bucket-name">Future Reserves (20%)</span>
										<span class="bucket-amount">₹{futureCap.toLocaleString('en-IN')}</span>
									</div>
									<div class="bar-track">
										<div class="bar-fill" style="width: 20%;"></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Safe to spend readout -->
						<div class="safe-spend-footer">
							<div class="safe-spend-col">
								<span class="safe-label">Projected Daily Safe-to-Spend</span>
								<span class="safe-value">₹{safeDailySpend} / day</span>
							</div>
							<span class="safe-period">Calculated for 25 remaining days in term</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- TAB 2: CAMPUS SPLITS -->
		{#if activeTab === 'splits'}
			<div class="tab-panel">
				<div class="demo-controls-grid">
					<div class="control-box">
						<span class="box-heading">Group Expense Configuration</span>

						<div class="field-group">
							<label for="split-title">Shared Expense Description</label>
							<input
								id="split-title"
								type="text"
								bind:value={billTitle}
								class="text-input"
								placeholder="e.g. WiFi Router Recharge"
							/>
						</div>

						<div class="field-group">
							<label for="split-amount">Total Bill Amount (₹)</label>
							<input
								id="split-amount"
								type="number"
								min="10"
								step="10"
								bind:value={billTotal}
								class="text-input"
							/>
						</div>

						<div class="field-group">
							<label for="split-people">Number of Students Sharing</label>
							<div class="people-stepper">
								{#each [2, 3, 4, 5, 6] as num}
									<button
										type="button"
										class="stepper-btn"
										class:active={friendsCount === num}
										onclick={() => (friendsCount = num)}
									>
										{num} people
									</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="results-box">
						<span class="box-heading">Formatted Settlement Request</span>

						<div class="metric-card">
							<div class="metric-header">
								<span class="metric-caption">Individual Share</span>
								<span class="category-tag">Zero commission</span>
							</div>
							<div class="metric-number-row">
								<span class="metric-main-figure">₹{perPersonShare.toLocaleString('en-IN')}</span>
								<span class="metric-sub-detail">per student</span>
							</div>
						</div>

						<div class="whatsapp-card">
							<div class="whatsapp-header">
								<span class="whatsapp-title">Generated WhatsApp Message Template</span>
								<button
									type="button"
									class="copy-btn"
									onclick={copyWhatsAppText}
									aria-label="Copy message text to clipboard"
								>
									{copiedNotice ? 'Copied to Clipboard' : 'Copy Text'}
								</button>
							</div>
							<div class="whatsapp-bubble">
								<p>{whatsAppSampleText}</p>
							</div>
							<span class="whatsapp-note">
								Formats messages directly in plain text. No external API, login, or tracking links required.
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- TAB 3: SIMULATED LEDGER -->
		{#if activeTab === 'ledger'}
			<div class="tab-panel">
				<div class="ledger-table-wrap">
					<div class="ledger-header-meta">
						<span class="box-heading">Sample Semester Ledger Entries</span>
						<span class="mono-label">Source: Standard Campus Profile</span>
					</div>

					<div class="sample-transactions-list">
						<div class="tx-item">
							<div class="tx-main">
								<div class="tx-title-row">
									<span class="tx-name">Algorithms and System Design Guide</span>
									<span class="tx-badge growth">Growth Value</span>
								</div>
								<span class="tx-sub">Bookstore payment / Need category / Worth it</span>
							</div>
							<div class="tx-figures">
								<span class="tx-amount">₹650.00</span>
								<span class="tx-labor">2.6 hrs work</span>
							</div>
						</div>

						<div class="tx-item">
							<div class="tx-main">
								<div class="tx-title-row">
									<span class="tx-name">Campus Canteen Dosa and Chai</span>
									<span class="tx-badge need">Need Value</span>
								</div>
								<span class="tx-sub">UPI wallet / Survival category / Worth it</span>
							</div>
							<div class="tx-figures">
								<span class="tx-amount">₹140.00</span>
								<span class="tx-labor">34 mins work</span>
							</div>
						</div>

						<div class="tx-item">
							<div class="tx-main">
								<div class="tx-title-row">
									<span class="tx-name">Midnight Food Delivery (Impulse)</span>
									<span class="tx-badge want">Want Value</span>
								</div>
								<span class="tx-sub">Online card / Discretionary bucket / Regretted</span>
							</div>
							<div class="tx-figures">
								<span class="tx-amount">₹480.00</span>
								<span class="tx-labor">1.9 hrs work</span>
							</div>
						</div>

						<div class="tx-item">
							<div class="tx-main">
								<div class="tx-title-row">
									<span class="tx-name">Semester Metro Card Recharge</span>
									<span class="tx-badge need">Need Value</span>
								</div>
								<span class="tx-sub">Cash stash / Survival category / Neutral</span>
							</div>
							<div class="tx-figures">
								<span class="tx-amount">₹200.00</span>
								<span class="tx-labor">48 mins work</span>
							</div>
						</div>
					</div>

					<div class="ledger-footer-row">
						<span class="ledger-note">Every transaction in Axiom includes post-purchase satisfaction auditing to reveal spending regret patterns.</span>
						<a href="/dashboard" class="launch-app-inline-link">
							Open Complete App
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
								<path d="M2.5 6h7M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Demo Footer Strip -->
		<div class="demo-card-footer">
			<span class="simulated-badge">Note: Simulated results based on a standard university student parameter set.</span>
			<a href="/dashboard" class="action-btn">
				<span>Open Full Application in Browser</span>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
					<path d="M2.5 6h7M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</a>
		</div>
	</div>
</div>

<style>
	.interactive-demo-wrapper {
		width: 100%;
		max-width: var(--axiom-container-width);
		margin: 0 auto;
	}

	.demo-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-xl);
		overflow: hidden;
	}

	.demo-card-header {
		padding: 32px 32px 24px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		border-bottom: 1px solid var(--axiom-border-subtle);
		flex-wrap: wrap;
		gap: 16px;
	}

	.demo-eyebrow {
		display: block;
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		font-weight: 500;
		color: var(--axiom-accent);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 6px;
	}

	.demo-title {
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
		letter-spacing: -0.015em;
		margin: 0;
	}

	.demo-meta-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		background-color: var(--axiom-canvas-subtle);
		padding: 6px 12px;
		border-radius: var(--axiom-radius-sm);
		border: 1px solid var(--axiom-border);
	}

	.status-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--axiom-accent);
	}

	.demo-tabs-bar {
		display: flex;
		background-color: var(--axiom-canvas-subtle);
		border-bottom: 1px solid var(--axiom-border);
		padding: 6px 32px 0;
		gap: 8px;
		overflow-x: auto;
	}

	.tab-btn {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 10px 14px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-text-secondary);
		cursor: pointer;
		white-space: nowrap;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.tab-btn:hover {
		color: var(--axiom-text-primary);
	}

	.tab-btn.active {
		color: var(--axiom-text-primary);
		border-bottom-color: var(--axiom-accent);
		font-weight: 600;
	}

	.tab-panel {
		padding: 32px;
	}

	.demo-controls-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 36px;
	}

	.control-box,
	.results-box {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.box-heading {
		font-size: 0.8125rem;
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.input-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label-with-value {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.label-with-value label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.mono-value {
		font-family: var(--axiom-font-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.range-slider {
		width: 100%;
		accent-color: var(--axiom-accent);
		cursor: pointer;
	}

	.field-hint {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
		line-height: 1.4;
	}

	.preset-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.preset-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-text-secondary);
	}

	.preset-chips {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.chip-btn {
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-sm);
		padding: 8px 12px;
		font-size: 0.8125rem;
		color: var(--axiom-text-primary);
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.chip-btn:hover {
		background-color: #ebebee;
	}

	.chip-btn.active {
		border-color: var(--axiom-accent);
		background-color: var(--axiom-accent-subtle);
		font-weight: 500;
	}

	.metric-card {
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.metric-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.metric-caption {
		font-size: 0.75rem;
		text-transform: uppercase;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		letter-spacing: 0.04em;
	}

	.category-tag {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		padding: 2px 8px;
		border-radius: var(--axiom-radius-sm);
		color: var(--axiom-text-secondary);
		text-transform: capitalize;
	}

	.metric-number-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.metric-main-figure {
		font-size: 1.875rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--axiom-text-primary);
		font-family: var(--axiom-font-mono);
	}

	.metric-sub-detail {
		font-size: 0.875rem;
		color: var(--axiom-text-secondary);
	}

	.metric-explanation {
		font-size: 0.8125rem;
		color: var(--axiom-text-secondary);
		line-height: 1.45;
		margin: 4px 0 0;
	}

	.buckets-summary {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.buckets-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-text-secondary);
	}

	.bucket-bars {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.bucket-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.bucket-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	.bucket-name {
		color: var(--axiom-text-secondary);
	}

	.bucket-amount {
		font-family: var(--axiom-font-mono);
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.bar-track {
		height: 6px;
		background-color: var(--axiom-border-subtle);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background-color: var(--axiom-text-primary);
	}

	.bar-fill.accent {
		background-color: var(--axiom-accent);
	}

	.safe-spend-footer {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 14px 16px;
		background-color: var(--axiom-canvas-subtle);
		border-radius: var(--axiom-radius-sm);
		border: 1px solid var(--axiom-border);
		flex-wrap: wrap;
		gap: 8px;
	}

	.safe-spend-col {
		display: flex;
		flex-direction: column;
	}

	.safe-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
	}

	.safe-value {
		font-size: 1.125rem;
		font-weight: 600;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-primary);
	}

	.safe-period {
		font-size: 0.75rem;
		color: var(--axiom-text-muted);
	}

	/* Campus splits tab styles */
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.text-input {
		padding: 9px 12px;
		border: 1px solid var(--axiom-border-strong);
		border-radius: var(--axiom-radius-sm);
		font-size: 0.875rem;
		font-family: var(--axiom-font-sans);
		background-color: var(--axiom-surface);
		color: var(--axiom-text-primary);
	}

	.people-stepper {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.stepper-btn {
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-sm);
		padding: 6px 10px;
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--axiom-text-primary);
	}

	.stepper-btn.active {
		border-color: var(--axiom-accent);
		background-color: var(--axiom-accent-subtle);
		font-weight: 600;
	}

	.whatsapp-card {
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		padding: 16px;
		background-color: var(--axiom-canvas-subtle);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.whatsapp-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.whatsapp-title {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		text-transform: uppercase;
		color: var(--axiom-text-tertiary);
		letter-spacing: 0.04em;
	}

	.copy-btn {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border-strong);
		padding: 4px 10px;
		border-radius: var(--axiom-radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.copy-btn:hover {
		background-color: var(--axiom-canvas-subtle);
	}

	.whatsapp-bubble {
		background-color: #ffffff;
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-sm);
		padding: 12px 14px;
	}

	.whatsapp-bubble p {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--axiom-text-primary);
	}

	.whatsapp-note {
		font-size: 0.75rem;
		color: var(--axiom-text-muted);
		line-height: 1.4;
	}

	/* Ledger tab styles */
	.ledger-table-wrap {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.ledger-header-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.mono-label {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
	}

	.sample-transactions-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		overflow: hidden;
	}

	.tx-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		background-color: var(--axiom-surface);
		border-bottom: 1px solid var(--axiom-border-subtle);
	}

	.tx-item:last-child {
		border-bottom: none;
	}

	.tx-main {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.tx-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tx-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.tx-badge {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		padding: 2px 6px;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.tx-badge.growth {
		background-color: #f0f7f3;
		color: #14532d;
		border: 1px solid #d1e7dd;
	}

	.tx-badge.need {
		background-color: #eff6ff;
		color: #1e40af;
		border: 1px solid #dbeafe;
	}

	.tx-badge.want {
		background-color: #fef3c7;
		color: #92400e;
		border: 1px solid #fde68a;
	}

	.tx-sub {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
	}

	.tx-figures {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.tx-amount {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-primary);
	}

	.tx-labor {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-muted);
	}

	.ledger-footer-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		padding-top: 4px;
	}

	.ledger-note {
		font-size: 0.75rem;
		color: var(--axiom-text-tertiary);
	}

	.launch-app-inline-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-accent);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.launch-app-inline-link:hover {
		text-decoration: underline;
	}

	.demo-card-footer {
		padding: 16px 32px;
		background-color: var(--axiom-canvas-subtle);
		border-top: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.simulated-badge {
		font-size: 0.75rem;
		color: var(--axiom-text-muted);
		font-family: var(--axiom-font-mono);
	}

	.action-btn {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #ffffff;
		background-color: var(--axiom-text-primary);
		text-decoration: none;
		padding: 8px 16px;
		border-radius: var(--axiom-radius-sm);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: background-color 0.15s ease;
	}

	.action-btn:hover {
		background-color: #333336;
	}

	@media (max-width: 768px) {
		.demo-card-header,
		.tab-panel,
		.demo-card-footer {
			padding: 20px;
		}

		.demo-tabs-bar {
			padding: 6px 20px 0;
		}

		.demo-controls-grid {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.demo-card-footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
