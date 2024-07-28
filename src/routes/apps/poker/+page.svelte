<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import {
		createPokerStore,
		rooms,
		currentRoom,
		roomParticipants,
		roomTickets,
		activeParticipants
	} from '$lib/stores/poker';
	import type { Room, PresenceParticipant } from '$lib/stores/poker';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import { ChevronDown, ChevronUp, Trash2 } from 'lucide-svelte';

	let newRoomName = '';
	let isOpen = false;
	let isLoading = true;
	let error: string | null = null;

	$: ({ supabase, session, user } = $page.data);
	$: store = createPokerStore(supabase as SupabaseClient);

	let unsubscribeFromRoom: (() => void) | undefined;

	onMount(async () => {
		if (supabase) {
			try {
				await store.fetchRooms();
				store.subscribeToRooms();
			} catch (e) {
				console.error('Error fetching rooms:', e);
				error = 'Failed to load rooms. Please try again.';
			} finally {
				isLoading = false;
			}
		}
		if (browser) {
			window.addEventListener('beforeunload', handleBeforeUnload);
		}
	});

	onDestroy(() => {
		store.unsubscribeFromRooms();
		if (unsubscribeFromRoom) {
			unsubscribeFromRoom();
		}
		if (browser) {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
		if ($currentRoom && user) {
			store.leaveRoom($currentRoom.id, user.id);
		}
	});

	async function handleCreateRoom() {
		if (newRoomName && user) {
			await store.createRoom(newRoomName, user.id, 'JIRA');
			newRoomName = '';
		}
	}

	async function handleDeleteRoom(roomId: string) {
		if (user) {
			await store.deleteRoom(roomId, user.id);
		}
	}

	function canDeleteRoom(room: Room): boolean {
		return user && room.created_by === user.id;
	}

</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">Planning Poker</h1>

	{#if isLoading}
		<p>Loading...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if user}
		<Card>
			<CardHeader>
				<CardTitle>Create a New Room</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-center space-x-2">
					<Input bind:value={newRoomName} placeholder="Enter room name" />
					<Button on:click={handleCreateRoom}>Create</Button>
				</div>
			</CardContent>
		</Card>

		<Collapsible bind:open={isOpen} class="mt-6">
			<CollapsibleTrigger>
				<Button variant="outline" class="w-full justify-between">
					<span>All Sessions</span>
					<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="h-4 w-4" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each $rooms as room (room.id)}
						<Card>
							<CardHeader>
								<CardTitle class="flex items-center justify-between">
									{room.name}
									{#if canDeleteRoom(room)}
										<Button variant="ghost" size="icon" on:click={() => handleDeleteRoom(room.id)}>
											<Trash2 class="h-4 w-4" />
										</Button>
									{/if}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Button on:click={() => handleJoinRoom(room)}>Join Room</Button>
							</CardContent>
						</Card>
					{/each}
				</div>
			</CollapsibleContent>
		</Collapsible>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Please Sign In</CardTitle>
			</CardHeader>
			<CardContent>
				<p>You need to be signed in to create or join planning sessions.</p>
			</CardContent>
		</Card>
	{/if}
</div>
