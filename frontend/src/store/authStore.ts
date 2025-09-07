import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, session: any) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      
      login: (user: User, session: any) =>
        set({ user, session, isAuthenticated: true, isLoading: false }),
      
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
      },
      
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Get or create user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile) {
              set({ 
                user: profile, 
                session, 
                isAuthenticated: true, 
                isLoading: false 
              });
            } else {
              // Create user profile if doesn't exist
              const newUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || session.user.email!,
                picture: session.user.user_metadata?.avatar_url
              };
              
              const { data: createdUser } = await supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
              
              if (createdUser) {
                set({ 
                  user: createdUser, 
                  session, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
              }
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false });
        }
      },
      
      signInWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/dashboard`
            }
          });
          
          if (error) {
            console.error('Google sign in error:', error);
          }
        } catch (error) {
          console.error('Google sign in error:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    await store.initialize();
  } else if (event === 'SIGNED_OUT') {
    store.logout();
  }
});
