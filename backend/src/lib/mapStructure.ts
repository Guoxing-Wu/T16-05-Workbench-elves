import { StoryStructure } from "./structures";

//each chapter in the structure
export type ChapterStructureInfo = {
  order: number;        
  act: string;           //which act it belongs to
  beatNames: string[];   // beats within this chapter
};

export function mapBeatsToChapters(
  structure: StoryStructure,
  numberOfChapters: number
): ChapterStructureInfo[] {
  // initialise every chapter, empty act and story beat
  const chapters: ChapterStructureInfo[] = Array.from(
    { length: numberOfChapters },
    (_, i) => ({
      order: i + 1,
      act: "",
      beatNames: [],
    })
  );

  //loop through every beat, calculate which chapter it belongs to
  for (const beat of structure.beats) {
    const index = Math.min(
      numberOfChapters - 1, //avoid out of index when the percentage is 100
      Math.floor((beat.percentage / 100) * numberOfChapters)
    );

    chapters[index].beatNames.push(beat.name);
    chapters[index].act = beat.act;
  }

  //if chapter don't have mapped beat, inherit the act of the last chapter that has act
  let lastAct = structure.beats[0]?.act ?? "";
  for (const chapter of chapters) {
    if (chapter.act) {
      lastAct = chapter.act;
    } else {
      chapter.act = lastAct;
    }
  }

  return chapters;
}