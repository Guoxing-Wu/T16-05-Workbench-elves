-- CreateTable
CREATE TABLE "CustomStructure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomStructureNode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "order" INTEGER NOT NULL,
    "structureId" INTEGER NOT NULL,
    "parentId" INTEGER,
    CONSTRAINT "CustomStructureNode_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "CustomStructure" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomStructureNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CustomStructureNode" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
