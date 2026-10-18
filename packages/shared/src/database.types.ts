export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attempts: {
        Row: {
          answer: NonNullable<Json>;
          answered_at: string;
          child_id: string;
          created_at: string;
          difficulty: number;
          generator_id: string;
          hint_used: boolean;
          id: string;
          is_correct: boolean;
          learner_elo: number;
          position: number;
          reminder: boolean;
          seed: number;
          session_id: string;
          skill_code: string;
          slot: Database['public']['Enums']['session_slot'];
          time_ms: number;
          twin_of: number | null;
          updated_at: string;
          verified: boolean | null;
        };
        ComputedFields: never;
        Insert: {
          answer: NonNullable<Json>;
          answered_at: string;
          child_id: string;
          created_at?: string;
          difficulty: number;
          generator_id: string;
          hint_used?: boolean;
          id?: string;
          is_correct: boolean;
          learner_elo: number;
          position: number;
          reminder?: boolean;
          seed: number;
          session_id: string;
          skill_code: string;
          slot: Database['public']['Enums']['session_slot'];
          time_ms: number;
          twin_of?: number | null;
          updated_at?: string;
          verified?: boolean | null;
        };
        Update: {
          answer?: NonNullable<Json>;
          answered_at?: string;
          child_id?: string;
          created_at?: string;
          difficulty?: number;
          generator_id?: string;
          hint_used?: boolean;
          id?: string;
          is_correct?: boolean;
          learner_elo?: number;
          position?: number;
          reminder?: boolean;
          seed?: number;
          session_id?: string;
          skill_code?: string;
          slot?: Database['public']['Enums']['session_slot'];
          time_ms?: number;
          twin_of?: number | null;
          updated_at?: string;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attempts_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attempts_skill_code_fkey';
            columns: ['skill_code'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['code'];
          },
        ];
      };
      badges: {
        Row: {
          category: Database['public']['Enums']['badge_category'];
          code: string;
          created_at: string;
          id: string;
          metric: string;
          position: number;
          threshold: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category: Database['public']['Enums']['badge_category'];
          code: string;
          created_at?: string;
          id?: string;
          metric: string;
          position: number;
          threshold: number;
          updated_at?: string;
        };
        Update: {
          category?: Database['public']['Enums']['badge_category'];
          code?: string;
          created_at?: string;
          id?: string;
          metric?: string;
          position?: number;
          threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenge_completions: {
        Row: {
          challenge_code: string;
          child_id: string;
          completed_at: string;
          created_at: string;
          id: string;
          session_id: string | null;
          updated_at: string;
          week_start: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_code: string;
          child_id: string;
          completed_at: string;
          created_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          week_start: string;
        };
        Update: {
          challenge_code?: string;
          child_id?: string;
          completed_at?: string;
          created_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          week_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'challenge_completions_challenge_code_fkey';
            columns: ['challenge_code'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'challenge_completions_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_completions_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      challenges: {
        Row: {
          code: string;
          created_at: string;
          gems: number;
          id: string;
          metric: string;
          position: number;
          threshold: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          gems: number;
          id?: string;
          metric: string;
          position: number;
          threshold: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          gems?: number;
          id?: string;
          metric?: string;
          position?: number;
          threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      chests: {
        Row: {
          child_id: string;
          created_at: string;
          gems: number;
          id: string;
          kind: Database['public']['Enums']['chest_kind'];
          local_date: string;
          opened_at: string | null;
          session_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          gems: number;
          id?: string;
          kind: Database['public']['Enums']['chest_kind'];
          local_date: string;
          opened_at?: string | null;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          gems?: number;
          id?: string;
          kind?: Database['public']['Enums']['chest_kind'];
          local_date?: string;
          opened_at?: string | null;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chests_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chests_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: true;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      child_badges: {
        Row: {
          badge_code: string;
          child_id: string;
          created_at: string;
          earned_at: string;
          id: string;
          session_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          badge_code: string;
          child_id: string;
          created_at?: string;
          earned_at: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
        };
        Update: {
          badge_code?: string;
          child_id?: string;
          created_at?: string;
          earned_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'child_badges_badge_code_fkey';
            columns: ['badge_code'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'child_badges_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'child_badges_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      child_items: {
        Row: {
          bought_at: string;
          child_id: string;
          created_at: string;
          equipped: boolean;
          id: string;
          item_code: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bought_at: string;
          child_id: string;
          created_at?: string;
          equipped?: boolean;
          id?: string;
          item_code: string;
          updated_at?: string;
        };
        Update: {
          bought_at?: string;
          child_id?: string;
          created_at?: string;
          equipped?: boolean;
          id?: string;
          item_code?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'child_items_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'child_items_item_code_fkey';
            columns: ['item_code'];
            isOneToOne: false;
            referencedRelation: 'shop_items';
            referencedColumns: ['code'];
          },
        ];
      };
      child_skill_mastery: {
        Row: {
          attempts_count: number;
          child_id: string;
          created_at: string;
          elo: number;
          id: string;
          last_practiced_at: string | null;
          mastered_at: string | null;
          mastery: number;
          sessions_streak: number;
          skill_code: string;
          status: Database['public']['Enums']['mastery_status'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attempts_count: number;
          child_id: string;
          created_at?: string;
          elo: number;
          id?: string;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          mastery: number;
          sessions_streak: number;
          skill_code: string;
          status: Database['public']['Enums']['mastery_status'];
          updated_at?: string;
        };
        Update: {
          attempts_count?: number;
          child_id?: string;
          created_at?: string;
          elo?: number;
          id?: string;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          mastery?: number;
          sessions_streak?: number;
          skill_code?: string;
          status?: Database['public']['Enums']['mastery_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'child_skill_mastery_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'child_skill_mastery_skill_code_fkey';
            columns: ['skill_code'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['code'];
          },
        ];
      };
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
          push_status: Database['public']['Enums']['push_status'] | null;
          push_status_at: string | null;
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
          push_status?: Database['public']['Enums']['push_status'] | null;
          push_status_at?: string | null;
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
          push_status?: Database['public']['Enums']['push_status'] | null;
          push_status_at?: string | null;
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
      gem_transactions: {
        Row: {
          amount: number;
          child_id: string;
          created_at: string;
          id: string;
          local_date: string;
          reason: Database['public']['Enums']['gem_reason'];
          ref_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          child_id: string;
          created_at?: string;
          id?: string;
          local_date: string;
          reason: Database['public']['Enums']['gem_reason'];
          ref_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          child_id?: string;
          created_at?: string;
          id?: string;
          local_date?: string;
          reason?: Database['public']['Enums']['gem_reason'];
          ref_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gem_transactions_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
        ];
      };
      island_completions: {
        Row: {
          child_id: string;
          completed_at: string;
          created_at: string;
          domain: Database['public']['Enums']['skill_domain'];
          grade: Database['public']['Enums']['grade'];
          id: string;
          session_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          completed_at: string;
          created_at?: string;
          domain: Database['public']['Enums']['skill_domain'];
          grade: Database['public']['Enums']['grade'];
          id?: string;
          session_id?: string | null;
          updated_at?: string;
        };
        Update: {
          child_id?: string;
          completed_at?: string;
          created_at?: string;
          domain?: Database['public']['Enums']['skill_domain'];
          grade?: Database['public']['Enums']['grade'];
          id?: string;
          session_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'island_completions_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'island_completions_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      item_ratings: {
        Row: {
          answers_count: number;
          created_at: string;
          difficulty: number;
          generator_id: string;
          id: string;
          rating: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          answers_count?: number;
          created_at?: string;
          difficulty: number;
          generator_id: string;
          id?: string;
          rating: number;
          updated_at?: string;
        };
        Update: {
          answers_count?: number;
          created_at?: string;
          difficulty?: number;
          generator_id?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          audience: Database['public']['Enums']['notification_audience'];
          body: string;
          child_id: string;
          created_at: string;
          dedup_key: string;
          family_id: string;
          id: string;
          kind: Database['public']['Enums']['notification_kind'];
          push_errors: Json | null;
          push_request_id: number | null;
          push_status: number | null;
          push_tokens: string[];
          sent_at: string | null;
          title: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          audience: Database['public']['Enums']['notification_audience'];
          body: string;
          child_id: string;
          created_at?: string;
          dedup_key: string;
          family_id: string;
          id?: string;
          kind: Database['public']['Enums']['notification_kind'];
          push_errors?: Json | null;
          push_request_id?: number | null;
          push_status?: number | null;
          push_tokens?: string[];
          sent_at?: string | null;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          audience?: Database['public']['Enums']['notification_audience'];
          body?: string;
          child_id?: string;
          created_at?: string;
          dedup_key?: string;
          family_id?: string;
          id?: string;
          kind?: Database['public']['Enums']['notification_kind'];
          push_errors?: Json | null;
          push_request_id?: number | null;
          push_status?: number | null;
          push_tokens?: string[];
          sent_at?: string | null;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
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
      progress: {
        Row: {
          child_id: string;
          created_at: string;
          freezes: number;
          gems: number;
          id: string;
          level: number;
          streak_best: number;
          streak_current: number;
          streak_last_date: string | null;
          updated_at: string;
          xp: number;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          freezes?: number;
          gems?: number;
          id?: string;
          level?: number;
          streak_best?: number;
          streak_current?: number;
          streak_last_date?: string | null;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          freezes?: number;
          gems?: number;
          id?: string;
          level?: number;
          streak_best?: number;
          streak_current?: number;
          streak_last_date?: string | null;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'progress_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: true;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: Database['public']['Enums']['device_platform'];
          token: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          platform: Database['public']['Enums']['device_platform'];
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: Database['public']['Enums']['device_platform'];
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      routines: {
        Row: {
          child_id: string;
          created_at: string;
          days: number[];
          deadline_time: string;
          goal_type: Database['public']['Enums']['session_goal_type'];
          goal_value: number;
          id: string;
          start_time: string;
          updated_at: string;
          wednesday_start_time: string | null;
          weekend_start_time: string | null;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          days: number[];
          deadline_time: string;
          goal_type: Database['public']['Enums']['session_goal_type'];
          goal_value: number;
          id?: string;
          start_time: string;
          updated_at?: string;
          wednesday_start_time?: string | null;
          weekend_start_time?: string | null;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          days?: number[];
          deadline_time?: string;
          goal_type?: Database['public']['Enums']['session_goal_type'];
          goal_value?: number;
          id?: string;
          start_time?: string;
          updated_at?: string;
          wednesday_start_time?: string | null;
          weekend_start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routines_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: true;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          answered: number;
          award: Json | null;
          awarded_at: string | null;
          child_id: string;
          completed_at: string | null;
          created_at: string;
          device_id: string | null;
          duration_s: number;
          flagged: boolean;
          goal_met: boolean;
          goal_type: Database['public']['Enums']['session_goal_type'];
          goal_value: number;
          id: string;
          kind: Database['public']['Enums']['session_kind'];
          local_date: string;
          score: number;
          started_at: string;
          updated_at: string;
          verified_correct: number | null;
          xp_awarded: number | null;
        };
        ComputedFields: never;
        Insert: {
          answered?: number;
          award?: Json | null;
          awarded_at?: string | null;
          child_id: string;
          completed_at?: string | null;
          created_at?: string;
          device_id?: string | null;
          duration_s?: number;
          flagged?: boolean;
          goal_met?: boolean;
          goal_type: Database['public']['Enums']['session_goal_type'];
          goal_value: number;
          id: string;
          kind: Database['public']['Enums']['session_kind'];
          local_date: string;
          score?: number;
          started_at: string;
          updated_at?: string;
          verified_correct?: number | null;
          xp_awarded?: number | null;
        };
        Update: {
          answered?: number;
          award?: Json | null;
          awarded_at?: string | null;
          child_id?: string;
          completed_at?: string | null;
          created_at?: string;
          device_id?: string | null;
          duration_s?: number;
          flagged?: boolean;
          goal_met?: boolean;
          goal_type?: Database['public']['Enums']['session_goal_type'];
          goal_value?: number;
          id?: string;
          kind?: Database['public']['Enums']['session_kind'];
          local_date?: string;
          score?: number;
          started_at?: string;
          updated_at?: string;
          verified_correct?: number | null;
          xp_awarded?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_device_id_fkey';
            columns: ['device_id'];
            isOneToOne: false;
            referencedRelation: 'devices';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_items: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          kind: Database['public']['Enums']['shop_item_kind'];
          position: number;
          price_gems: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          kind: Database['public']['Enums']['shop_item_kind'];
          position: number;
          price_gems: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['shop_item_kind'];
          position?: number;
          price_gems?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          automatism: boolean;
          code: string;
          created_at: string;
          domain: Database['public']['Enums']['skill_domain'];
          grade: Database['public']['Enums']['grade'];
          id: string;
          prerequisites: string[];
          program_version: string;
          subject: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          automatism?: boolean;
          code: string;
          created_at?: string;
          domain: Database['public']['Enums']['skill_domain'];
          grade: Database['public']['Enums']['grade'];
          id?: string;
          prerequisites?: string[];
          program_version: string;
          subject?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          automatism?: boolean;
          code?: string;
          created_at?: string;
          domain?: Database['public']['Enums']['skill_domain'];
          grade?: Database['public']['Enums']['grade'];
          id?: string;
          prerequisites?: string[];
          program_version?: string;
          subject?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vacations: {
        Row: {
          child_id: string;
          created_at: string;
          from_date: string;
          id: string;
          to_date: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          child_id: string;
          created_at?: string;
          from_date: string;
          id?: string;
          to_date: string;
          updated_at?: string;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          from_date?: string;
          id?: string;
          to_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vacations_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      award_session: {
        Args: { p_now?: string; p_session_id: string; p_verdicts: Json };
        Returns: Json;
      };
      buy_freeze: {
        Args: { p_child_id: string };
        Returns: {
          child_id: string;
          created_at: string;
          freezes: number;
          gems: number;
          id: string;
          level: number;
          streak_best: number;
          streak_current: number;
          streak_last_date: string | null;
          updated_at: string;
          xp: number;
        };
        SetofOptions: {
          from: '*';
          to: 'progress';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      buy_item: { Args: { p_child_id: string; p_item_code: string }; Returns: Json };
      child_badge_metrics: { Args: { p_child_id: string }; Returns: Json };
      create_pairing_code: {
        Args: { p_child_id: string };
        Returns: {
          code: string;
          expires_at: string;
        }[];
      };
      equip_item: {
        Args: { p_child_id: string; p_equipped: boolean; p_item_code: string };
        Returns: undefined;
      };
      open_chest: { Args: { p_chest_id: string }; Returns: Json };
      redeem_pairing_code: {
        Args: { p_code: string; p_platform: Database['public']['Enums']['device_platform'] };
        Returns: {
          child_id: string;
          display_name: string;
        }[];
      };
      register_push_token: {
        Args: { p_platform: Database['public']['Enums']['device_platform']; p_token: string };
        Returns: undefined;
      };
      report_push_status: {
        Args: { p_status: Database['public']['Enums']['push_status'] };
        Returns: boolean;
      };
      revoke_device: { Args: { p_device_id: string }; Returns: undefined };
      send_child_message: { Args: { p_child_id: string; p_message: string }; Returns: number };
      sync_session: {
        Args: { p_session: Json };
        Returns: {
          answered: number;
          award: Json | null;
          awarded_at: string | null;
          child_id: string;
          completed_at: string | null;
          created_at: string;
          device_id: string | null;
          duration_s: number;
          flagged: boolean;
          goal_met: boolean;
          goal_type: Database['public']['Enums']['session_goal_type'];
          goal_value: number;
          id: string;
          kind: Database['public']['Enums']['session_kind'];
          local_date: string;
          score: number;
          started_at: string;
          updated_at: string;
          verified_correct: number | null;
          xp_awarded: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'sessions';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      unregister_push_token: { Args: { p_token: string }; Returns: undefined };
      weekly_challenge: { Args: { p_child_id: string; p_now?: string }; Returns: Json };
    };
    Enums: {
      badge_category: 'regularity' | 'mastery' | 'discovery' | 'progression';
      chest_kind: 'common' | 'rare';
      child_gender: 'girl' | 'boy';
      device_platform: 'ios' | 'android' | 'web';
      gem_reason: 'session' | 'chest' | 'freeze' | 'shop' | 'challenge';
      grade: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6e' | '5e' | '4e' | '3e';
      mastery_status: 'to_discover' | 'in_progress' | 'mastered' | 'to_review';
      notification_audience: 'child' | 'parent';
      notification_kind:
        | 'routine_soon'
        | 'routine_start'
        | 'routine_nudge'
        | 'not_started'
        | 'missed'
        | 'session_done'
        | 'parent_message';
      parent_role: 'owner' | 'co_parent';
      push_status: 'enabled' | 'denied' | 'unsupported';
      session_goal_type: 'duration' | 'count';
      session_kind: 'daily' | 'bonus' | 'placement' | 'boss';
      session_slot: 'current' | 'review' | 'automatism' | 'challenge';
      shop_item_kind: 'companion' | 'accessory' | 'effect';
      skill_domain: 'numbers' | 'measures' | 'geometry' | 'data';
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
      badge_category: ['regularity', 'mastery', 'discovery', 'progression'],
      chest_kind: ['common', 'rare'],
      child_gender: ['girl', 'boy'],
      device_platform: ['ios', 'android', 'web'],
      gem_reason: ['session', 'chest', 'freeze', 'shop', 'challenge'],
      grade: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'],
      mastery_status: ['to_discover', 'in_progress', 'mastered', 'to_review'],
      notification_audience: ['child', 'parent'],
      notification_kind: [
        'routine_soon',
        'routine_start',
        'routine_nudge',
        'not_started',
        'missed',
        'session_done',
        'parent_message',
      ],
      parent_role: ['owner', 'co_parent'],
      push_status: ['enabled', 'denied', 'unsupported'],
      session_goal_type: ['duration', 'count'],
      session_kind: ['daily', 'bonus', 'placement', 'boss'],
      session_slot: ['current', 'review', 'automatism', 'challenge'],
      shop_item_kind: ['companion', 'accessory', 'effect'],
      skill_domain: ['numbers', 'measures', 'geometry', 'data'],
    },
  },
} as const;
