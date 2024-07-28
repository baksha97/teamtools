<script lang="ts">
	import { goto } from '$app/navigation'; // Import the goto function from SvelteKit
	import * as Card from '$lib/components/ui/card'; // Import Card components
	import * as Avatar from '$lib/components/ui/avatar'; // Import Avatar components
	import { Button } from '$lib/components/ui/button'; // Import Button component

	// Define your micro apps here
	const microApps = [
		{ name: 'Profile', path: '/profile', icon: '👤' },
		{ name: 'Poker', path: '/apps/poker/rooms', icon: '📁' },
		{ name: 'App 3', path: '/app3', icon: '📅' }
		// Add more apps as needed
	];

	export let fullName: string; // Define the type for fullName
	export let avatar: string; // Define the type for avatar
</script>

<div class="p-6">
	<div class="mb-6 flex items-center gap-4">
		<Avatar.Root class="h-12 w-12">
			{#if avatar}
				<Avatar.Image src={avatar} alt={`${fullName}`} />
			{/if}
			<Avatar.Fallback>{'23'}</Avatar.Fallback>
		</Avatar.Root>
		<h1 class="text-2xl font-bold">Welcome, {fullName}!</h1>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each microApps as app}
			<Card.Root class="cursor-pointer transition-colors hover:bg-secondary">
				<Button variant="ghost" class="h-full w-full" on:click={() => goto(app.path)}>
					<Card.Header>
						<div class="mb-2 text-4xl">{app.icon}</div>
						<Card.Title>{app.name}</Card.Title>
					</Card.Header>
				</Button>
			</Card.Root>
		{/each}
	</div>
</div>
