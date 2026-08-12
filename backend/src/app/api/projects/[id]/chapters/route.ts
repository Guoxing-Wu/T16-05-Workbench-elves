import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = Number(id);

  const chapters = await prisma.chapter.findMany({
    where: {
      projectId: projectId,
    },
    orderBy: {
      order: "asc",
    },
  });

  return Response.json(chapters);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = Number(id);

  const body = await request.json();

  const newChapter = await prisma.chapter.create({
    data: {
      title: body.title,
      order: body.order,
      targetWordCount: body.targetWordCount,
      projectId: projectId,
    },
  });

  return Response.json(newChapter, { status: 201 });
}