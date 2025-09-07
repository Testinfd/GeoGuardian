import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AOI, Alert } from '../lib/supabase';

interface AOIState {
  aois: AOI[];
  alerts: Alert[];
  selectedAOI: AOI | null;
  isLoading: boolean;
  
  // Actions
  setAOIs: (aois: AOI[]) => void;
  addAOI: (aoi: AOI) => void;
  removeAOI: (id: string) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setSelectedAOI: (aoi: AOI | null) => void;
  setLoading: (loading: boolean) => void;
  
  // API methods
  fetchAOIs: () => Promise<void>;
  createAOI: (name: string, geojson: any) => Promise<AOI | null>;
  deleteAOI: (id: string) => Promise<boolean>;
  fetchAlerts: () => Promise<void>;
  fetchAOIAlert: (aoiId: string) => Promise<Alert | null>;
}

export const useAOIStore = create<AOIState>((set, get) => ({
  aois: [],
  alerts: [],
  selectedAOI: null,
  isLoading: false,
  
  setAOIs: (aois) => set({ aois }),
  addAOI: (aoi) => set((state) => ({ aois: [...state.aois, aoi] })),
  removeAOI: (id) => set((state) => ({ 
    aois: state.aois.filter(aoi => aoi.id !== id) 
  })),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  setSelectedAOI: (selectedAOI) => set({ selectedAOI }),
  setLoading: (isLoading) => set({ isLoading }),
  
  fetchAOIs: async () => {
    try {
      set({ isLoading: true });
      
      const { data: aois, error } = await supabase
        .from('aois')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching AOIs:', error);
        return;
      }
      
      set({ aois: aois || [] });
    } catch (error) {
      console.error('Error fetching AOIs:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createAOI: async (name: string, geojson: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return null;
      }
      
      const { data: aoi, error } = await supabase
        .from('aois')
        .insert({
          name,
          geojson,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating AOI:', error);
        return null;
      }
      
      get().addAOI(aoi);
      return aoi;
    } catch (error) {
      console.error('Error creating AOI:', error);
      return null;
    }
  },
  
  deleteAOI: async (id: string) => {
    try {
      const { error } = await supabase
        .from('aois')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting AOI:', error);
        return false;
      }
      
      get().removeAOI(id);
      return true;
    } catch (error) {
      console.error('Error deleting AOI:', error);
      return false;
    }
  },
  
  fetchAlerts: async () => {
    try {
      // First get user's AOIs
      const { data: aois } = await supabase
        .from('aois')
        .select('id');
      
      if (!aois || aois.length === 0) {
        set({ alerts: [] });
        return;
      }
      
      const aoiIds = aois.map(aoi => aoi.id);
      
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .in('aoi_id', aoiIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching alerts:', error);
        return;
      }
      
      set({ alerts: alerts || [] });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  },
  
  fetchAOIAlert: async (aoiId: string) => {
    try {
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('aoi_id', aoiId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching AOI alert:', error);
        return null;
      }
      
      return alerts && alerts.length > 0 ? alerts[0] : null;
    } catch (error) {
      console.error('Error fetching AOI alert:', error);
      return null;
    }
  }
}));
