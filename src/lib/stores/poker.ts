// $lib/stores/poker.ts

import { writable, get } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Room {
    id: string;
    name: string;
    created_by: string;
    // Add other fields as necessary
}

export interface RoomEvent {
    id: string;
    room_id: string;
    user_id: string;
    event_type: string;
    event_data: any;
    // Add other fields as necessary
}

export const rooms = writable<Room[]>([]);
export const currentRoom = writable<Room | null>(null);

let roomListener: ReturnType<SupabaseClient['channel']>;
let roomsListener: ReturnType<SupabaseClient['channel']>;

export const pokerStore = (supabase: SupabaseClient) => ({
    createRoom: async (roomName: string, userId: string) => {
        const { data, error } = await supabase
            .from('poker_rooms')
            .insert({ name: roomName, created_by: userId })
            .select();
        if (error) console.error('Error creating room:', error);
        else rooms.update(rs => [...rs, data[0]]);
    },

    deleteRoom: async (roomId: string, userId: string) => {
        console.log(`Attempting to delete room ${roomId} by user ${userId}`);
        const { data, error } = await supabase
            .from('poker_rooms')
            .delete()
            .match({ id: roomId, created_by: userId })
            .select();
        
        if (error) {
            console.error('Error deleting room:', error);
        } else if (data) {
            console.log('Room deleted successfully:', data);
        } else {
            console.log('No room was deleted. This might mean the room doesn\'t exist or the user doesn\'t have permission.');
        }
        return { data, error };
    },

    fetchRooms: async () => {
        const { data, error } = await supabase
            .from('poker_rooms')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching rooms:', error);
        else rooms.set(data);
    },

    subscribeToRooms: () => {
        roomsListener = supabase
            .channel('public:poker_rooms')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'poker_rooms' }, 
                async (payload) => {
                    console.log('Rooms update:', payload);
                    if (payload.eventType === 'DELETE') {
                        // For deletions, update the store directly
                        rooms.update(currentRooms => currentRooms.filter(room => room.id !== payload.old.id));
                    } else {
                        // For inserts and updates, refetch all rooms
                        const { data, error } = await supabase.from('poker_rooms').select('*').order('created_at', { ascending: false });
                        if (error) console.error('Error fetching rooms:', error);
                        else rooms.set(data);
                    }
                }
            )
            .subscribe();
    },

    unsubscribeFromRooms: () => {
        if (roomsListener) supabase.removeChannel(roomsListener);
    },

    listenToRoom: (roomId: string) => {
        if (roomListener) supabase.removeChannel(roomListener);
        
        roomListener = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'poker_room_events', filter: `room_id=eq.${roomId}` }, 
                (payload) => {
                    console.log('Room update:', payload);
                    // Update the currentRoom store based on the payload
                    // This is where you'd handle real-time updates to the room
                }
            )
            .subscribe();
    },

    stopListening: () => {
        if (roomListener) supabase.removeChannel(roomListener);
    },

    setCurrentRoom: (room: Room | null) => {
        currentRoom.set(room);
        if (room) {
            pokerStore(supabase).listenToRoom(room.id);
        } else {
            pokerStore(supabase).stopListening();
        }
        
        // Add this subscription to handle current room deletion
        const unsubscribe = rooms.subscribe(currentRooms => {
            if (room && !currentRooms.some(r => r.id === room.id)) {
                // If the current room is no longer in the rooms list, set it to null
                currentRoom.set(null);
                pokerStore(supabase).stopListening();
                unsubscribe();
            }
        });
    },
});