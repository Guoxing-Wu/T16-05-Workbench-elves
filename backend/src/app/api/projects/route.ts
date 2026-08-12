import { prisma } from "../../../lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany();

  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const newProject = await prisma.project.create({
    data: {
      title: body.title,
      targetWordCount: body.targetWordCount,
    },
  });

  return Response.json(newProject, { status: 201 });
}