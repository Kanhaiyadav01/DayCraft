export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          threshold: number;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description: string;
          icon?: string;
          id: string;
          name: string;
          threshold?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          threshold?: number;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          actual_seconds: number;
          completed: boolean;
          created_at: string;
          ended_at: string | null;
          id: string;
          label: string | null;
          mode: Database["public"]["Enums"]["session_mode"];
          planned_minutes: number;
          started_at: string;
          user_id: string;
        };
        Insert: {
          actual_seconds?: number;
          completed?: boolean;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          label?: string | null;
          mode?: Database["public"]["Enums"]["session_mode"];
          planned_minutes?: number;
          started_at?: string;
          user_id: string;
        };
        Update: {
          actual_seconds?: number;
          completed?: boolean;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          label?: string | null;
          mode?: Database["public"]["Enums"]["session_mode"];
          planned_minutes?: number;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      garden_plants: {
        Row: {
          id: string;
          planted_at: string;
          position_x: number;
          position_y: number;
          session_id: string | null;
          species: string;
          stage: Database["public"]["Enums"]["plant_stage"];
          user_id: string;
        };
        Insert: {
          id?: string;
          planted_at?: string;
          position_x?: number;
          position_y?: number;
          session_id?: string | null;
          species?: string;
          stage?: Database["public"]["Enums"]["plant_stage"];
          user_id: string;
        };
        Update: {
          id?: string;
          planted_at?: string;
          position_x?: number;
          position_y?: number;
          session_id?: string | null;
          species?: string;
          stage?: Database["public"]["Enums"]["plant_stage"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "garden_plants_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string | null;
          color: string;
          created_at: string;
          id: string;
          pinned: boolean;
          tags: string[];
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          tags?: string[];
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          tags?: string[];
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          theme: string;
          updated_at: string;
          custom_presets: Json | null;
          sound_settings: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          theme?: string;
          updated_at?: string;
          custom_presets?: Json | null;
          sound_settings?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          theme?: string;
          updated_at?: string;
          custom_presets?: Json | null;
          sound_settings?: Json | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          created_at: string;
          done: boolean;
          due_date: string | null;
          id: string;
          priority: number;
          sort_order: number;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          id?: string;
          priority?: number;
          sort_order?: number;
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          id?: string;
          priority?: number;
          sort_order?: number;
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      timer_runs: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          label: string | null;
          laps: Json | null;
          seconds: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          label?: string | null;
          laps?: Json | null;
          seconds?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          label?: string | null;
          laps?: Json | null;
          seconds?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          daily_goal_minutes: number;
          default_break_minutes: number;
          default_focus_minutes: number;
          notifications_enabled: boolean;
          sound_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          daily_goal_minutes?: number;
          default_break_minutes?: number;
          default_focus_minutes?: number;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          daily_goal_minutes?: number;
          default_break_minutes?: number;
          default_focus_minutes?: number;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      plant_stage: "seed" | "sprout" | "bud" | "bloom" | "tree";
      session_mode: "pomodoro" | "deepwork" | "study" | "custom" | "free";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      plant_stage: ["seed", "sprout", "bud", "bloom", "tree"],
      session_mode: ["pomodoro", "deepwork", "study", "custom", "free"],
    },
  },
} as const;
