import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    section: z.enum(['serif', 'mono']),
    hex: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
