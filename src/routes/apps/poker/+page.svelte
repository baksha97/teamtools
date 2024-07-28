<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { rooms, currentRoom, pokerStore } from '$lib/stores/poker';
    import type { Room } from '$lib/stores/poker';
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$lib/components/ui/collapsible";
    import { ChevronDown, ChevronUp, Trash2 } from 'lucide-svelte';

    let newRoomName = '';
    let isOpen = false;
    let isLoading = true;
    let error: string | null = null;

    $: ({ supabase, session, user } = $page.data);
    $: store = pokerStore(supabase);

    onMount(async () => {
        if (supabase) {
            try {
                await store.fetchRooms();
                store.subscribeToRooms();
            } catch (e) {
                console.error("Error fetching rooms:", e);
                error = "Failed to load rooms. Please try again.";
            } finally {
                isLoading = false;
            }
        }
    });

    onDestroy(() => {
        store.unsubscribeFromRooms();
    });

    function handleCreateRoom() {
        if (newRoomName && user) {
            store.createRoom(newRoomName, user.id);
            newRoomName = '';
        }
    }

    function handleJoinRoom(room: Room) {
        if (room) {
            store.setCurrentRoom(room);
        }
    }

    function handleDeleteRoom(roomId: string) {
        if (user) {
            store.deleteRoom(roomId, user.id);
        }
    }

    function canDeleteRoom(room: Room): boolean {
        return user && room.created_by === user.id;
    }
</script>

{#key user}
<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Planning Poker</h1>

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
                <div class="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                    {#each $rooms as room (room.id)}
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex justify-between items-center">
                                    {room.name}
                                    {#if canDeleteRoom(room)}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            on:click={() => handleDeleteRoom(room.id)}
                                        >
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

        {#if $currentRoom}
            <Card class="mt-6">
                <CardHeader>
                    <CardTitle>Current Room: {$currentRoom.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>This is where your poker planning interface will go.</p>
                </CardContent>
            </Card>
        {/if}

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
{/key}