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
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.16)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.16)';
		return 'rgba(244, 63, 94, 0.16)';
	});

	let statusColor = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return '#10B981';
		if ($runway.burnRateStatus === 'caution') return '#F59E0B';
		return '#F43F5E';
	});

	let statusBorder = $derived.by(() => {
		if ($runway.burnRateStatus === 'safe') return 'rgba(16, 185, 129, 0.35)';
		if ($runway.burnRateStatus === 'caution') return 'rgba(245, 158, 11, 0.35)';
		return 'rgba(244, 63, 94, 0.35)';
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
			<Calendar size={14} class="calendar-icon" />
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

	@media (min-width: 768px) {
		.safe-spend-card {
			border-radius: var(--border-radius-lg);
			padding: 1.35rem;
		}
	}

	.safe-spend-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--status-color), #06B6D4);
	}

	.card-top-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.status-indicator-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.3rem 0.7rem;
		border-radius: var(--border-radius-pill);
		background: var(--status-bg);
		border: 1px solid var(--status-border);
		color: var(--status-color);
		font-size: 0.76rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--status-color);
		box-shadow: 0 0 6px var(--status-color);
	}

	.runway-cycle-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.76rem;
		color: var(--text-secondary);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 0.3rem 0.7rem;
		border-radius: var(--border-radius-pill);
		font-weight: 700;
	}

	/* Hero Block */
	.safe-hero-block {
		margin-bottom: 1.15rem;
	}

	.hero-sub-eyebrow {
		display: block;
		font-size: 0.76rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.25rem;
	}

	.amount-hero-row {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.amount-val {
		font-size: 1.85rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		line-height: 1.1;
		margin: 0;
	}

	@media (min-width: 768px) {
		.amount-val {
			font-size: 2.15rem;
		}
	}

	.per-day-tag {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.amount-today-caption {
		font-size: 0.84rem;
		color: var(--text-secondary);
		margin-top: 0.35rem;
		font-weight: 500;
	}

	.over-limit-txt {
		color: var(--danger);
		font-weight: 700;
	}

	/* Gauge Progress */
	.gauge-section {
		margin-bottom: 1.15rem;
	}

	.gauge-track {
		height: 8px;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-color);
		margin-bottom: 0.45rem;
	}

	.gauge-progress {
		height: 100%;
		border-radius: var(--border-radius-pill);
		transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.gauge-meta-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.76rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.gauge-meta-row strong {
		color: var(--text-primary);
	}

	/* 3 Metric Tiles */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border-color);
	}

	.metric-tile {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-sm);
		padding: 0.6rem 0.4rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tile-label {
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-value {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-value small {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.warning-val {
		color: var(--warning);
	}
</style>
