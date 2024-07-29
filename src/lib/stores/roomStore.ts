// src/lib/stores/RoomStore.ts
import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setContext, getContext } from 'svelte';

export interface Participant {
  user_id: string;
  avatar_url: string;
  name: string;
}

export interface RoomState {
  roomId: string;
  participants: Participant[];
  currentTicket: string | null;
  votes: Record<string, string>;
  roomOwner: string | null;
  isLoading: boolean;
  error: string | null;
}

const ROOM_STORE_KEY = 'roomStore';

export class RoomStore {
  private supabase: SupabaseClient;
  private store = writable<RoomState>({
    roomId: '',
    participants: [],
    currentTicket: null,
    votes: {},
    roomOwner: null,
    isLoading: true,
    error: null
  });
  private channel: ReturnType<SupabaseClient['channel']> | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async initializeRoom(roomId: string, userId: string, avatarUrl: string, userName: string) {
    this.store.update(state => ({ ...state, isLoading: true, error: null }));

    try {
      await this.fetchRoomDetails(roomId);
      await this.joinRoom(roomId, userId, avatarUrl, userName);
      this.store.update(state => ({ ...state, isLoading: false }));
    } catch (error) {
      console.error('Error initializing room:', error);
      this.store.update(state => ({ 
        ...state, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }));
    }
  }

  private async fetchRoomDetails(roomId: string) {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (error) throw new Error(error.message);

    this.store.update(state => ({
      ...state,
      roomId,
      roomOwner: data.creator_id
    }));
  }

  private async joinRoom(roomId: string, userId: string, avatarUrl: string, userName: string) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = this.supabase.channel(`room-${roomId}`);

    this.channel
      .on('broadcast', { event: 'set-ticket' }, (payload) => {
        this.store.update(state => ({ ...state, currentTicket: payload.ticketId, votes: {} }));
      })
      .on('broadcast', { event: 'vote' }, (payload) => {
        this.store.update(state => {
          const { userId, vote } = payload;
          const newVotes = { ...state.votes };
          if (vote === null) {
            delete newVotes[userId];
          } else {
            newVotes[userId] = vote;
          }
          return { ...state, votes: newVotes };
        });
      })
      .on('broadcast', { event: 'reset-votes' }, () => {
        this.store.update(state => ({ ...state, votes: {} }));
      });

    this.channel.on('presence', { event: 'sync' }, () => {
      const presenceState = this.channel!.presenceState();
      const participants = Object.values(presenceState)
        .flat()
        .map(state => ({ 
          user_id: (state as any).user_id, 
          avatar_url: (state as any).avatar_url,
          name: (state as any).name
        }));
      this.store.update(state => ({ ...state, participants }));
    });

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.channel!.track({ 
          user_id: userId, 
          avatar_url: avatarUrl, 
          name: userName,
          online_at: new Date().toISOString() 
        });
      }
    });
  }

  setCurrentTicket(ticketId: string) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'set-ticket',
        ticketId
      });
    }
    this.store.update(state => ({ ...state, currentTicket: ticketId, votes: {} }));
  }

  leaveRoom() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel.untrack();
    }
    this.store.set({
      roomId: '',
      participants: [],
      currentTicket: null,
      votes: {},
      roomOwner: null,
      isLoading: false,
      error: null
    });
    this.channel = null;
  }

  vote(userId: string, vote: string | null) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'vote',
        userId,
        vote
      });
    }
    this.store.update(state => {
      const newVotes = { ...state.votes };
      if (vote === null) {
        delete newVotes[userId];
      } else {
        newVotes[userId] = vote;
      }
      return { ...state, votes: newVotes };
    });
  }

  resetVotes() {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'reset-votes',
      });
    }
    this.store.update(state => ({ ...state, votes: {} }));
  }

  subscribe(run: (value: RoomState) => void) {
    return this.store.subscribe(run);
  }

  static setContext(supabase: SupabaseClient) {
    const store = new RoomStore(supabase);
    setContext(ROOM_STORE_KEY, store);
    return store;
  }

  static getContext() {
    return getContext<RoomStore>(ROOM_STORE_KEY);
  }
}