<script lang="ts">
	import { analystInsights } from '$lib/stores';
	import {
		Sparkles,
		AlertTriangle,
		TrendingUp,
		Lightbulb,
		ArrowRight,
		ChevronRight,
		Bot,
		Zap
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
				<Zap size={13} color="var(--accent-primary)" />
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
					<div class="icon-bubble warning">
						<AlertTriangle size={16} />
					</div>
				{:else if currentInsight.type === 'opportunity'}
					<div class="icon-bubble opportunity">
						<Sparkles size={16} />
					</div>
				{:else if currentInsight.type === 'praise'}
					<div class="icon-bubble praise">
						<TrendingUp size={16} />
					</div>
				{:else}
					<div class="icon-bubble tip">
						<Lightbulb size={16} />
					</div>
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
		border-radius: var(--border-radius);
		padding: 1.15rem 1.25rem;
		margin-bottom: 1.15rem;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.analyst-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
	}

	.type-warning::before { background: var(--danger); }
	.type-opportunity::before { background: #06B6D4; }
	.type-praise::before { background: var(--success); }
	.type-tip::before { background: var(--warning); }

	.type-warning {
		background: linear-gradient(135deg, rgba(244, 63, 94, 0.06) 0%, var(--bg-card) 100%);
		border-color: var(--danger-border);
	}

	.type-opportunity {
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, var(--bg-card) 100%);
		border-color: rgba(6, 182, 212, 0.25);
	}

	.type-praise {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-card) 100%);
		border-color: var(--success-border);
	}

	.type-tip {
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, var(--bg-card) 100%);
		border-color: var(--warning-border);
	}

	.card-top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.analyst-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.cycle-pill {
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--border-radius-pill);
		padding: 2px 8px;
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 2px;
		cursor: pointer;
	}

	.insight-content-block {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.insight-icon-col {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.icon-bubble {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-bubble.warning { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); }
	.icon-bubble.opportunity { background: rgba(6, 182, 212, 0.15); color: #06B6D4; border: 1px solid rgba(6, 182, 212, 0.3); }
	.icon-bubble.praise { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
	.icon-bubble.tip { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }

	.insight-text-col {
		flex: 1;
	}

	.insight-title {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 3px;
		line-height: 1.25;
	}

	.insight-message {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.45;
		margin: 0;
	}

	.card-footer-row {
		display: flex;
		justify-content: flex-end;
	}

	.action-pill-btn {
		background: var(--surface-2);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 4px 12px;
		border-radius: var(--border-radius-pill);
		font-size: 0.75rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.action-pill-btn:hover {
		background: var(--accent-primary);
		color: #080C14;
		border-color: var(--accent-primary);
	}
</style>
