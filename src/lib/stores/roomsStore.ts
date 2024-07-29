// src/lib/stores/RoomsStore.ts
import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setContext, getContext } from 'svelte';

export interface Room {
  id: string;
  creator_id: string;
}

const ROOMS_STORE_KEY = 'roomsStore';

export class RoomsStore {
  private supabase: SupabaseClient;
  private store = writable<Room[]>([]);

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.init();
  }

  private async init() {
    await this.initRoomSubscription();
    await this.listRooms();
  }

  async initRoomSubscription() {
    this.supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
        const newRoom: Room = {
          id: payload.new.id,
          creator_id: payload.new.creator_id,
        };
        this.store.update(rooms => [...rooms, newRoom]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms' }, payload => {
        this.store.update(rooms => rooms.filter(room => room.id !== payload.old.id));
      })
      .subscribe();
  }

  async createRoom(roomId: string, creatorId: string) {
    const { error } = await this.supabase.from('rooms').insert([{ id: roomId, creator_id: creatorId }]);
    if (error) throw new Error(error.message);
  }

  async listRooms() {
    const { data, error } = await this.supabase.from('rooms').select('*');
    if (error) throw new Error(error.message);
    this.store.set(data as Room[]);
  }

  subscribe(run: (value: Room[]) => void) {
    return this.store.subscribe(run);
  }

  static setContext(supabase: SupabaseClient) {
    const store = new RoomsStore(supabase);
    setContext(ROOMS_STORE_KEY, store);
    return store;
  }

  static getContext() {
    return getContext<RoomsStore>(ROOMS_STORE_KEY);
  }
}