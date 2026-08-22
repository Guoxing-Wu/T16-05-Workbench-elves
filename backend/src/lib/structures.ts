// definition of a story beat
export type StoryBeat = {
  name: string;        // name of story beat
  act: string;         // which act it belongs to
  percentage: number;  // the percentage of the book of it happen
};

//definition of a story structure
export type StoryStructure = {
  id: string;           //unique identification
  name: string;         // name of the structure
  description: string;  // briefly describe the structure
  beats: StoryBeat[];   // what story beat it contains
};

//actual structures
export const STRUCTURES: StoryStructure[] = [
  {
    id: "save-the-cat",
    name: "Save the Cat",
    description: "a 15-beat storytelling framework created by screenwriter Blake Snyder",
    beats: [
      { name: "Opening Image", act: "Act 1", percentage: 1 },
      { name: "Theme Stated", act: "Act 1", percentage: 5 },
      { name: "Set-Up", act: "Act 1", percentage: 10 },
      { name: "Catalyst", act: "Act 1", percentage: 12 },
      { name: "Debate", act: "Act 1", percentage: 20 },
      { name: "Break into Two", act: "Act 2", percentage: 25 },
      { name: "B Story", act: "Act 2", percentage: 30 },
      { name: "Fun and Games", act: "Act 2", percentage: 50 },
      { name: "Midpoint", act: "Act 2", percentage: 50 },
      { name: "Bad Guys Close In", act: "Act 2", percentage: 65 },
      { name: "All Is Lost", act: "Act 2", percentage: 75 },
      { name: "Dark Night of the Soul", act: "Act 2", percentage: 80 },
      { name: "Break into Three", act: "Act 3", percentage: 85 },
      { name: "Finale", act: "Act 3", percentage: 95 },
      { name: "Final Image", act: "Act 3", percentage: 100 },
    ],
  },
  {
    id: "three-act",
    name: "three act",
    description: " classic storytelling model that divides a narrative into three parts: Act 1 (Setup), Act 2 (Confrontation), and Act 3 (Resolution)",
    beats: [
      { name: "Setup", act: "Act 1", percentage: 25 },
      { name: "Confrontation", act: "Act 2", percentage: 75 },
      { name: "Resolution", act: "Act 3", percentage: 100 },
    ],
  },
  {
    id: "heros-journey",
    name: "The Hero's Journey",
    description: "a classic storytelling pattern. It follows a hero who leaves their normal life, faces hard tests in a special world, and returns home forever changed. 12 steps split into 3 acts.",
    beats: [
      { name: "Ordinary World", act: "Act 1: Departure", percentage: 5 },
      { name: "Call to Adventure", act: "Act 1: Departure", percentage: 10 },
      { name: "Refusal of the Call", act: "Act 1: Departure", percentage: 15 },
      { name: "Meeting the Mentor", act: "Act 1: Departure", percentage: 20 },
      { name: "Crossing the Threshold", act: "Act 1: Departure", percentage: 25 },
      { name: "Tests, Allies, Enemies", act: "Act 2: Initiation", percentage: 40 },
      { name: "Approach to the Inmost Cave", act: "Act 2: Initiation", percentage: 50 },
      { name: "Ordeal", act: "Act 2: Initiation", percentage: 60 },
      { name: "Reward (Seizing the Sword)", act: "Act 2: Initiation", percentage: 70 },
      { name: "The Road Back", act: "Act 3: Return", percentage: 80 },
      { name: "Resurrection", act: "Act 3: Return", percentage: 90 },
      { name: "Return with the Elixir", act: "Act 3: Return", percentage: 100 },
    ],
  },
  {
    id: "freytags-pyramid",
    name: "Freytag's Pyramid",
    description: "a five-part dramatic structure created by 19th-century German playwright Gustav Freytag to map out the rising and falling action of classical tragedies.",
    beats: [
      { name: "Exposition", act: "Exposition", percentage: 10 },
      { name: "Rising Action", act: "Rising Action", percentage: 40 },
      { name: "Climax", act: "Climax", percentage: 50 },
      { name: "Falling Action", act: "Falling Action", percentage: 80 },
      { name: "Denouement", act: "Denouement", percentage: 100 },
    ],
  },
  {
    id: "seven-point",
    name: "Seven Point Structure",
    description: "a plotting method that starts with your ending and works backward to build a balanced narrative arc",
    beats: [
      { name: "Hook", act: "Act 1", percentage: 1 },
      { name: "Plot Turn 1", act: "Act 1", percentage: 20 },
      { name: "Pinch Point 1", act: "Act 2", percentage: 37 },
      { name: "Midpoint", act: "Act 2", percentage: 50 },
      { name: "Pinch Point 2", act: "Act 2", percentage: 65 },
      { name: "Plot Turn 2", act: "Act 3", percentage: 80 },
      { name: "Resolution", act: "Act 3", percentage: 100 },
    ],
  },
  {
    id: "five-act",
    name: "Five-Act Structure",
    description: "divides a narrative into five distinct phases—exposition, rising action, climax, falling action, and resolution",
    beats: [
      { name: "Exposition", act: "Act I", percentage: 20 },
      { name: "Rising Action", act: "Act II", percentage: 40 },
      { name: "Climax", act: "Act III", percentage: 60 },
      { name: "Falling Action", act: "Act IV", percentage: 80 },
      { name: "Resolution", act: "Act V", percentage: 100 },
    ],
  },
];

// find the structure based on the id, return undefined if can not find
export function getStructureById(id: string) {
  return STRUCTURES.find((s) => s.id === id);
}