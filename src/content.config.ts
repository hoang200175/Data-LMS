import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const weeks = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/weeks' }),
  schema: z.object({ week: z.number(), title: z.string(), minutes: z.number().optional() }),
});

export const collections = { weeks };
