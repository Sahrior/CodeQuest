// All galaxy maps. Coordinates live in a 600 x 380 drawing area.
const n = (id, x, y) => ({ id, x, y });
const e = (from, to, w = 1) => ({ from, to, w });

export const GRAPHS = {
  // Level 1: undirected, every route costs the same
  lostAstronaut: {
    directed: false,
    nodes: [n("A", 60, 190), n("B", 170, 105), n("C", 170, 30), n("D", 290, 105), n("E", 400, 60), n("F", 450, 215), n("G", 545, 300), n("H", 235, 295), n("J", 60, 330), n("K", 135, 350)],
    edges: [e("A", "B"), e("B", "C"), e("B", "D"), e("D", "E"), e("E", "F"), e("F", "G"), e("A", "H"), e("H", "F"), e("J", "K")],
  },
  rescue: {
    directed: false,
    nodes: [n("A", 40, 190), n("B", 120, 80), n("C", 215, 40), n("D", 310, 80), n("E", 400, 40), n("F", 490, 80), n("G", 550, 150), n("L", 555, 270), n("H", 120, 300), n("I", 250, 335), n("J", 400, 320), n("K", 300, 195), n("M", 385, 195)],
    edges: [e("A", "B"), e("B", "C"), e("C", "D"), e("D", "E"), e("E", "F"), e("F", "G"), e("G", "L"), e("A", "H"), e("H", "I"), e("I", "J"), e("J", "L"), e("B", "H"), e("F", "J"), e("K", "M")],
  },

  // Level 2: directed, positive fuel costs
  fuelA: {
    directed: true,
    nodes: [n("A", 70, 190), n("B", 300, 70), n("C", 300, 310), n("D", 530, 190)],
    edges: [e("A", "B", 10), e("A", "C", 3), e("C", "B", 2), e("B", "D", 4), e("C", "D", 15)],
  },
  fuelCrisis: {
    directed: true,
    nodes: [n("A", 45, 190), n("B", 150, 75), n("C", 150, 190), n("D", 150, 315), n("E", 290, 70), n("F", 290, 190), n("G", 290, 330), n("H", 430, 60), n("I", 430, 170), n("J", 565, 255)],
    edges: [e("A", "B", 7), e("A", "C", 2), e("A", "D", 12), e("C", "B", 3), e("C", "E", 9), e("B", "E", 4), e("B", "F", 8), e("D", "G", 5), e("E", "H", 3), e("F", "H", 2), e("F", "I", 6), e("G", "J", 6), e("H", "J", 5), e("I", "J", 4)],
  },

  // Level 3: directed, some negative costs (energy portals)
  portalIntro: {
    directed: true,
    nodes: [n("A", 70, 190), n("B", 250, 70), n("C", 250, 310), n("D", 520, 190)],
    edges: [e("A", "B", 4), e("A", "C", 3), e("B", "C", -6), e("C", "D", 3)],
    edgeOrder: [e("C", "D", 3), e("B", "C", -6), e("A", "B", 4), e("A", "C", 3)],
  },
  negativePortal: {
    directed: true,
    nodes: [n("A", 60, 190), n("B", 220, 80), n("C", 220, 300), n("D", 400, 190), n("E", 550, 190)],
    edges: [e("A", "B", 4), e("A", "C", 5), e("B", "C", -3), e("B", "D", 6), e("C", "D", 2), e("D", "E", -4), e("C", "E", 5)],
    edgeOrder: [e("D", "E", -4), e("C", "E", 5), e("C", "D", 2), e("B", "D", 6), e("B", "C", -3), e("A", "C", 5), e("A", "B", 4)],
  },
  energyTrap: {
    directed: true,
    nodes: [n("A", 70, 260), n("B", 220, 90), n("C", 380, 260), n("D", 540, 260)],
    edges: [e("A", "B", 2), e("B", "C", -5), e("C", "A", 1), e("C", "D", 4)],
  },
  forbidden: {
    directed: true,
    nodes: [n("A", 50, 190), n("B", 180, 90), n("C", 180, 290), n("D", 330, 90), n("H", 500, 90), n("E", 330, 290), n("F", 470, 230), n("G", 470, 335)],
    edges: [e("A", "B", 4), e("A", "C", 2), e("C", "B", -1), e("B", "D", 3), e("D", "H", 2), e("C", "E", 6), e("E", "F", -4), e("F", "G", 1), e("G", "E", 2)],
  },
};

export const FUEL_LIMIT = 18;
