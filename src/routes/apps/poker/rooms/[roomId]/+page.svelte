<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { RoomStore, type RoomState } from '$lib/stores/roomStore';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Loader2, Crown, ChevronDown, ChevronUp, Users, Settings } from 'lucide-svelte';
	import VoteReveal from '$lib/components/VoteReveal.svelte';
	import * as Switch from '$lib/components/ui/switch';
	import * as Label from '$lib/components/ui/label';
  
	export let data;
	const { session, user, supabase } = data;
	$: roomId = $page.params.roomId;
  
	let roomStore: RoomStore;
	let state: RoomState | null = null;
	let unsubscribe: () => void;
	let newTicket = '';
	let isParticipantListOpen = true;
  
	$: isRoomOwner = state?.roomOwner === user?.id;
	$: isVotingComplete = state?.participants.length === Object.keys(state?.votes || {}).length;
  
	onMount(async () => {
	  if (roomId && supabase && session && user) {
		roomStore = RoomStore.setContext(supabase);
		unsubscribe = roomStore.subscribe(s => state = s);
		
		await roomStore.initializeRoom(
		  roomId,
		  user.id,
		  user.user_metadata.avatar_url,
		  user.user_metadata.full_name || user.email
		);
	  }
	});
  
	onDestroy(() => {
	  if (unsubscribe) unsubscribe();
	  if (roomStore) roomStore.leaveRoom();
	});
  
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
  
	function leaveRoom() {
	  if (roomStore) {
		roomStore.leaveRoom();
		goto('/apps/poker/rooms');
	  }
	}
  
	$: voteOptions = ['1', '2', '3', '5', '8', '13', '21', '34', '?'];
	$: userVote = state?.votes?.[user?.id];
	$: voteResults = Object.entries(state?.votes || {}).reduce(
	  (acc, [userId, vote]) => {
		acc[vote] = (acc[vote] || 0) + 1;
		return acc;
	  },
	  {} as Record<string, number>
	);
	$: nonVoters = state?.participants.filter(p => !state.votes[p.user_id]) || [];
</script>

{#if !state || state.isLoading}
  <div class="flex justify-center items-center h-screen">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
{:else if state.error}
  <div class="flex justify-center items-center h-screen">
    <p class="text-red-500">Error: {state.error}</p>
  </div>
{:else}
	<div class="container mx-auto max-w-3xl p-4">
	  <Card.Root class="mb-6">
		<Collapsible.Root bind:open={isParticipantListOpen}>
		  <Card.Header>
			<div class="flex items-center justify-between">
			  <Collapsible.Trigger class="flex items-center">
				<Card.Title class="text-2xl">{state.roomId}</Card.Title>
				{#if isParticipantListOpen}
				  <ChevronUp class="h-4 w-4 ml-2" />
				{:else}
				  <ChevronDown class="h-4 w-4 ml-2" />
				{/if}
			  </Collapsible.Trigger>
			  <div class="flex items-center bg-primary text-primary-foreground rounded-full px-3 py-1">
				<Users class="h-4 w-4 mr-1" />
				<span class="font-bold">{state.participants.length}</span>
			  </div>
			</div>
		  </Card.Header>
		  <Collapsible.Content>
			<Card.Content>
			  <div class="space-y-4">
				<div class="space-y-2">
				  {#each state.participants as participant}
					<div class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
					  <div class="relative">
						<Avatar.Root class="h-10 w-10 border-2 border-primary">
						  <Avatar.Image src={participant.avatar_url} alt={participant.name} />
						  <Avatar.Fallback>{participant.name.substring(0, 2).toUpperCase()}</Avatar.Fallback>
						</Avatar.Root>
						{#if participant.user_id === state.roomOwner}
						  <Crown class="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
						{/if}
					  </div>
					  <span class="font-medium">{participant.name}</span>
					  {#if state.votes[participant.user_id]}
						<span class="ml-auto text-sm text-green-500">Voted</span>
					  {:else}
						<span class="ml-auto text-sm text-gray-400">Not voted</span>
					  {/if}
					</div>
				  {/each}
				</div>
				
				{#if isRoomOwner}
				  <div class="pt-4 border-t">
					<h3 class="text-lg font-semibold mb-2 flex items-center">
					  <Settings class="h-5 w-5 mr-2" />
					  Room Settings
					</h3>
					<div class="space-y-4">
					  <div class="flex items-center justify-between">
						<Label.Root for="auto-reveal">Auto Reveal Votes</Label.Root>
						<Switch.Root id="auto-reveal" />
					  </div>
					  <div class="flex items-center justify-between">
						<Label.Root for="allow-change-vote">Allow Changing Votes</Label.Root>
						<Switch.Root id="allow-change-vote" />
					  </div>
					  <Input placeholder="Custom voting options (comma-separated)" />
					  <Button variant="outline" class="w-full">Save Settings</Button>
					  <Button variant="destructive" class="w-full" on:click={handleResetVotes}>Reset Votes</Button>
					</div>
				  </div>
				{/if}
			  </div>
			</Card.Content>
		  </Collapsible.Content>
		</Collapsible.Root>
	  </Card.Root>
  
	  <Card.Root class="mb-6">
		<Card.Header>
		  <Card.Title>Current Ticket</Card.Title>
		</Card.Header>
		<Card.Content>
		  {#if state.currentTicket}
			<p class="mb-4 text-lg font-medium">{state.currentTicket}</p>
		  {:else}
			<p class="mb-4 text-muted-foreground">No ticket set</p>
		  {/if}
		  {#if isRoomOwner}
			<div class="flex gap-2">
			  <Input bind:value={newTicket} placeholder="Enter new ticket" />
			  <Button on:click={handleSetTicket} disabled={!newTicket}>Set Ticket</Button>
			</div>
		  {/if}
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
				<VoteReveal votes={state.votes} participants={state.participants} />
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
			  {#if nonVoters.length > 0}
				<div class="mt-4">
				  <p class="mb-2 text-sm font-medium">Waiting for:</p>
				  <div class="flex flex-wrap justify-center gap-2">
					{#each nonVoters as nonVoter}
					  <Avatar.Root class="border-2 border-primary">
						<Avatar.Image src={nonVoter.avatar_url} alt={nonVoter.name} />
						<Avatar.Fallback>{nonVoter.name.substring(0, 2).toUpperCase()}</Avatar.Fallback>
					  </Avatar.Root>
					{/each}
				  </div>
				</div>
			  {/if}
			</div>
		  {/if}
		</Card.Content>
	  </Card.Root>
  
	  <div class="mt-6">
		<Button variant="outline" class="w-full" on:click={leaveRoom}>Leave Room</Button>
	  </div>
	</div>
{/if}