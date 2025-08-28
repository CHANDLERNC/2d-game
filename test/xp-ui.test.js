import test from 'node:test';
import assert from 'node:assert/strict';

const ids=['hpFill','mpFill','hpLbl','mpLbl','hudFloor','hudSeed','hudGold','hudDmg','hudScore','hudKills','xpFill','xpLbl','hudLvl','hudSpell','hudAbilityLabel'];
const elements={};
for(const id of ids){ elements[id]={ style:{}, textContent:'' }; }

global.document={
  getElementById:id=>elements[id],
  createElement:()=>({ style:{}, textContent:'', remove:()=>{} }),
  body:{ appendChild:()=>{} }
};

test('updateXPUI updates XP bar and level label', async () => {
  const { updateXPUI } = await import('../modules/ui.js');
  const { player } = await import('../modules/player.js');
  player.xp=30; player.xpToNext=60; player.lvl=2;
  updateXPUI();
  assert.equal(elements.xpFill.style.width, '50%');
  assert.equal(elements.xpLbl.textContent, 'XP 30/60');
  assert.equal(String(elements.hudLvl.textContent), '2');
});
