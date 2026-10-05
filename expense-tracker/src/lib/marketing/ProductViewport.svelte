<script lang="ts">
	// High-fidelity Product Viewport component displaying the real Axiom Financial OS interface
</script>

<div class="product-viewport-container">
	<div class="hardware-frame">
		<!-- Window Title Bar -->
		<div class="window-titlebar">
			<div class="window-controls">
				<span class="control-dot"></span>
				<span class="control-dot"></span>
				<span class="control-dot"></span>
			</div>
			<div class="window-address-pill">
				<span class="lock-glyph">
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
						<rect x="2" y="4" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
						<path d="M3.5 4V2.5a1.5 1.5 0 013 0V4" stroke="currentColor" stroke-width="1.2"/>
					</svg>
				</span>
				<span class="address-text">axiom.local/dashboard</span>
			</div>
			<div class="window-status-tag">
				<span>IndexedDB Active</span>
			</div>
		</div>

		<!-- Main Application View Inside Screen -->
		<div class="app-screen-content">
			<!-- Screen Header -->
			<div class="screen-header">
				<div class="campus-profile-col">
					<span class="campus-eyebrow">Campus Profile: Term 5</span>
					<h4 class="screen-title">Financial Command</h4>
				</div>
				<div class="action-pill-group">
					<span class="screen-badge">Liquid Reserves</span>
					<span class="currency-tag">Paise Precision</span>
				</div>
			</div>

			<!-- Top Balance Metrics -->
			<div class="screen-metrics-grid">
				<div class="metric-tile">
					<span class="tile-caption">Total Liquid Capital</span>
					<div class="tile-number-row">
						<span class="tile-number">₹8,250.00</span>
					</div>
					<div class="tile-breakdown">
						<span>UPI: ₹6,850</span>
						<span class="dot-sep">•</span>
						<span>Cash: ₹1,400</span>
					</div>
				</div>

				<div class="metric-tile highlight">
					<span class="tile-caption">Daily Safe-to-Spend</span>
					<div class="tile-number-row">
						<span class="tile-number accent">₹312.00</span>
						<span class="tile-unit">/ day</span>
					</div>
					<span class="tile-subtext">24 days remaining in current allowance cycle</span>
				</div>

				<div class="metric-tile">
					<span class="tile-caption">Unsettled Split Tabs</span>
					<div class="tile-number-row">
						<span class="tile-number">₹870.00</span>
						<span class="tile-unit">receivable</span>
					</div>
					<span class="tile-subtext">2 pending campus roommate shares</span>
				</div>
			</div>

			<!-- 3-Bucket Visual Bar -->
			<div class="buckets-card">
				<div class="buckets-header">
					<span class="card-section-title">Semester Macro Allocation (50 / 30 / 20)</span>
					<span class="allowance-stat">Allowance: ₹12,000 / month</span>
				</div>
				<div class="progress-segmented">
					<div class="progress-segment survival" style="width: 50%;">
						<span class="segment-label">Survival: ₹6,000</span>
					</div>
					<div class="progress-segment discretionary" style="width: 30%;">
						<span class="segment-label">Fun: ₹3,600</span>
					</div>
					<div class="progress-segment future" style="width: 20%;">
						<span class="segment-label">Future: ₹2,400</span>
					</div>
				</div>
			</div>

			<!-- Lower Split: Recent Ledger & Peer Tabs -->
			<div class="lower-screen-grid">
				<!-- Transactions Table -->
				<div class="screen-panel">
					<div class="panel-header">
						<span class="panel-title">Recent Transactions & Work Cost</span>
						<span class="panel-meta">Tutoring Rate: ₹250/hr</span>
					</div>
					<div class="panel-list">
						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Algorithms & System Design Guide</span>
								<span class="tx-tag">Growth • Textbook</span>
							</div>
							<div class="amount-col">
								<span class="amount-val">-₹650.00</span>
								<span class="time-cost">2.6 hrs labor</span>
							</div>
						</div>

						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Campus Canteen Dosa & Chai</span>
								<span class="tx-tag">Survival • Mess buffer</span>
							</div>
							<div class="amount-col">
								<span class="amount-val">-₹140.00</span>
								<span class="time-cost">34 mins labor</span>
							</div>
						</div>

						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Late Swiggy Burger (Impulse)</span>
								<span class="tx-tag regret">Discretionary • Regretted</span>
							</div>
							<div class="amount-col">
								<span class="amount-val">-₹480.00</span>
								<span class="time-cost">1.9 hrs labor</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Campus Tabs Panel -->
				<div class="screen-panel">
					<div class="panel-header">
						<span class="panel-title">Campus Split Tabs</span>
						<span class="panel-meta">WhatsApp Ready</span>
					</div>
					<div class="panel-list">
						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Rohan (Hostel 4)</span>
								<span class="tx-tag">Room WiFi recharge share</span>
							</div>
							<div class="amount-col">
								<span class="amount-val green">+₹350.00</span>
								<span class="time-cost">To receive</span>
							</div>
						</div>

						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Priya (Lab Partner)</span>
								<span class="tx-tag">Sensor kit components</span>
							</div>
							<div class="amount-col">
								<span class="amount-val green">+₹520.00</span>
								<span class="time-cost">To receive</span>
							</div>
						</div>

						<div class="panel-row">
							<div class="tx-col">
								<span class="tx-title">Mess Committee Batch</span>
								<span class="tx-tag">Special weekend dinner tab</span>
							</div>
							<div class="amount-col">
								<span class="amount-val settled">Settled</span>
								<span class="time-cost">UPI verified</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.product-viewport-container {
		width: 100%;
		max-width: var(--axiom-container-width);
		margin: 0 auto;
	}

	.hardware-frame {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-xl);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
		overflow: hidden;
	}

	.window-titlebar {
		background-color: var(--axiom-canvas-subtle);
		border-bottom: 1px solid var(--axiom-border);
		height: 44px;
		padding: 0 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.window-controls {
		display: flex;
		gap: 6px;
	}

	.control-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--axiom-border-strong);
	}

	.window-address-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		padding: 4px 14px;
		border-radius: var(--axiom-radius-sm);
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
	}

	.lock-glyph {
		display: flex;
		align-items: center;
		color: var(--axiom-text-tertiary);
	}

	.window-status-tag {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-muted);
	}

	.app-screen-content {
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		background-color: var(--axiom-canvas);
	}

	.screen-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 12px;
	}

	.campus-eyebrow {
		display: block;
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 4px;
	}

	.screen-title {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--axiom-text-primary);
		margin: 0;
	}

	.action-pill-group {
		display: flex;
		gap: 8px;
	}

	.screen-badge {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		padding: 4px 10px;
		border-radius: var(--axiom-radius-sm);
		color: var(--axiom-text-secondary);
	}

	.currency-tag {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		background-color: var(--axiom-accent-subtle);
		border: 1px solid var(--axiom-accent-border);
		padding: 4px 10px;
		border-radius: var(--axiom-radius-sm);
		color: var(--axiom-accent);
	}

	.screen-metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.metric-tile {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.metric-tile.highlight {
		border-color: var(--axiom-accent-border);
		background-color: #ffffff;
	}

	.tile-caption {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--axiom-text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		font-family: var(--axiom-font-mono);
	}

	.tile-number-row {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.tile-number {
		font-size: 1.625rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-primary);
	}

	.tile-number.accent {
		color: var(--axiom-accent);
	}

	.tile-unit {
		font-size: 0.8125rem;
		color: var(--axiom-text-secondary);
	}

	.tile-breakdown {
		font-size: 0.75rem;
		color: var(--axiom-text-secondary);
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.dot-sep {
		color: var(--axiom-border-strong);
	}

	.tile-subtext {
		font-size: 0.75rem;
		color: var(--axiom-text-muted);
		line-height: 1.35;
	}

	.buckets-card {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.buckets-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 8px;
	}

	.card-section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.allowance-stat {
		font-size: 0.75rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-secondary);
	}

	.progress-segmented {
		display: flex;
		height: 28px;
		border-radius: var(--axiom-radius-sm);
		overflow: hidden;
		background-color: var(--axiom-canvas-subtle);
		border: 1px solid var(--axiom-border);
	}

	.progress-segment {
		display: flex;
		align-items: center;
		padding: 0 10px;
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.progress-segment.survival {
		background-color: #1d1d1f;
		color: #ffffff;
	}

	.progress-segment.discretionary {
		background-color: var(--axiom-accent);
		color: #ffffff;
	}

	.progress-segment.future {
		background-color: #6e6e73;
		color: #ffffff;
	}

	.lower-screen-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.screen-panel {
		background-color: var(--axiom-surface);
		border: 1px solid var(--axiom-border);
		border-radius: var(--axiom-radius-md);
		overflow: hidden;
	}

	.panel-header {
		padding: 14px 18px;
		background-color: var(--axiom-canvas-subtle);
		border-bottom: 1px solid var(--axiom-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.panel-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--axiom-text-primary);
	}

	.panel-meta {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-tertiary);
	}

	.panel-list {
		display: flex;
		flex-direction: column;
	}

	.panel-row {
		padding: 12px 18px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--axiom-border-subtle);
	}

	.panel-row:last-child {
		border-bottom: none;
	}

	.tx-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tx-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axiom-text-primary);
	}

	.tx-tag {
		font-size: 0.6875rem;
		color: var(--axiom-text-tertiary);
	}

	.tx-tag.regret {
		color: #b45309;
		font-weight: 500;
	}

	.amount-col {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.amount-val {
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-primary);
	}

	.amount-val.green {
		color: #047857;
	}

	.amount-val.settled {
		color: var(--axiom-text-muted);
	}

	.time-cost {
		font-size: 0.6875rem;
		font-family: var(--axiom-font-mono);
		color: var(--axiom-text-muted);
	}

	@media (max-width: 860px) {
		.screen-metrics-grid {
			grid-template-columns: 1fr;
		}

		.lower-screen-grid {
			grid-template-columns: 1fr;
		}

		.app-screen-content {
			padding: 20px;
		}

		.window-status-tag {
			display: none;
		}
	}
</style>
