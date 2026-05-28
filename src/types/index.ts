export type EntityType = 'character' | 'location' | 'event' | 'faction' | 'artifact' | 'chapter';
export type MemberRole = 'viewer' | 'editor' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface World {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  world_id: string;
  entity_type: EntityType;
  name: string;
  description: string | null;
  properties: Record<string, unknown>;
  image_url: string | null;
  timeline_position: string | null;
  created_at: string;
  updated_at: string;
}

export interface Edge {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: Entity[];
  edges: Edge[];
}

export interface WorldMember {
  world_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string;
  invited_at: string;
  user?: User;
}

export interface Note {
  id: string;
  entity_id: string;
  author_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorldStats {
  world_id: string;
  total_entities: number;
  total_edges: number;
  total_members: number;
  total_events: number;
  entities_by_type: { entity_type: string; count: number }[];
  last_activity_at: string | null;
  most_connected: string | null;
}

export interface ConflictItem {
  type: string;
  description: string;
  data: Record<string, unknown>;
}

export type WorldCreate = { name: string; description?: string; is_public?: boolean };
export type WorldUpdate = Partial<WorldCreate>;

export type EntityCreate = {
  entity_type: EntityType;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
  timeline_position?: string;
};
export type EntityUpdate = Partial<Omit<EntityCreate, 'entity_type'>>;

export type EdgeCreate = {
  from_entity_id: string;
  to_entity_id: string;
  label: string;
  properties?: Record<string, unknown>;
};

export type NoteCreate = { content: string; is_private?: boolean };
export type NoteUpdate = { content?: string; is_private?: boolean };

export type MemberInvite = { email: string; role: MemberRole };
export type MemberRoleUpdate = { role: MemberRole };
