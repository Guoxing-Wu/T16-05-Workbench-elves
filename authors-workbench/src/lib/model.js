import { localId } from "./utils";

export function makeProject({ title, targetWordCount }) {
  return {
    id: localId(), // stands in for a backend-assigned id in this no-backend build
    title,
    targetWordCount,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: [],
  };
}

export function makeChapter(order, n) {
  return {
    id: localId(),
    title: `Chapter ${n}`,
    order,
    targetWordCount: 0,
    actualWordCount: 0,
  };
}
