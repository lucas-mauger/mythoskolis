import { defineCollection, z } from "astro:content";

const dieux = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    role: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),  // /images/artemis.webp
    video: z.string().optional(),   // <-- AJOUT ICI
    parents: z.array(z.string()).optional(),
    symboles: z.array(z.string()).optional(),
    domaines: z.array(z.string()).optional(),
  }),
});

export const collections = {
  dieux,
};
