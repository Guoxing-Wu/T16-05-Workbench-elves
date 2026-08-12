let projects = [
  {
    id: 1,
    title: "Example Novel",
    targetWordCount: 80000,
  },
];

export async function GET() {
  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const newProject = {
    id: projects.length + 1,
    title: body.title,
    targetWordCount: body.targetWordCount,
  };

  projects.push(newProject);

  return Response.json(newProject, { status: 201 });
}
