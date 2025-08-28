// Player inventory handling equipment and items.
const SLOTS = ["helmet", "chest", "legs", "hands", "feet", "weapon"];
const BAG_SIZE = 12;
const POTION_BAG_SIZE = 3;

class PlayerInventory {
  constructor() {
    this.gold = 0;
    this.equip = { helmet:null, chest:null, legs:null, hands:null, feet:null, weapon:null };
    this.bag = new Array(BAG_SIZE).fill(null);
    this.potionBag = new Array(POTION_BAG_SIZE).fill(null);
    this.shopStock = [];
  }
}

const inventory = new PlayerInventory();

export { PlayerInventory, inventory, SLOTS, BAG_SIZE, POTION_BAG_SIZE };
