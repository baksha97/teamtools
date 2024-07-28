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
    
    let roomStore: RoomStoreType;
    let newTicket = '';
    let participants: any[] = [];
    let currentTicket: string | null = null;
    let votes: Record<string, string> = {};
    export let data;
    $: roomId = $page.params.roomId;
    const { session, user, supabase } = data;

    $: if (roomId && supabase && session) {
        initializeRoom();
    }

    function initializeRoom() {
        if (!roomStore && user && supabase) {
            roomStore = createRoomStore(supabase);
            roomStore.joinRoom(roomId, user.id);

            const unsubscribe = roomStore.subscribe((state) => {
                participants = state.participants;
                currentTicket = state.currentTicket;
                votes = state.votes;
                console.log('Store updated:', { participants, currentTicket, votes });
            });

            onDestroy(unsubscribe);
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
            console.log('Handling vote:', user.id, vote);
            roomStore.vote(user.id, vote);
        }
    }

    function handleResetVotes() {
        if (roomStore) {
            roomStore.resetVotes();
        }
    }

    $: console.log('User:', user);
    $: console.log('Votes in component:', votes);
    $: console.log('Current ticket in component:', currentTicket);
</script>

{#if session && roomId && supabase}
    <div class="container mx-auto p-4">
        <Card.Root class="mb-6">
            <Card.Content>
                <h1 class="text-2xl font-bold mb-4">Room: {roomId}</h1>
                <div class="flex flex-wrap gap-2">
                    {#each participants as participant}
                        <Avatar.Root>
                            <Avatar.Image src={`https://api.dicebear.com/6.x/initials/svg?seed=${participant.user_id}`} alt={participant.user_id} />
                            <Avatar.Fallback>{participant.user_id.substring(0, 2)}</Avatar.Fallback>
                        </Avatar.Root>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root class="mb-6">
            <Card.Content>
                <h2 class="text-xl font-semibold mb-2">Current Ticket</h2>
                <p class="mb-4">{currentTicket || 'No ticket set'}</p>
                <div class="flex gap-2">
                    <Input bind:value={newTicket} placeholder="Enter new ticket" />
                    <Button on:click={handleSetTicket}>Set Ticket</Button>
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root class="mb-6">
            <Card.Content>
                <h2 class="text-xl font-semibold mb-2">Votes</h2>
                <div class="grid grid-cols-3 gap-2 mb-4">
                    {#each ['1', '2', '3', '5', '8', '13', '21', '34', '?'] as voteOption}
                        <Button variant={votes[user.id] === voteOption ? 'default' : 'outline'} on:click={() => handleVote(voteOption)}>
                            {voteOption}
                        </Button>
                    {/each}
                </div>
                <Button on:click={handleResetVotes}>Reset Votes</Button>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Content>
                <h2 class="text-xl font-semibold mb-2">Vote Results</h2>
                <ul>
                    {#each Object.entries(votes) as [userId, vote]}
                        <li>{userId}: {vote}</li>
                    {/each}
                </ul>
            </Card.Content>
        </Card.Root>
    </div>
{:else}
    <p>Loading or not authenticated...</p>
{/if}