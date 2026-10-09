import type { GuestNotesStorage, Session } from "../../api/notesApi";

export type GuestRequest = {
  httpMethod?: string;
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: string | unknown;
  session?: Session;
};

export type GuestResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

export type GuestHandler = (
  event: GuestRequest,
  storage: GuestNotesStorage,
) => GuestResponse;

export type { GuestNotesStorage, Session };
