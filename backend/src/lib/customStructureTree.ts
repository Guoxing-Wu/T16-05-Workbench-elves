import { prisma } from "./prisma";
//structure of the node parse from frontend
export type IncomingNode = {
  name: string;
  type: string;
  percentage: number;
  children?: IncomingNode[];
};



// recursively store a nested tree in a database
// structureId: which CustomStructure does the node belongs to
// nodes: the nodes need to be save at current level
// parentId: id of the parent node of the current node
async function saveNodesRecursively(
  structureId: number,
  nodes: IncomingNode[],
  parentId: number | null
) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // save the current node, and create an id
    const savedNode = await prisma.customStructureNode.create({
      data: {
        name: node.name,
        type: node.type,
        percentage: node.percentage,
        order: i, // order = its index in the array
        structureId: structureId,
        parentId: parentId,
      },
    });

    //if the current have children, recursively save
    if (node.children && node.children.length > 0) {
      await saveNodesRecursively(structureId, node.children, savedNode.id);
    }
  }
}

export { saveNodesRecursively };

// structure of node from the database
type DbNode = {
  id: number;
  name: string;
  type: string;
  percentage: number;
  order: number;
  parentId: number | null;
};

// node formate parsed to frontend
export type OutgoingNode = {
  id: number;
  name: string;
  type: string;
  percentage: number;
  children: OutgoingNode[];
};

//construct the tree from the flat array
// Uses a map for O(1) parent lookups instead of nested loops.
export function buildTree(flatNodes: DbNode[]): OutgoingNode[] {
  const nodeMap = new Map<number, OutgoingNode>();
  for (const node of flatNodes) {
    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      percentage: node.percentage,
      children: [],
    });
  }
  const roots: OutgoingNode[] = [];

  // sort by order
  const sorted = [...flatNodes].sort((a, b) => a.order - b.order);

  for (const node of sorted) {
    const current = nodeMap.get(node.id)!;

    if (node.parentId === null) {
      // no parent node -> at the top
      roots.push(current);
    } else {
      // parent node exist, add to children array
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(current);
      }
    }
  }

  return roots;
}