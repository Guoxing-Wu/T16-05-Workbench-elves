import { prisma } from "../../../lib/prisma";

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
    },
  });

  // Return project + calculated chapter number
  return Response.json(
    {
      ...newProject,
      numberOfChapters,
    },
    { status: 201 }
  );
}