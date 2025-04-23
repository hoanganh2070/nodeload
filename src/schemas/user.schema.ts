// src/schemas/user.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
