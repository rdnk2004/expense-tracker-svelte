<script lang="ts">
	import { analystInsights } from '$lib/stores';
	import {
		Sparkles,
		AlertTriangle,
		TrendingUp,
		Lightbulb,
		ArrowRight,
		ChevronRight,
		Compass,
		Bot
	} from 'lucide-svelte';

	let insightsState = $derived($analystInsights);
	let activeInsightIndex = $state(0);

	let currentInsight = $derived(
		insightsState.insights[activeInsightIndex] || insightsState.topInsight
	);

	function nextInsight() {
		if (insightsState.insights.length > 1) {
			activeInsightIndex = (activeInsightIndex + 1) % insightsState.insights.length;
		}
	}
</script>

{#if currentInsight}
	<div
		class="analyst-card"
		class:type-warning={currentInsight.type === 'warning'}
		class:type-opportunity={currentInsight.type === 'opportunity'}
		class:type-praise={currentInsight.type === 'praise'}
		class:type-tip={currentInsight.type === 'tip'}
	>
		<div class="card-top-row">
			<div class="analyst-badge">
				<Bot size={14} color="var(--accent-primary)" />
				<span>Financial Analyst Pulse</span>
			</div>

			{#if insightsState.insights.length > 1}
				<button class="cycle-pill" onclick={nextInsight} title="Next Insight">
					<span>{activeInsightIndex + 1}/{insightsState.insights.length}</span>
					<ChevronRight size={12} />
				</button>
			{/if}
		</div>

		<div class="insight-content-block">
			<div class="insight-icon-col">
				{#if currentInsight.type === 'warning'}
					<AlertTriangle size={20} class="text-danger" />
				{:else if currentInsight.type === 'opportunity'}
					<Sparkles size={20} class="text-accent" />
				{:else if currentInsight.type === 'praise'}
					<TrendingUp size={20} class="text-success" />
				{:else}
					<Lightbulb size={20} class="text-warning" />
				{/if}
			</div>

			<div class="insight-text-col">
				<h4 class="insight-title">{currentInsight.title}</h4>
				<p class="insight-message">{currentInsight.message}</p>
			</div>
		</div>

		{#if currentInsight.actionLabel && currentInsight.actionHref}
			<div class="card-footer-row">
				<a href={currentInsight.actionHref} class="action-pill-btn">
					<span>{currentInsight.actionLabel}</span>
					<ArrowRight size={13} />
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.analyst-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 22px;
		padding: 16px 18px;
		margin-bottom: 18px;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.analyst-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 5px;
	}

	.type-warning::before { background: #FF3366; }
	.type-opportunity::before { background: var(--accent-primary); }
	.type-praise::before { background: #10B981; }
	.type-tip::before { background: #F59E0B; }

	.type-warning {
		background: linear-gradient(135deg, rgba(255, 51, 102, 0.05) 0%, var(--bg-card) 100%);
		border-color: rgba(255, 51, 102, 0.25);
	}

	.type-opportunity {
		background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, var(--bg-card) 100%);
		border-color: rgba(124, 58, 237, 0.25);
	}

	.type-praise {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-card) 100%);
		border-color: rgba(16, 185, 129, 0.25);
	}

	.card-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.analyst-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}


	.cycle-pill {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 9999px;
		padding: 2px 8px;
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 2px;
		cursor: pointer;
	}

	.insight-content-block {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.insight-icon-col {
		margin-top: 2px;
		flex-shrink: 0;
	}

	.insight-text-col {
		flex: 1;
	}

	.insight-title {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.insight-message {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.card-footer-row {
		display: flex;
		justify-content: flex-end;
	}

	.action-pill-btn {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--accent-primary);
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		text-decoration: none;
		transition: all 0.2s;
	}

	.action-pill-btn:hover {
		background: var(--accent-primary);
		color: white;
		border-color: var(--accent-primary);
	}
</style>
