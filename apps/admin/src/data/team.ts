import type { Database } from '@math-genius/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AdminRole } from '@/models/navigation';

type Public = Database['public'];
export type TeamMember = Public['Functions']['admin_team']['Returns'][number];
export type AuditRow = Public['Tables']['admin_audit_log']['Row'];

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.rpc('admin_team');
      if (error) throw error;
      return data;
    },
  });
}

/** Gives a role to an account that exists, or removes it (null). */
export function useSetRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AdminRole | null }) => {
      // PostgREST takes a JSON null for « no role ».
      const { error } = await supabase.rpc('admin_set_role', {
        p_email: email,
        p_role: role as AdminRole,
      });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log'],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
