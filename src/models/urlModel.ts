export interface UrlRow {
  id: number;
  original_url: string;
  short_code: string;
  created_at: string; // ISO timestamp
  clicks: string | number; // PG BIGINT may come back as string depending on pg config
}
