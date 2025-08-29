// UI elements and helpers
import { player } from './player.js';
import { generateAchievements } from './achievements.js';

let actionLog=[];

const hpFill=document.getElementById('hpFill');
const mpFill=document.getElementById('mpFill');
const hpLbl=document.getElementById('hpLbl');
const mpLbl=document.getElementById('mpLbl');
const hudFloor=document.getElementById('hudFloor');
const hudSeed=document.getElementById('hudSeed');
const hudGold=document.getElementById('hudGold');
const hudDmg=document.getElementById('hudDmg');
const hudScore=document.getElementById('hudScore');
const hudKills=document.getElementById('hudKills');
const xpFill=document.getElementById('xpFill');
const xpLbl=document.getElementById('xpLbl');
const hudLvl=document.getElementById('hudLvl');
const hudSpell=document.getElementById('hudSpell');
const hudAbilityLabel=document.getElementById('hudAbilityLabel');

function updateResourceUI(){
  if(player.class==='mage' || player.class==='summoner'){
    mpFill.style.width=`${(player.mp/player.mpMax)*100}%`;
    mpLbl.textContent=`Mana ${player.mp}/${player.mpMax}`;
  }else{
    mpFill.style.width=`${(player.sp/player.spMax)*100}%`;
    mpLbl.textContent=`Stamina ${player.sp}/${player.spMax}`;
  }
}

function updateXPUI(){
  const pct=Math.min(100, Math.floor(100*player.xp/Math.max(1,player.xpToNext)));
  xpFill.style.width=`${pct}%`;
  xpLbl.textContent=`XP ${player.xp}/${player.xpToNext}`;
  hudLvl.textContent=player.lvl;
}

function updateScoreUI(){
  if(hudScore) hudScore.textContent = Math.floor(player.score);
  if(hudKills) hudKills.textContent = player.kills;
}

function renderActionLog(){
  const panel=document.getElementById('actionLog');
  if(!panel) return;
  let html='<div class="section-title">Action Log</div>';
  for(const msg of actionLog){ html+=`<div class="kv">${msg}</div>`; }
  panel.innerHTML=html;
}

function toggleActionLog(){
  const panel=document.getElementById('actionLog');
  if(!panel) return;
  const show=panel.style.display===''||panel.style.display==='none';
  panel.style.display=show?'block':'none';
  if(show) renderActionLog();
}

function showToast(msg){
  actionLog.push(msg);
  if(actionLog.length>50) actionLog.shift();
  const panel=document.getElementById('actionLog');
  if(panel && panel.style.display==='block') renderActionLog();
}

function showBossAlert(){
  const d=document.createElement('div');
  d.id='bossAlert';
  d.textContent='Boss floor — good luck!';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),4000);
}

function showRespawn(){
  const d=document.getElementById('respawn');
  if(d){
    updateScoreUI();
    const fs=document.getElementById('finalScore'); if(fs) fs.textContent=Math.floor(player.score);
    const fk=document.getElementById('finalKills'); if(fk) fk.textContent=player.kills;
    const ff=document.getElementById('finalFloors'); if(ff) ff.textContent=player.floorsCleared;
    const ft=document.getElementById('finalTime'); if(ft) ft.textContent=Math.floor(player.timeSurvived/1000);
    const fa=document.getElementById('finalAchievements');
    if(fa){
      fa.innerHTML='';
      for(const a of generateAchievements(player)){
        const li=document.createElement('li');
        li.textContent=a;
        fa.appendChild(li);
      }
    }
    d.style.display='grid';
  }
}

export {
  actionLog,
  hpFill, mpFill, hpLbl, mpLbl,
  hudFloor, hudSeed, hudGold, hudDmg,
  hudScore, hudKills, xpFill, xpLbl,
  hudLvl, hudSpell, hudAbilityLabel,
  updateResourceUI, updateXPUI, updateScoreUI,
  renderActionLog, toggleActionLog,
  showToast, showBossAlert, showRespawn
};
