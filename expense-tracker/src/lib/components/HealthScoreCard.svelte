<script lang="ts">
	import { healthScore } from '$lib/stores';
	import { Award, ShieldCheck, TrendingUp, Sparkles, ChevronRight, Lock } from 'lucide-svelte';

	let score = $derived($healthScore);
	let breakdown = $derived(score.breakdown);
</script>

<div class="health-score-card">
	<div class="card-header">
		<div class="header-title-wrap">
			<Award size={18} class="text-accent" />
			<span class="card-title">Student Financial Health</span>
		</div>
		<span class="grade-pill" style="border-color: {score.gradeColor}; color: {score.gradeColor};">
			{score.grade} • {score.gradeLabel}
		</span>
	</div>

	<!-- Main Score Gauge Section -->
	<div class="gauge-section">
		<div class="score-number-wrap">
			<span class="big-score" style="color: {score.gradeColor};">{score.totalScore}</span>
			<span class="score-out-of">/100</span>
		</div>

		<!-- 4 Pillar Progress Mini-Bars -->
		<div class="pillars-container">
			<div class="pillar-row">
				<span class="pillar-name">Runway Control</span>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.runwayScore / 25) * 100}%; background: #10B981;"></div>
				</div>
				<span class="pillar-score">{breakdown.runwayScore}/25</span>
			</div>

			<div class="pillar-row">
				<span class="pillar-name">Sinking Goals</span>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.savingsScore / 25) * 100}%; background: #3B82F6;"></div>
				</div>
				<span class="pillar-score">{breakdown.savingsScore}/25</span>
			</div>

			<div class="pillar-row">
				<span class="pillar-name">Friend Tabs</span>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.debtScore / 25) * 100}%; background: #7C3AED;"></div>
				</div>
				<span class="pillar-score">{breakdown.debtScore}/25</span>
			</div>

			<div class="pillar-row">
				<span class="pillar-name">Leakage Shield</span>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.leakageScore / 25) * 100}%; background: #F59E0B;"></div>
				</div>
				<span class="pillar-score">{breakdown.leakageScore}/25</span>
			</div>
		</div>
	</div>

	<!-- Badges Row -->
	<div class="badges-preview-section">
		<div class="badges-header">
			<span class="badges-title">Achievement Badges ({score.unlockedBadgesCount}/{score.badges.length})</span>
		</div>

		<div class="badges-strip">
			{#each score.badges as badge}
				<div class="badge-pill" class:locked={!badge.unlocked} title={badge.desc}>
					<span class="badge-emoji">{badge.emoji}</span>
					<span class="badge-title">{badge.title}</span>
					{#if !badge.unlocked}
						<Lock size={10} class="lock-icon" />
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.health-score-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		flex-wrap: wrap;
		gap: 8px;
	}

	.header-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card-title {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.grade-pill {
		font-size: 0.74rem;
		font-weight: 800;
		padding: 4px 10px;
		border-radius: 9999px;
		background: var(--bg-primary);
		border: 1px solid currentColor;
	}

	.gauge-section {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 16px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--border-color);
	}

	.score-number-wrap {
		display: flex;
		align-items: baseline;
		gap: 2px;
		min-width: 90px;
	}

	.big-score {
		font-size: 2.8rem;
		font-weight: 900;
		line-height: 1;
		letter-spacing: -1px;
	}

	.score-out-of {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
	}

	.pillars-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.pillar-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.7rem;
	}

	.pillar-name {
		width: 82px;
		color: var(--text-secondary);
		font-weight: 600;
		white-space: nowrap;
	}

	.mini-track {
		flex: 1;
		height: 6px;
		background: var(--bg-primary);
		border-radius: 9999px;
		overflow: hidden;
	}

	.mini-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.4s ease;
	}

	.pillar-score {
		width: 32px;
		text-align: right;
		font-weight: 700;
		color: var(--text-muted);
	}

	/* Badges */
	.badges-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.badges-title {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.badges-strip {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.badge-pill {
		display: flex;
		align-items: center;
		gap: 5px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		padding: 5px 10px;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.badge-pill.locked {
		opacity: 0.45;
		filter: grayscale(0.8);
	}

	.lock-icon {
		color: var(--text-muted);
	}
</style>
