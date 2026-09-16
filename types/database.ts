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
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          starts_at: string;
          location: string | null;
          status: "draft" | "published" | "archived";
        };
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      adventures: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          duration: string | null;
          status: "draft" | "published" | "archived";
        };
        Insert: Omit<
          Database["public"]["Tables"]["adventures"]["Row"],
          "id"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["adventures"]["Insert"]>;
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
