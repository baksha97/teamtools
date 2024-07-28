import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Room {
  id: string;
  creator_id: string;
  current_ticket: string | null;
  votes: Record<string, string>;
}

export interface Participant {
  user_id: string;
}

export interface RoomStoreState {
  rooms: Room[];
  currentRoom: ReturnType<SupabaseClient['channel']> | null;
  participants: Participant[];
  currentTicket: string | null;
  votes: Record<string, string>;
}

export interface RoomStoreType {
  subscribe: (run: (value: RoomStoreState) => void) => () => void;
  createRoom: (roomId: string, creatorId: string) => Promise<void>;
  listRooms: () => Promise<void>;
  joinRoom: (roomId: string, userId: string) => Promise<void>;
  setCurrentTicket: (ticketId: string) => void;
  vote: (userId: string, vote: string) => void;
  resetVotes: () => void;
}

export function createRoomStore(supabase: SupabaseClient): RoomStoreType {
  const { subscribe, update, set } = writable<RoomStoreState>({
    rooms: [],
    currentRoom: null,
    participants: [],
    currentTicket: null,
    votes: {},
  });

  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;

    await initRoomSubscription();
    await listRooms();
  }

  async function initRoomSubscription() {
    supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
        const newRoom: Room = {
          id: payload.new.id,
          creator_id: payload.new.creator_id,
          current_ticket: payload.new.current_ticket,
          votes: payload.new.votes || {},
        };
        update(state => ({ ...state, rooms: [...state.rooms, newRoom] }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms' }, payload => {
        update(state => ({
          ...state,
          rooms: state.rooms.filter(room => room.id !== payload.old.id)
        }));
      })
      .subscribe();
  }

  async function createRoom(roomId: string, creatorId: string) {
    const { error } = await supabase.from('rooms').insert([{ id: roomId, creator_id: creatorId }]);
    if (error) throw new Error(error.message);
  }

  async function listRooms() {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) throw new Error(error.message);
    update(state => ({ ...state, rooms: data as Room[] }));
  }

  async function joinRoom(roomId: string, userId: string) {
    await init();

    update(state => {
      if (state.currentRoom && state.currentRoom.topic === `room-${roomId}`) {
        console.log('Already in this room, not rejoining');
        return state;
      }

      if (state.currentRoom) {
        state.currentRoom.unsubscribe();
      }

      const room = supabase.channel(`room-${roomId}`);

      room.on('broadcast', { event: 'set-ticket' }, (payload) => {
        update(innerState => ({ ...innerState, currentTicket: payload.ticketId }));
      }).on('broadcast', { event: 'vote' }, (payload) => {
        update(innerState => ({
          ...innerState,
          votes: { ...innerState.votes, [payload.userId]: payload.vote }
        }));
      }).on('broadcast', { event: 'reset-votes' }, () => {
        update(innerState => ({ ...innerState, votes: {} }));
      });

      room.on('presence', { event: 'sync' }, () => {
        const presenceState = room.presenceState();
        const participants = Object.keys(presenceState).map(user_id => ({ user_id }));
        update(innerState => ({ ...innerState, participants }));
      });

      room.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          room.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

      return { ...state, currentRoom: room };
    });

    // Fetch current room state
    const { data, error } = await supabase
      .from('rooms')
      .select('current_ticket, votes')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room state:', error);
    } else if (data) {
      update(state => ({
        ...state,
        currentTicket: data.current_ticket,
        votes: data.votes || {},
      }));
    }
  }

  function setCurrentTicket(ticketId: string) {
    update(state => {
      if (state.currentRoom) {
        state.currentRoom.send({
          type: 'broadcast',
          event: 'set-ticket',
          payload: { ticketId },
        });
        // Update database
        supabase.from('rooms').update({ current_ticket: ticketId }).eq('id', state.currentRoom.topic.split('-')[1]);
      }
      return { ...state, currentTicket: ticketId };
    });
  }

  function vote(userId: string, vote: string) {
    update(state => {
      if (state.currentRoom) {
        const newVotes = { ...state.votes, [userId]: vote };
        state.currentRoom.send({
          type: 'broadcast',
          event: 'vote',
          payload: { userId, vote },
        });
        // Update database
        supabase.from('rooms').update({ votes: newVotes }).eq('id', state.currentRoom.topic.split('-')[1]);
      }
      return { ...state, votes: { ...state.votes, [userId]: vote } };
    });
  }

  function resetVotes() {
    update(state => {
      if (state.currentRoom) {
        state.currentRoom.send({
          type: 'broadcast',
          event: 'reset-votes',
        });
        // Update database
        supabase.from('rooms').update({ votes: {} }).eq('id', state.currentRoom.topic.split('-')[1]);
      }
      return { ...state, votes: {} };
    });
  }

  return {
    subscribe,
    createRoom,
    listRooms,
    joinRoom,
    setCurrentTicket,
    vote,
    resetVotes,
  };
}