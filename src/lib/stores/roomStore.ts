import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Room {
  id: string;
  creator_id: string;
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
  vote: (userId: string, vote: string | null) => void;
  resetVotes: () => void;
  leaveRoom: () => void;
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

      room
      .on('broadcast', { event: 'set-ticket' }, (payload) => {
        console.log('Received set-ticket broadcast:', payload);
        update(state => {
          const newTicket = payload.ticketId;
          console.log('Updating current ticket to:', newTicket);
          return { ...state, currentTicket: newTicket, votes: {} };
        });
      })
        .on('broadcast', { event: 'vote' }, (payload) => {
          console.log('Received vote broadcast:', payload);
          update(state => {
            const { userId, vote } = payload;
            console.log('Updating vote for user:', userId, 'with vote:', vote);
            
            const newVotes = { ...state.votes };
            if (vote === null) {
              delete newVotes[userId];
            } else {
              newVotes[userId] = vote;
            }
            
            console.log('Updated votes:', newVotes);
            return { ...state, votes: newVotes };
          });
        })
        .on('broadcast', { event: 'reset-votes' }, () => {
          update(innerState => ({ ...innerState, votes: {} }));
        });

      room.on('presence', { event: 'sync' }, () => {
        const presenceState = room.presenceState();
        console.log("Presence state:", presenceState);
        const participants = Object.values(presenceState)
          .flat()
          .map(state => ({ user_id: (state as any).user_id }));
        console.log("Participants:", participants);
        update(innerState => ({ ...innerState, participants }));
      });

      room.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          room.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

      return { ...state, currentRoom: room, currentTicket: null, votes: {} };
    });

    console.log('Joined room:', roomId);
  }

  function setCurrentTicket(ticketId: string) {
    update(state => {
      if (state.currentRoom) {
        console.log('Setting current ticket:', ticketId);
        state.currentRoom.send({
          type: 'broadcast',
          event: 'set-ticket',
          ticketId
        });
      }
      return { ...state, currentTicket: ticketId, votes: {} };
    });
  }

  function leaveRoom() {
    update(state => {
      if (state.currentRoom) {
        console.log('Leaving room:', state.currentRoom.topic);
        state.currentRoom.unsubscribe();
        state.currentRoom.untrack();
      }
      return { ...state, currentRoom: null, participants: [], currentTicket: null, votes: {} };
    });
  }

  

  function vote(userId: string, vote: string | null) {
    update(state => {
      if (state.currentRoom) {
        console.log('Sending vote:', userId, vote);
        state.currentRoom.send({
          type: 'broadcast',
          event: 'vote',
          userId,
          vote
        });
      }
      const newVotes = { ...state.votes };
      if (vote === null) {
        delete newVotes[userId];
      } else {
        newVotes[userId] = vote;
      }
      console.log('Updated votes in store:', newVotes);
      return { ...state, votes: newVotes };
    });
  }

  function resetVotes() {
    update(state => {
      if (state.currentRoom) {
        state.currentRoom.send({
          type: 'broadcast',
          event: 'reset-votes',
        });
      }
      return { ...state, votes: {} };
    });
  }

  return {
    subscribe,
    createRoom,
    listRooms,
    joinRoom,
    leaveRoom,
    setCurrentTicket,
    vote,
    resetVotes,
  };
}