// ============================================================
// types.ts — Interfaces TypeScript
// ============================================================

export interface User {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Group {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  created_at: string;
  owner_name?: string;
  is_owner?: boolean;
  session_count?: number;
  members?: GroupMember[];
}

export interface GroupMember {
  id: number;
  username: string;
  display_name: string;
  joined_at: string;
}

export interface SessionPlayer {
  id: number;
  session_id: number;
  name: string;
  emoji: string;
  color: string;
}

export interface RoundScore {
  player_id: number;
  name: string;
  score: number;
}

export interface Round {
  id: number;
  round_number: number;
  winner_player_id: number;
  winner_name: string;
  played_at: string;
  scores?: RoundScore[];
}

export interface ScoreboardEntry {
  id: number;
  name: string;
  emoji: string;
  color: string;
  total_score: number;
  rounds_won: number;
}

export interface Session {
  id: number;
  owner_id: number;
  group_id: number | null;
  title: string;
  session_type?: never
  max_score: number;
  status: 'active' | 'finished';
  winner_player_id: number | null;
  winner_name?: string;
  group_name?: string;
  started_at: string;
  finished_at: string | null;
  round_count?: number;
  player_count?: number;
  players?: SessionPlayer[];
  rounds?: Round[];
  scoreboard?: ScoreboardEntry[];
}

export interface RankingEntry {
  player_name: string;
  sessions_played: number;
  sessions_won: number;
  rounds_won: number;
  total_score?: number;
}

export interface GroupRankingResponse {
  group_id: number;
  month: number | null;
  year: number | null;
  ranking: RankingEntry[];
}

export interface PlayerSuggestion {
  name: string;
  emoji: string;
  color: string;
  use_count: number;
  last_used: string;
}
