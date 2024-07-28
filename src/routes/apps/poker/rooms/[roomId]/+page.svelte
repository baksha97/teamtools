<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { createRoomStore } from '$lib/stores/roomStore';
	import type { RoomStoreType } from '$lib/stores/roomStore';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Loader2 } from 'lucide-svelte';
	import VoteReveal from '$lib/components/VoteReveal.svelte';

	let roomStore: RoomStoreType;
	let newTicket = '';
	let participants: any[] = [];
	let currentTicket: string | null = null;
	let votes: Record<string, string> = {};
	let isVotingComplete = false;
	export let data;
	$: roomId = $page.params.roomId;
	const { session, user, supabase } = data;

	$: if (roomId && supabase && session) {
		initializeRoom();
	}

	function initializeRoom() {
		if (!roomStore && user && supabase) {
			roomStore = createRoomStore(supabase);
			roomStore.joinRoom(roomId, user.id, user.user_metadata.avatar_url);

			const unsubscribe = roomStore.subscribe((state) => {
				participants = state.participants;
				currentTicket = state.currentTicket;
				votes = state.votes;
				isVotingComplete = Object.keys(votes).length === participants.length;
			});

			onDestroy(() => {
				if (roomStore) {
					roomStore.leaveRoom();
				}
				unsubscribe();
			});
		}
	}

	function handleSetTicket() {
		if (roomStore && newTicket) {
			roomStore.setCurrentTicket(newTicket);
			newTicket = '';
		}
	}

	function handleVote(vote: string) {
		if (roomStore && user) {
			roomStore.vote(user.id, vote);
		}
	}

	function handleResetVotes() {
		if (roomStore) {
			roomStore.resetVotes();
		}
	}

	$: voteOptions = ['1', '2', '3', '5', '8', '13', '21', '34', '?'];
	$: userVote = votes[user?.id];
	$: voteResults = Object.entries(votes).reduce(
		(acc, [userId, vote]) => {
			acc[vote] = (acc[vote] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);
</script>

{#if session && roomId && supabase}
	<div class="container mx-auto max-w-3xl p-4">
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="text-2xl">Planning Poker: Room {roomId}</Card.Title>
				<Card.Description>Participants: {participants.length}</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each participants as participant}
						<Avatar.Root class="border-2 border-primary">
							<Avatar.Image src={participant.avatar_url} alt={participant.user_id} />
							<Avatar.Fallback>{participant.user_id.substring(0, 2).toUpperCase()}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title>Current Ticket</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if currentTicket}
					<p class="mb-4 text-lg font-medium">{currentTicket}</p>
				{:else}
					<p class="mb-4 text-muted-foreground">No ticket set</p>
				{/if}
				<div class="flex gap-2">
					<Input bind:value={newTicket} placeholder="Enter new ticket" />
					<Button on:click={handleSetTicket} disabled={!newTicket}>Set Ticket</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title>Your Vote</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="mb-4 grid grid-cols-3 gap-2">
					{#each voteOptions as voteOption}
						<Button
							variant={userVote === voteOption ? 'default' : 'outline'}
							on:click={() => handleVote(voteOption)}
							disabled={isVotingComplete}
						>
							{voteOption}
						</Button>
					{/each}
				</div>
				<Button on:click={handleResetVotes} variant="destructive">Reset Votes</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Vote Results</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if isVotingComplete}
					<Collapsible.Root>
						<Collapsible.Trigger class="mb-4 w-full">
							<Button variant="outline" class="w-full">Show Detailed Results</Button>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<VoteReveal {votes} {participants} />
						</Collapsible.Content>
					</Collapsible.Root>
					<div class="mt-4 grid grid-cols-3 gap-4">
						{#each Object.entries(voteResults) as [vote, count]}
							<div class="rounded border p-2 text-center">
								<div class="text-2xl font-bold">{vote}</div>
								<div class="text-sm text-muted-foreground">
									{count} vote{count !== 1 ? 's' : ''}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-4 text-center">
						<Loader2 class="mx-auto mb-2 h-8 w-8 animate-spin" />
						<p class="text-muted-foreground">Waiting for all votes...</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<Loader2 class="h-12 w-12 animate-spin" />
	</div>
{/if}
