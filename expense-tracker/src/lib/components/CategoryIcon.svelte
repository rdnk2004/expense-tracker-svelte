<script lang="ts">
	import {
		Utensils,
		Gamepad2,
		Home,
		Car,
		ShoppingBag,
		Package,
		Briefcase,
		HeartPulse,
		GraduationCap,
		Plane,
		Zap,
		Coffee,
		Music,
		Smartphone,
		Wifi,
		Dumbbell,
		CreditCard,
		PiggyBank,
		Receipt,
		Sparkles,
		ShieldCheck,
		Compass,
		Award
	} from 'lucide-svelte';

	// Props
	interface Props {
		icon: string;
		size?: number;
		color?: string;
		class?: string;
	}

	let { icon, size = 24, color = undefined, class: className = '' }: Props = $props();

	// Map icon names to components
	const iconMap: Record<string, any> = {
		Utensils: Utensils,
		Gamepad2: Gamepad2,
		Home: Home,
		Car: Car,
		ShoppingBag: ShoppingBag,
		Package: Package,
		Briefcase: Briefcase,
		HeartPulse: HeartPulse,
		GraduationCap: GraduationCap,
		Plane: Plane,
		Zap: Zap,
		Coffee: Coffee,
		Music: Music,
		Smartphone: Smartphone,
		Wifi: Wifi,
		Dumbbell: Dumbbell,
		CreditCard: CreditCard,
		PiggyBank: PiggyBank,
		Receipt: Receipt,
		Sparkles: Sparkles,
		ShieldCheck: ShieldCheck,
		Compass: Compass,
		Award: Award
	};

	let IconComponent = $derived(iconMap[icon] || Package);
</script>

<IconComponent {size} {color} class={className} />
