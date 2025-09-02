// Player inventory handling equipment and items.
// Added necklace and two ring slots for additional gear options
const SLOTS = [
  "helmet",
  "necklace",
  "chest",
  "legs",
  "hands",
  "feet",
  "ring1",
  "ring2",
  "weapon",
];
const BAG_SIZE = 25;
const POTION_BAG_SIZE = 15;

class PlayerInventory {
  constructor() {
    this.gold = 0;
    // Include new equipment slots in the player inventory
    this.equip = {
      helmet: null,
      necklace: null,
      chest: null,
      legs: null,
      hands: null,
      feet: null,
      ring1: null,
      ring2: null,
      weapon: null,
    };
    this.bag = new Array(BAG_SIZE).fill(null);
    this.potionBag = new Array(POTION_BAG_SIZE).fill(null);
    this.shopStock = [];
  }
}

const inventory = new PlayerInventory();

export { PlayerInventory, inventory, SLOTS, BAG_SIZE, POTION_BAG_SIZE };
