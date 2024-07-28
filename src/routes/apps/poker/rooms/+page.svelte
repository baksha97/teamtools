<script lang="ts">
    import { onMount } from 'svelte';
    import { createRoomStore } from '$lib/stores/roomStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { RoomStoreType, Room } from '$lib/stores/roomStore';
  
    let newRoomId = '';
    let roomStore: RoomStoreType;
    let rooms: Room[] = [];
  
    $: supabase = $page.data.supabase;
    $: user = $page.data.user;
  
    onMount(async () => {
      roomStore = createRoomStore(supabase);
      roomStore.subscribe(state => {
        rooms = state.rooms;
      });
      await roomStore.listRooms();
      await roomStore.initRoomSubscription();
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
  
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }
    .button {
      background-color: #007bff;
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .button:hover {
      background-color: #0056b3;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      background: #f8f9fa;
      margin: 0.5rem 0;
      padding: 0.5rem;
      border-radius: 4px;
    }
    input {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: calc(100% - 1rem);
      margin-top: 0.5rem;
    }
  </style>
  
  <div class="container">
    <h1>Rooms</h1>
    <ul>
      {#each rooms as room}
        <li><a href={`/apps/poker/rooms/${room.id}`}>{room.id} (Created by: {room.creator_id})</a></li>
      {/each}
    </ul>
  
    <input type="text" bind:value={newRoomId} placeholder="Enter room ID" />
    <button class="button" on:click={handleCreateRoom}>Create Room</button>
  </div>
  