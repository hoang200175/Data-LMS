import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const media = z.object({
  kind: z.enum(['video', 'audio']),
  title: z.string(),
  src: z.string().optional(), // YouTube URL/ID, hoặc đường dẫn file audio trong public/
  note: z.string().optional(),
  lang: z.string().optional(),
  minutes: z.number().optional(),
});

const weeks = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/weeks' }),
  schema: z.object({
    week: z.number(),
    title: z.string(),
    minutes: z.number().optional(),
    goals: z.array(z.string()).optional(), // "Sau tuần này bạn có thể…"
    media: z.array(media).optional(), // video/audio tóm tắt tuần, hiện ở đầu trang
  }),
});

export const collections = { weeks };
