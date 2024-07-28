import { writable } from 'svelte/store';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface Room {
  id: string;
  name: string;
  created_by: string;
  ticket_source: string;
  current_ticket_id: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar: string | null;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string | null;
  profile: UserProfile | null;
}

export interface RoomTicket {
  id: string;
  room_id: string;
  ticket_id: string;
  created_at: string;
}

export interface PresenceParticipant {
  user_id: string;
  presence_ref: string;
  profile?: UserProfile;
}

export const rooms = writable<Room[]>([]);
export const currentRoom = writable<Room | null>(null);
export const roomParticipants = writable<RoomParticipant[]>([]);
export const roomTickets = writable<RoomTicket[]>([]);
export const activeParticipants = writable<PresenceParticipant[]>([]);

export const createPokerStore = (supabase: SupabaseClient) => {
  let roomsListener: RealtimeChannel | null = null;
  let roomListener: RealtimeChannel | null = null;
  let presenceChannel: RealtimeChannel | null = null;

  return {
    createRoom: async (roomName: string, userId: string, ticketSource: string) => {
      const { data, error } = await supabase
        .from('poker_rooms')
        .insert({ name: roomName, created_by: userId, ticket_source: ticketSource })
        .select();

      if (error) {
        console.error('Error creating room:', error);
        return { error };
      }

      rooms.update(rs => [...rs, data[0]]);
      return { data };
    },

    deleteRoom: async (roomId: string, userId: string) => {
      const { data, error } = await supabase
        .from('poker_rooms')
        .delete()
        .match({ id: roomId, created_by: userId })
        .select();

      if (error) {
        console.error('Error deleting room:', error);
        return { error };
      }

      rooms.update(rs => rs.filter(r => r.id !== roomId));
      return { data };
    },

    fetchRooms: async () => {
      const { data, error } = await supabase
        .from('poker_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return { error };
      }

      rooms.set(data);
      return { data };
    },

    joinRoom: async (roomId: string, userId: string) => {
      try {
        const { data, error } = await supabase
          .from('room_participants')
          .upsert({ room_id: roomId, user_id: userId }, { onConflict: 'room_id,user_id' })
          .select();

        if (error) {
          console.error('Error joining room:', error);
          return { error };
        }

        console.log('Successfully joined room:', data);
        // Additional logic for fetching profile and setting up presence can be added here
        return { data };
      } catch (error) {
        console.error('Unexpected error in joinRoom:', error);
        return { error };
      }
    },

    leaveRoom: async (roomId: string, userId: string) => {
      if (presenceChannel) {
        await presenceChannel.untrack();
        presenceChannel.unsubscribe();
        presenceChannel = null;
      }
      activeParticipants.set([]);
    },

    addTicket: async (roomId: string, ticketId: string) => {
      const { data, error } = await supabase
        .from('room_tickets')
        .insert({ room_id: roomId, ticket_id: ticketId })
        .select();

      if (error) {
        console.error('Error adding ticket:', error);
        return { error };
      }

      roomTickets.update(tickets => [...tickets, data[0]]);
      return { data };
    },

    setCurrentTicket: async (roomId: string, ticketId: string) => {
      const { data, error } = await supabase
        .from('poker_rooms')
        .update({ current_ticket_id: ticketId })
        .match({ id: roomId })
        .select();

      if (error) {
        console.error('Error setting current ticket:', error);
        return { error };
      }

      currentRoom.update(room => room && room.id === roomId ? { ...room, current_ticket_id: ticketId } : room);
      return { data };
    },

    fetchRoomDetails: async (roomId: string) => {
      const { data: room, error: roomError } = await supabase
        .from('poker_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room details:', roomError);
        return { error: roomError };
      }

      const { data: participants, error: participantsError } = await supabase
        .from('room_participants')
        .select(`
          id,
          room_id,
          user_id,
          joined_at,
          profile:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar
          )
        `)
        .eq('room_id', roomId);

      if (participantsError) {
        console.error('Error fetching room participants:', participantsError);
        return { error: participantsError };
      }

      const transformedParticipants: RoomParticipant[] = participants.map(p => ({
        id: p.id,
        room_id: p.room_id,
        user_id: p.user_id,
        joined_at: p.joined_at,
        profile: p.profile ? {
          id: p.profile.id,
          first_name: p.profile.first_name,
          last_name: p.profile.last_name,
          email: p.profile.email,
          avatar: p.profile.avatar
        } : null
      }));

      const { data: tickets, error: ticketsError } = await supabase
        .from('room_tickets')
        .select('*')
        .eq('room_id', roomId);

      if (ticketsError) {
        console.error('Error fetching room tickets:', ticketsError);
        return { error: ticketsError };
      }

      currentRoom.set(room);
      roomParticipants.set(transformedParticipants);
      roomTickets.set(tickets);

      return { room, participants: transformedParticipants, tickets };
    },

    subscribeToRoom: (roomId: string) => {
      roomListener = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'poker_rooms', filter: `id=eq.${roomId}` }, payload => {
          console.log('Room update:', payload);
          currentRoom.update(room => room && room.id === roomId ? { ...room, ...payload.new } : room);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_tickets', filter: `room_id=eq.${roomId}` }, payload => {
          console.log('Tickets update:', payload);
          if (payload.eventType === 'INSERT') {
            roomTickets.update(ts => [...ts, payload.new as RoomTicket]);
          } else if (payload.eventType === 'DELETE') {
            roomTickets.update(ts => ts.filter(t => t.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        if (roomListener) supabase.removeChannel(roomListener);
      };
    },

    subscribeToRooms: () => {
      roomsListener = supabase
        .channel('public:poker_rooms')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'poker_rooms' }, 
            (payload) => {
              console.log('Rooms update:', payload);
              if (payload.eventType === 'INSERT') {
                rooms.update(rs => [payload.new as Room, ...rs]);
              } else if (payload.eventType === 'DELETE') {
                rooms.update(rs => rs.filter(r => r.id !== payload.old.id));
              } else if (payload.eventType === 'UPDATE') {
                rooms.update(rs => rs.map(r => r.id === payload.new.id ? payload.new as Room : r));
              }
            }
        )
        .subscribe();
    },

    unsubscribeFromRooms: () => {
      if (roomsListener) supabase.removeChannel(roomsListener);
    },
  };
};
