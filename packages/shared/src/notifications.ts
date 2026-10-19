import { z } from 'zod';

/** A parent's message to their child, as checked by send_child_message. */
export const CHILD_MESSAGE_MAX_LENGTH = 120;
export const childMessageSchema = z.string().trim().min(1).max(CHILD_MESSAGE_MAX_LENGTH);
