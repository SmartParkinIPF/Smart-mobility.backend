import { z } from "zod";
import { rolSchema } from "./user.validator";

export const assignRoleSchema = z.object({
  currentUserId: z.string().uuid(),
  role: rolSchema,
});
