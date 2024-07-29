<script lang="ts">
  import { onMount } from 'svelte';
  import { createRoomStore } from '$lib/stores/roomStore';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { RoomStoreType, Room } from '$lib/stores/roomStore';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Plus, Loader2 } from 'lucide-svelte';

  let newRoomId = '';
  let roomStore: RoomStoreType;
  let rooms: Room[] = [];
  let isLoading = true;

  $: supabase = $page.data.supabase;
  $: user = $page.data.user;

  onMount(async () => {
    roomStore = createRoomStore(supabase);
    roomStore.subscribe(state => {
      rooms = state.rooms;
    });
    await roomStore.listRooms();
    await roomStore.initRoomSubscription();
    isLoading = false;
  });

  async function handleCreateRoom() {
    if (newRoomId.trim() === '') {
      alert('Please enter a room ID');
      return;
    }
    await roomStore.createRoom(newRoomId, user.id);
    goto(`/apps/poker/rooms/${newRoomId}`);
  }
</script>

<div class="container mx-auto max-w-3xl p-4">
  <Card.Root class="mb-6">
      <Card.Header>
          <Card.Title class="text-3xl font-bold">Planning Poker</Card.Title>
      </Card.Header>
  </Card.Root>

  <Card.Root class="mb-6">
      <Card.Header>
          <Card.Title>Create a New Room</Card.Title>
      </Card.Header>
      <Card.Content>
          <div class="flex items-center space-x-2">
              <Input bind:value={newRoomId} placeholder="Enter room ID" />
              <Button on:click={handleCreateRoom}><Plus class="h-4 w-4 mr-2" /> Create</Button>
          </div>
      </Card.Content>
  </Card.Root>

  <Card.Root>
      <Card.Header>
          <Card.Title class="text-2xl">Available Rooms</Card.Title>
      </Card.Header>
      <Card.Content>
          {#if isLoading}
              <div class="flex justify-center items-center p-4">
                  <Loader2 class="h-8 w-8 animate-spin" />
              </div>
          {:else if rooms.length === 0}
              <p class="text-center text-gray-500">No rooms available. Create one to get started!</p>
          {:else}
              <div class="space-y-4">
                  {#each rooms as room (room.id)}
                      <div class="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                          <span class="font-medium">{room.id}</span>
                          <Button variant="outline" size="sm" on:click={() => goto(`/apps/poker/rooms/${room.id}`)}>
                              Join
                          </Button>
                      </div>
                  {/each}
              </div>
          {/if}
      </Card.Content>
  </Card.Root>
</div>