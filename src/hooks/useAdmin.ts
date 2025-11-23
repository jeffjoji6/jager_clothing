import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminUser {
  id: string;
  role: 'admin' | 'staff' | 'designer';
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // User is not an admin
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as AdminUser;
    },
    enabled: !!user,
    retry: false,
  });
};

export const useIsAdmin = () => {
  const { data: admin } = useAdmin();
  return admin !== null && admin !== undefined;
};

