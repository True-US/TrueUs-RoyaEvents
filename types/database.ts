// REVIEW:
// OUT OF DATE...?

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_adventure: {
        Row: {
          event_adventure_id: number;
          location_id: number | null;
          title: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          price: number | string | null;
          start_datetime: string;
          end_datetime: string | null;
          status:
            | "DRAFT"
            | "PUBLISHED"
            | "UNPUBLISHED"
            | "OUT_OF_STOCK"
            | "CANCELLED"
            | "OVERDUE"
            | "COMPLETED";
          capacity: number | null;
          available_spots: number | null;
          event_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["event_adventure"]["Row"],
          "event_adventure_id"
        > & {
          event_adventure_id?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["event_adventure"]["Insert"]
        >;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          kind: "contact" | "custom_event" | "private_adventure";
          message: string;
          status: "new" | "in_progress" | "closed";
        };
        Insert: Omit<Database["public"]["Tables"]["inquiries"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
