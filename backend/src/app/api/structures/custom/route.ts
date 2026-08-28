import { prisma } from "../../../../lib/prisma";
import { saveNodesRecursively, IncomingNode } from "../../../../lib/customStructureTree";

export async function GET() {
  // Return summary fields only; full trees are fetched via the [id] route
  const structures = await prisma.customStructure.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });

  return Response.json(structures);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { name, description, nodes } = body;

  // legal check
  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "Structure name is required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return Response.json(
      { error: "At least one node is required" },
      { status: 400 }
    );
  }

  // create CustomStructure
  const structure = await prisma.customStructure.create({
    data: {
      name,
      description: description ?? null,
    },
  });

  //save the entire tree
  await saveNodesRecursively(structure.id, nodes as IncomingNode[], null);

  return Response.json(
    { id: structure.id, name: structure.name },
    { status: 201 }
  );
}