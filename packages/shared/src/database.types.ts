export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      children: {
        Row: {
          avatar: NonNullable<Json>;
          birth_year: number | null;
          created_at: string;
          display_name: string;
          family_id: string;
          gender: Database['public']['Enums']['child_gender'];
          grade: Database['public']['Enums']['grade'];
          id: string;
          theme_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar?: NonNullable<Json>;
          birth_year?: number | null;
          created_at?: string;
          display_name: string;
          family_id: string;
          gender: Database['public']['Enums']['child_gender'];
          grade: Database['public']['Enums']['grade'];
          id?: string;
          theme_id?: string;
          updated_at?: string;
        };
        Update: {
          avatar?: NonNullable<Json>;
          birth_year?: number | null;
          created_at?: string;
          display_name?: string;
          family_id?: string;
          gender?: Database['public']['Enums']['child_gender'];
          grade?: Database['public']['Enums']['grade'];
          id?: string;
          theme_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'children_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      device_children: {
        Row: {
          child_id: string;
          created_at: string;
          device_id: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          device_id: string;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          device_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'device_children_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'device_children_device_id_fkey';
            columns: ['device_id'];
            isOneToOne: false;
            referencedRelation: 'devices';
            referencedColumns: ['id'];
          },
        ];
      };
      devices: {
        Row: {
          created_at: string;
          family_id: string;
          id: string;
          last_seen_at: string;
          platform: Database['public']['Enums']['device_platform'];
          revoked_at: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          family_id: string;
          id?: string;
          last_seen_at?: string;
          platform: Database['public']['Enums']['device_platform'];
          revoked_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          family_id?: string;
          id?: string;
          last_seen_at?: string;
          platform?: Database['public']['Enums']['device_platform'];
          revoked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'devices_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      families: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          plan: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          plan?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          plan?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pairing_codes: {
        Row: {
          child_id: string;
          code: string;
          created_at: string;
          created_by: string;
          expires_at: string;
          family_id: string;
          id: string;
          updated_at: string;
          used_at: string | null;
          used_by_device_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          code: string;
          created_at?: string;
          created_by: string;
          expires_at: string;
          family_id: string;
          id?: string;
          updated_at?: string;
          used_at?: string | null;
          used_by_device_id?: string | null;
        };
        Update: {
          child_id?: string;
          code?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          family_id?: string;
          id?: string;
          updated_at?: string;
          used_at?: string | null;
          used_by_device_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pairing_codes_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairing_codes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'parents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairing_codes_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pairing_codes_used_by_device_id_fkey';
            columns: ['used_by_device_id'];
            isOneToOne: false;
            referencedRelation: 'devices';
            referencedColumns: ['id'];
          },
        ];
      };
      parents: {
        Row: {
          created_at: string;
          display_name: string;
          family_id: string;
          id: string;
          privacy_consent_at: string;
          privacy_consent_version: string;
          role: Database['public']['Enums']['parent_role'];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name: string;
          family_id: string;
          id?: string;
          privacy_consent_at: string;
          privacy_consent_version: string;
          role?: Database['public']['Enums']['parent_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          family_id?: string;
          id?: string;
          privacy_consent_at?: string;
          privacy_consent_version?: string;
          role?: Database['public']['Enums']['parent_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parents_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_pairing_code: {
        Args: { p_child_id: string };
        Returns: {
          code: string;
          expires_at: string;
        }[];
      };
      redeem_pairing_code: {
        Args: { p_code: string; p_platform: Database['public']['Enums']['device_platform'] };
        Returns: {
          child_id: string;
          display_name: string;
        }[];
      };
      revoke_device: { Args: { p_device_id: string }; Returns: undefined };
    };
    Enums: {
      child_gender: 'girl' | 'boy';
      device_platform: 'ios' | 'android' | 'web';
      grade: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6e' | '5e' | '4e' | '3e';
      parent_role: 'owner' | 'co_parent';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      child_gender: ['girl', 'boy'],
      device_platform: ['ios', 'android', 'web'],
      grade: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'],
      parent_role: ['owner', 'co_parent'],
    },
  },
} as const;
