const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fireworks = [];

function Firework() {
  this.x = Math.random() * canvas.width;
  this.y = canvas.height;
  this.radius = Math.random() * 3 + 2;
  this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  this.vx = (Math.random() - 0.5) * 10;
  this.vy = Math.random() * -15 - 5;
  this.alpha = 1;
}

Firework.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.vy += 0.2;
  this.alpha -= 0.01;
};

Firework.prototype.draw = function () {
  ctx.globalAlpha = this.alpha;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
  ctx.fillStyle = this.color;
  ctx.fill();
};

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (Math.random() < 0.05) fireworks.push(new Firework());
  fireworks = fireworks.filter(f => f.alpha > 0);
  fireworks.forEach(f => {
    f.update();
    f.draw();
  });
}
animate();

function showResponse(choice) {
  const responseBox = document.getElementById('responseBox');
  if (choice === 'party') {
    responseBox.textContent = "YAY! 🎉 You're giving a party! 🍰🥳";
  } else {
    responseBox.textContent = "Pack your bags, skydiver! 🪂💀.........JK give us party kanjus";
  }
}

window.addEventListener('click', () => {
  const music = document.getElementById('bg-music');
  if (music && music.paused) music.play().catch(e => console.log("Blocked:", e));
}, { once: true });
