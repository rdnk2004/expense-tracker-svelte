<script lang="ts">
	import { runway, formatCurrency } from '$lib/stores';
	import { Flame, ShieldAlert, Sparkles, TrendingUp, Calendar, Zap, ArrowRight, Wallet, CheckCircle2 } from 'lucide-svelte';

	let { onOpenSplit = () => {} } = $props<{ onOpenSplit?: () => void }>();

	// Status badge mapping
	let statusLabel = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'Safe Daily Pace';
		if ($runway.burnRateStatus === 'caution') return 'Caution Pace';
		return 'Crunch Mode!';
	});

	let statusBg = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.15)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.15)';
		return 'rgba(255, 51, 102, 0.15)';
	});

	let statusColor = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'var(--success, #10B981)';
		if ($runway.burnRateStatus === 'caution') return 'var(--warning, #F59E0B)';
		return 'var(--danger, #FF3366)';
	});

	let statusBorder = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.3)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.3)';
		return 'rgba(255, 51, 102, 0.3)';
	});
</script>

<div class="safe-spend-card" style="--status-color: {statusColor}; --status-bg: {statusBg}; --status-border: {statusBorder}">
	<!-- Header with Live Status Pulse -->
	<div class="card-header">
		<div class="title-with-badge">
			<span class="card-eyebrow">
				<Zap size={14} color="var(--accent-primary)" /> Daily Safe-to-Spend
			</span>
			<span class="status-pill">
				<span class="pulse-dot"></span>
				{statusLabel}
			</span>
		</div>
		<div class="runway-pill" title="Days remaining in current allowance cycle">
			<Calendar size={13} />
			<span><strong>{$runway.daysRemaining}</strong> days left</span>
		</div>
	</div>

	<!-- Main Amount Display -->
	<div class="amount-hero">
		<div class="main-amount">
			{formatCurrency($runway.dailySafeSpend)}
			<span class="per-day">/ day</span>
		</div>
		<p class="amount-subtext">
			{#if $runway.todayRemainingLimit >= 0}
				<span>Remaining today: <strong>{formatCurrency($runway.todayRemainingLimit)}</strong></span>
			{:else}
				<span class="text-danger">Over today's limit by <strong>{formatCurrency(Math.abs($runway.todayRemainingLimit))}</strong></span>
			{/if}
		</p>
	</div>

	<!-- Visual Gauge / Progress Track -->
	<div class="gauge-container">
		<div class="gauge-bar">
			<div
				class="gauge-fill"
				style="width: {Math.min(100, $runway.todayPacePercent)}%; background: {statusColor};"
			></div>
		</div>
		<div class="gauge-labels">
			<span>Today's spend: {formatCurrency($runway.todaySpent)}</span>
			<span>Pace: {$runway.todayPacePercent}%</span>
		</div>
	</div>

	<!-- Runway & Burn Rate Metrics Footer -->
	<div class="runway-metrics-grid">
		<div class="metric-box">
			<span class="metric-label">7-Day Avg Burn</span>
			<span class="metric-val">{formatCurrency($runway.avgDailyBurnRate7Days)}/d</span>
		</div>
		<div class="metric-box">
			<span class="metric-label">Projected Runway</span>
			<span class="metric-val" class:text-warning={$runway.projectedRunwayDays < $runway.daysRemaining}>
				{$runway.projectedRunwayDays} days
			</span>
		</div>
		<div class="metric-box">
			<span class="metric-label">Cycle Spent</span>
			<span class="metric-val">{formatCurrency($runway.totalCycleSpent)}</span>
		</div>
	</div>
</div>

<style>
	.safe-spend-card {
		background: var(--bg-card);
		border-radius: 28px;
		padding: 22px;
		margin-bottom: 20px;
		box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);
		border: 1px solid var(--border-color);
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.safe-spend-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--status-color), var(--accent-primary));
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.title-with-badge {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.card-eyebrow {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 5px;
	}


	.status-pill {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 9999px;
		background: var(--status-bg);
		color: var(--status-color);
		border: 1px solid var(--status-border);
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--status-color);
		box-shadow: 0 0 8px var(--status-color);
		animation: pulse 1.8s infinite;
	}

	@keyframes pulse {
		0% { transform: scale(0.95); opacity: 0.8; }
		50% { transform: scale(1.3); opacity: 1; }
		100% { transform: scale(0.95); opacity: 0.8; }
	}

	.runway-pill {
		font-size: 0.78rem;
		color: var(--text-secondary);
		background: var(--bg-primary);
		padding: 5px 10px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--border-color);
	}

	.amount-hero {
		margin-bottom: 16px;
	}

	.main-amount {
		font-size: 2.3rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.5px;
		line-height: 1.1;
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.per-day {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.amount-subtext {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.gauge-container {
		margin-bottom: 18px;
	}

	.gauge-bar {
		height: 8px;
		background: var(--bg-primary);
		border-radius: 9999px;
		overflow: hidden;
		position: relative;
	}

	.gauge-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.gauge-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.76rem;
		color: var(--text-muted);
		margin-top: 6px;
		font-weight: 500;
	}

	.runway-metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		background: var(--bg-primary);
		padding: 12px;
		border-radius: 18px;
		border: 1px solid var(--border-color);
	}

	.metric-box {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: center;
	}

	.metric-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.metric-val {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-primary);
	}
</style>
