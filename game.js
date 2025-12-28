/* ===== CANVAS ===== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== UI ===== */
const menu = document.getElementById("menu");
const pauseUI = document.getElementById("pause");
const hpBar = document.getElementById("hpBar");
const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");

/* ===== STATE ===== */
let state = "MENU";

/* ===== PLAYER ===== */
const player = {
  x:180, y:520,
  w:30, h:40,
  hp:100, maxHp:100,
  speed:5
};

/* ===== GAME DATA ===== */
let bullets = [];
let enemies = [];
let bossBullets = [];
let level = 1;
let score = 0;

/* ===== INPUT ===== */
let left=false, right=false, up=false, down=false, shoot=false;

/* ===== KEYBOARD ===== */
document.addEventListener("keydown", e=>{
  if(["ArrowLeft","a"].includes(e.key)) left=true;
  if(["ArrowRight","d"].includes(e.key)) right=true;
  if(["ArrowUp","w"].includes(e.key)) up=true;
  if(["ArrowDown","s"].includes(e.key)) down=true;
  if(e.key===" ") shoot=true;
  if(e.key==="Escape") pauseGame();
});
document.addEventListener("keyup", e=>{
  if(["ArrowLeft","a"].includes(e.key)) left=false;
  if(["ArrowRight","d"].includes(e.key)) right=false;
  if(["ArrowUp","w"].includes(e.key)) up=false;
  if(["ArrowDown","s"].includes(e.key)) down=false;
  if(e.key===" ") shoot=false;
});

/* ===== MOUSE ===== */
canvas.addEventListener("mousemove", e=>{
  if(state!=="PLAYING") return;
  const r = canvas.getBoundingClientRect();
  player.x = e.clientX - r.left;
  player.y = e.clientY - r.top;
});

/* ===== TOUCH ===== */
function bind(btn, fn){
  btn.addEventListener("touchstart", e=>{e.preventDefault(); fn(true);});
  btn.addEventListener("touchend", e=>{e.preventDefault(); fn(false);});
}
bind(btnLeft,v=>left=v);
bind(btnRight,v=>right=v);
bind(btnUp,v=>up=v);
bind(btnDown,v=>down=v);
bind(btnShoot,v=>shoot=v);

/* ===== MENU ===== */
function startGame(){
  menu.style.display="none";
  resetGame();
  state="PLAYING";
}
function pauseGame(){
  if(state==="PLAYING"){
    state="PAUSED";
    pauseUI.style.display="flex";
  }
}
function resumeGame(){
  state="PLAYING";
  pauseUI.style.display="none";
}

/* ===== RESET ===== */
function resetGame(){
  bullets=[]; enemies=[]; bossBullets=[];
  level=1; score=0;
  player.hp=player.maxHp;
  levelText.textContent=level;
  scoreText.textContent=score;
  spawnEnemies();
}

/* ===== SPAWN ===== */
function spawnEnemies(){
  enemies=[];
  if(level === 5){
    // BOSS MEDIUM
    enemies.push({
      x:100,y:-60,w:160,h:40,
      hp:120,max:120,
      boss:true,angle:0
    });
  }else{
    for(let i=0;i<level+2;i++){
      enemies.push({
        x:Math.random()*320,
        y:-Math.random()*300,
        w:30,h:30,
        hp:20,
        boss:false
      });
    }
  }
}

/* ===== SHOOT ===== */
let shootCD=0;
function shootPlayer(){
  if(shootCD<=0){
    bullets.push({
      x:player.x,
      y:player.y,
      size:4 + level * 2   // 🔥 PELURU MAKIN BESAR
    });
    shootCD=12;
  }
}

/* ===== UPDATE ===== */
function update(){
  if(state!=="PLAYING") return;

  if(left && player.x>0) player.x-=player.speed;
  if(right && player.x<canvas.width) player.x+=player.speed;
  if(up && player.y>0) player.y-=player.speed;
  if(down && player.y<canvas.height) player.y+=player.speed;

  if(shoot) shootPlayer();
  shootCD--;

  bullets.forEach(b=>b.y-=8);
  bullets = bullets.filter(b=>b.y>-20);

  enemies.forEach(e=>{
    e.y+= e.boss ? 0.7 : 1.2;

    // GAME OVER kalau musuh lolos
    if(e.y > canvas.height){
      gameOver();
    }

    if(e.boss){
      e.angle+=0.1;
      bossBullets.push({
        x:e.x+e.w/2 + Math.sin(e.angle)*30,
        y:e.y+e.h
      });
    }
  });

  bossBullets.forEach(b=>b.y+=4);

  bullets.forEach((b,bi)=>{
    enemies.forEach((e,ei)=>{
      if(b.x>e.x && b.x<e.x+e.w &&
         b.y>e.y && b.y<e.y+e.h){
        e.hp-=15;
        bullets.splice(bi,1);
        if(e.hp<=0){
          score += e.boss ? 500 : 100;
          scoreText.textContent=score;
          enemies.splice(ei,1);

          // FINISH GAME
          if(level === 5){
            finishGame();
          }
        }
      }
    });
  });

  bossBullets.forEach((b,bi)=>{
    if(b.x>player.x-player.w/2 &&
       b.x<player.x+player.w/2 &&
       b.y>player.y-player.h/2 &&
       b.y<player.y+player.h/2){
      player.hp-=10;
      bossBullets.splice(bi,1);
      if(player.hp<=0) gameOver();
    }
  });

  if(enemies.length===0 && level<5){
    level++;
    levelText.textContent=level;
    spawnEnemies();
  }

  hpBar.style.width=(player.hp/player.maxHp*100)+"%";
}

/* ===== DRAW ===== */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // PLAYER (PESAWAT)
  ctx.fillStyle="cyan";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y-player.h/2);
  ctx.lineTo(player.x-player.w/2, player.y+player.h/2);
  ctx.lineTo(player.x+player.w/2, player.y+player.h/2);
  ctx.closePath();
  ctx.fill();

  // BULLETS
  ctx.fillStyle="yellow";
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI*2);
    ctx.fill();
  });

  // ENEMIES
  enemies.forEach(e=>{
    ctx.fillStyle=e.boss?"purple":"red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
    if(e.boss){
      ctx.fillStyle="white";
      ctx.fillRect(e.x,e.y-5,e.w*(e.hp/e.max),4);
    }
  });

  ctx.fillStyle="orange";
  bossBullets.forEach(b=>ctx.fillRect(b.x,b.y,6,12));
}

/* ===== END STATES ===== */
function gameOver(){
  alert("GAME OVER\nScore: "+score);
  location.reload();
}
function finishGame(){
  alert("YOU WIN!\nScore: "+score);
  location.reload();
}

/* ===== LOOP ===== */
(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
