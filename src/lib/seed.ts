import seed from "@/data/seed-blocks.json";
import type { Block, Chapter, DashboardRow, Section } from "@/lib/types";

type SeedData = {
  sections: Section[];
  chapters: Chapter[];
  blocks: Block[];
};

const typedSeed = seed as SeedData;

export function getSeedDashboardRows(): DashboardRow[] {
  return typedSeed.blocks
    .map((block) => {
      const section = typedSeed.sections.find((item) => item.id === block.section_id);
      const chapter = typedSeed.chapters.find((item) => item.id === block.chapter_id);
      if (!section || !chapter) return null;
      return { ...block, section, chapter };
    })
    .filter((row): row is DashboardRow => Boolean(row));
}

export function getSeedBlock(id: string) {
  return getSeedDashboardRows().find((block) => block.id === id) ?? null;
}
