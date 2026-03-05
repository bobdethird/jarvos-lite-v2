import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

export const desmosAgentRequestSchema = z.object({
  id: z.string().uuid(),
  message: userMessageSchema,
  desmosState: z.string().optional(),
  selectedChatModel: z.string().optional(),
});

export type DesmosAgentRequestBody = z.infer<typeof desmosAgentRequestSchema>;
