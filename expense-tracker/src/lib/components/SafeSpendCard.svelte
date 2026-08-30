<script lang="ts">
	import { runway, formatCurrency } from '$lib/stores';
	import { Flame, ShieldAlert, Sparkles, TrendingUp, Calendar, Zap, ArrowRight, Wallet, CheckCircle2 } from 'lucide-svelte';

	let { onOpenSplit = () => {} } = $props<{ onOpenSplit?: () => void }>();

	let statusLabel = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'Safe Pace';
		if ($runway.burnRateStatus === 'caution') return 'Caution Pace';
		return 'Crunch Mode';
	});

	let statusBg = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.18)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.18)';
		return 'rgba(244, 63, 94, 0.18)';
	});

	let statusColor = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return '#10B981';
		if ($runway.burnRateStatus === 'caution') return '#F59E0B';
		return '#F43F5E';
	});

	let statusBorder = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.45)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.45)';
		return 'rgba(244, 63, 94, 0.45)';
	});
</script>

<div class="safe-spend-card" style="--status-color: {statusColor}; --status-bg: {statusBg}; --status-border: {statusBorder}">
	<!-- Top Row: Eyebrow + Live Pace Status + Days Left -->
	<div class="card-top-header">
		<div class="header-left">
			<div class="status-indicator-badge">
				<span class="status-pulse-dot"></span>
				<span class="status-text">{statusLabel}</span>
			</div>
		</div>
		<div class="runway-cycle-pill" title="Days remaining in current allowance cycle">
			<Calendar size={16} class="calendar-icon" />
			<span><strong>{$runway.daysRemaining}</strong> days left</span>
		</div>
	</div>

	<!-- Hero Safe-to-Spend Figure -->
	<div class="safe-hero-block">
		<span class="hero-sub-eyebrow">Daily Safe-to-Spend</span>
		<div class="amount-hero-row">
			<h2 class="amount-val tabular">{formatCurrency($runway.dailySafeSpend)}</h2>
			<span class="per-day-tag">/ day</span>
		</div>
		<div class="amount-today-caption">
			{#if $runway.todayRemainingLimit >= 0}
				<span>Remaining today: <strong class="tabular">{formatCurrency($runway.todayRemainingLimit)}</strong></span>
			{:else}
				<span class="over-limit-txt">Exceeded today by <strong class="tabular">{formatCurrency(Math.abs($runway.todayRemainingLimit))}</strong></span>
			{/if}
		</div>
	</div>

	<!-- Visual Pace Gauge Track -->
	<div class="gauge-section">
		<div class="gauge-track">
			<div
				class="gauge-progress"
				style="width: {Math.min(100, $runway.todayPacePercent)}%; background: {statusColor};"
			></div>
		</div>
		<div class="gauge-meta-row">
			<span>Today: <strong class="tabular">{formatCurrency($runway.todaySpent)}</strong></span>
			<span>Pace: <strong class="tabular">{$runway.todayPacePercent}%</strong></span>
		</div>
	</div>

	<!-- 3 Precision Metric Tiles -->
	<div class="metrics-grid">
		<div class="metric-tile">
			<span class="tile-label">7-Day Burn</span>
			<span class="tile-value tabular">{formatCurrency($runway.avgDailyBurnRate7Days)}<small>/d</small></span>
		</div>
		<div class="metric-tile">
			<span class="tile-label">Projected Runway</span>
			<span class="tile-value tabular" class:warning-val={$runway.projectedRunwayDays < $runway.daysRemaining}>
				{$runway.projectedRunwayDays} <small>days</small>
			</span>
		</div>
		<div class="metric-tile">
			<span class="tile-label">Cycle Spent</span>
			<span class="tile-value tabular">{formatCurrency($runway.totalCycleSpent)}</span>
		</div>
	</div>
</div>

<style>
	.safe-spend-card {
		background: var(--bg-card);
		border-radius: var(--border-radius);
		padding: 1.15rem;
		border: 1px solid var(--status-border);
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
		transition: all 0.25s ease;
	}

	.safe-spend-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--status-color), #06B6D4);
	}

	.card-top-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
	}

	.status-indicator-badge {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 0.4rem 0.85rem;
		border-radius: var(--border-radius-pill);
		background: var(--status-bg);
		border: 1px solid var(--status-border);
		color: var(--status-color);
		font-size: 0.85rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--status-color);
		box-shadow: 0 0 8px var(--status-color);
	}

	.runway-cycle-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		color: var(--text-secondary);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 0.4rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-weight: 700;
	}

	/* Hero Block */
	.safe-hero-block {
		margin-bottom: 1.25rem;
	}

	.hero-sub-eyebrow {
		display: block;
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
	}

	.amount-hero-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.amount-val {
		font-size: 2.35rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		line-height: 1.05;
		margin: 0;
	}

	.per-day-tag {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.amount-today-caption {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-top: 0.45rem;
		font-weight: 600;
	}

	.over-limit-txt {
		color: var(--danger);
		font-weight: 800;
	}

	/* Gauge Progress */
	.gauge-section {
		margin-bottom: 1.25rem;
	}

	.gauge-track {
		height: 10px;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-color);
		margin-bottom: 0.55rem;
	}

	.gauge-progress {
		height: 100%;
		border-radius: var(--border-radius-pill);
		transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.gauge-meta-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 600;
	}

	.gauge-meta-row strong {
		color: var(--text-primary);
		font-weight: 800;
	}

	/* 3 Metric Tiles */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding-top: 0.95rem;
		border-top: 1px solid var(--border-color);
	}

	.metric-tile {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 0.75rem 0.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.tile-label {
		font-size: 0.76rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-value {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-value small {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.warning-val {
		color: var(--warning);
	}
</style>
