import { z } from 'zod';

import { GRADES } from './grade';

// Apart from the grades themselves, so that the server's engine bundle does not carry Zod.
export const gradeSchema = z.enum(GRADES);
