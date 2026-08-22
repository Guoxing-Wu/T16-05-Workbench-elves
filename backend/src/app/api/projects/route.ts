import { prisma } from "../../../lib/prisma";
import { getStructureById } from "../../../lib/structures";
import { mapBeatsToChapters } from "../../../lib/mapStructure";

export async function GET() {
  const projects = await prisma.project.findMany();

  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    title,
    targetWordCount,
    averageChapterLength,
    structureId,
  } = body;

  // Check input
  if (
    !title ||
    typeof targetWordCount !== "number" ||
    typeof averageChapterLength !== "number" ||
    targetWordCount <= 0 ||
    averageChapterLength <= 0
  ) {
    return Response.json(
      { error: "Invalid project data" },
      { status: 400 }
    );
  }

  //if parsed structureID, check whether the actual structure exist
  let structure = null;
  if (structureId) {
    structure = getStructureById(structureId);
    if (!structure) {
      return Response.json(
        { error: `Unknown structureId: ${structureId}` },
        { status: 400 }
      );
    }
  }

  // Calculate number of chapters
  const numberOfChapters = Math.ceil(
    targetWordCount / averageChapterLength
  );

  // Save project to database
  const newProject = await prisma.project.create({
    data: {
      title,
      targetWordCount,
      averageChapterLength,
      structureId: structureId ?? null,
    },
  });

  //automatically generate corresponding chapter if selected structure
  if (structure) {
    const chapterMap = mapBeatsToChapters(structure, numberOfChapters);
    const avgWordsPerChapter = Math.round(
      targetWordCount / numberOfChapters
    );

    await prisma.chapter.createMany({
      data: chapterMap.map((ch) => ({
        title:
          ch.beatNames.length > 0
            ? ch.beatNames.join(" / ")
            : `Chapter ${ch.order}`,
        order: ch.order,
        targetWordCount: avgWordsPerChapter,
        act: ch.act,
        beatName: ch.beatNames.join(", "),
        projectId: newProject.id,
      })),
    });
  }

  // Return project + calculated chapter number
  return Response.json(
    {
      ...newProject,
      numberOfChapters,
    },
    { status: 201 }
  );
}