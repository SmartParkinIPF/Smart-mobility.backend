import { z } from "zod";

export const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const createMarkerSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  coordinates: z.array(coordinateSchema).min(1),
  pinColor: z.string().optional(),
});
