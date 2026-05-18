import { api } from './client';
import type { Note, NoteCreate, NoteUpdate } from '@/types';

export const notesApi = {
  list: (worldId: string, entityId: string) =>
    api
      .get<Note[]>(`/worlds/${worldId}/entities/${entityId}/notes`)
      .then((r) => r.data),
  create: (worldId: string, entityId: string, data: NoteCreate) =>
    api
      .post<Note>(`/worlds/${worldId}/entities/${entityId}/notes`, data)
      .then((r) => r.data),
  update: (worldId: string, entityId: string, noteId: string, data: NoteUpdate) =>
    api
      .patch<Note>(`/worlds/${worldId}/entities/${entityId}/notes/${noteId}`, data)
      .then((r) => r.data),
  delete: (worldId: string, entityId: string, noteId: string) =>
    api.delete(`/worlds/${worldId}/entities/${entityId}/notes/${noteId}`),
};
