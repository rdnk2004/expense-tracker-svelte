<script lang="ts">
	import { healthScore } from '$lib/stores';
	import { Award, ShieldCheck, TrendingUp, Sparkles, ChevronRight, Lock } from 'lucide-svelte';

	let score = $derived($healthScore);
	let breakdown = $derived(score.breakdown);
</script>

<div class="health-score-card">
	<!-- Card Top Row -->
	<div class="card-header">
		<div class="header-title-wrap">
			<div class="award-icon-box">
				<Award size={20} color="var(--accent-primary)" />
			</div>
			<div>
				<span class="card-title">Campus Health Score</span>
				<span class="card-sub">Financial Discipline Index</span>
			</div>
		</div>
		<span class="grade-pill" style="border-color: {score.gradeColor}50; background: {score.gradeColor}20; color: {score.gradeColor};">
			{score.grade} • {score.gradeLabel}
		</span>
	</div>

	<!-- Main Score Gauge Section -->
	<div class="score-breakdown-row">
		<div class="score-hero-col">
			<div class="score-number-wrap">
				<span class="big-score tabular" style="color: {score.gradeColor};">{score.totalScore}</span>
				<span class="score-out-of">/100</span>
			</div>
			<span class="score-caption">Discipline Index</span>
		</div>

		<!-- 4 Pillar Progress Mini-Bars -->
		<div class="pillars-container">
			<div class="pillar-row">
				<div class="pillar-info">
					<span class="pillar-name">Runway Control</span>
					<span class="pillar-score tabular">{breakdown.runwayScore}/25</span>
				</div>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.runwayScore / 25) * 100}%; background: #10B981;"></div>
				</div>
			</div>

			<div class="pillar-row">
				<div class="pillar-info">
					<span class="pillar-name">Sinking Goals</span>
					<span class="pillar-score tabular">{breakdown.savingsScore}/25</span>
				</div>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.savingsScore / 25) * 100}%; background: #38BDF8;"></div>
				</div>
			</div>

			<div class="pillar-row">
				<div class="pillar-info">
					<span class="pillar-name">Friend Tabs</span>
					<span class="pillar-score tabular">{breakdown.debtScore}/25</span>
				</div>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.debtScore / 25) * 100}%; background: #818CF8;"></div>
				</div>
			</div>

			<div class="pillar-row">
				<div class="pillar-info">
					<span class="pillar-name">Leakage Shield</span>
					<span class="pillar-score tabular">{breakdown.leakageScore}/25</span>
				</div>
				<div class="mini-track">
					<div class="mini-fill" style="width: {(breakdown.leakageScore / 25) * 100}%; background: #F59E0B;"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Badges Strip -->
	<div class="badges-preview-section">
		<div class="badges-header">
			<span class="badges-title">Milestone Badges ({score.unlockedBadgesCount}/{score.badges.length})</span>
		</div>

		<div class="badges-strip">
			{#each score.badges as badge}
				<div class="badge-pill" class:locked={!badge.unlocked} title="{badge.title}: {badge.desc}">
					<span class="badge-emoji">{badge.emoji}</span>
					<span class="badge-title">{badge.title}</span>
					{#if !badge.unlocked}
						<Lock size={13} color="var(--text-muted)" />
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
		border-radius: var(--border-radius);
		padding: 1.15rem;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.15rem;
		flex-wrap: wrap;
		gap: 8px;
	}

	.header-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.award-icon-box {
		width: 40px;
		height: 40px;
		border-radius: var(--border-radius-sm);
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.card-title {
		display: block;
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.card-sub {
		display: block;
		font-size: 0.82rem;
		color: var(--text-muted);
		font-weight: 600;
		margin-top: 2px;
	}

	.grade-pill {
		font-size: 0.82rem;
		font-weight: 800;
		padding: 0.35rem 0.75rem;
		border-radius: var(--border-radius-pill);
		border: 1px solid currentColor;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	/* Score Breakdown Grid */
	.score-breakdown-row {
		display: grid;
		grid-template-columns: 110px 1fr;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.15rem;
		padding-bottom: 1.15rem;
		border-bottom: 1px solid var(--border-color);
	}

	.score-hero-col {
		text-align: center;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: 1rem 0.5rem;
	}

	.score-number-wrap {
		display: flex;
		align-items: baseline;
		justify-content: center;
	}

	.big-score {
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1;
	}

	.score-out-of {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-muted);
	}

	.score-caption {
		display: block;
		font-size: 0.74rem;
		font-weight: 800;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-top: 5px;
	}

	.pillars-container {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.pillar-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.pillar-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.86rem;
		color: var(--text-secondary);
		font-weight: 700;
	}

	.pillar-score {
		font-weight: 800;
		color: var(--text-primary);
	}

	.mini-track {
		height: 8px;
		background: var(--surface-2);
		border-radius: var(--border-radius-pill);
		overflow: hidden;
		border: 1px solid var(--border-color);
	}

	.mini-fill {
		height: 100%;
		border-radius: var(--border-radius-pill);
		transition: width 0.3s ease;
	}

	/* Badges Strip */
	.badges-header {
		margin-bottom: 0.65rem;
	}

	.badges-title {
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.badges-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.badge-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		padding: 0.45rem 0.85rem;
		border-radius: var(--border-radius-pill);
		font-size: 0.84rem;
		font-weight: 800;
		color: var(--text-primary);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.badge-pill.locked {
		opacity: 0.55;
		filter: grayscale(0.8);
	}

	.badge-emoji {
		font-size: 1.05rem;
	}

	.badge-title {
		font-size: 0.84rem;
	}

	@media (max-width: 480px) {
		.score-breakdown-row {
			grid-template-columns: 100px 1fr;
			gap: 0.85rem;
		}
	}
</style>
