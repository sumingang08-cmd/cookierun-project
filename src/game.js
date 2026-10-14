// 횡스크롤 장애물 러너 게임 엔진 (Canvas 기반)

const W = 960
const H = 320
const GROUND = 258

const STAND_H = 56
const DUCK_H = 34
const PLAYER_W = 46

const GRAVITY = 3000
const JUMP_V = -880
const FAST_FALL = 2600

const PTERO_W = 72
const PTERO_H = 40

// ---------- 난이도 튜닝 (여기만 수정하면 됨) ----------
const TUNING = {
  baseSpeed: 350, // 시작 속도 (px/s)
  maxSpeed: 1000, // 최대 속도 (px/s)
  accel: 20, // 초당 속도 증가량 (px/s²)

  pteroFirstAt: 3, // 익룡이 처음 등장하는 시간 (초)
  pteroChance: 0.55, // 장애물이 익룡일 확률 (0~1)
  pteroHighChance: 0.5, // 익룡이 높은 위치(숙이기)일 확률

  minGap: 360, // 장애물 사이 최소 간격 (px)
  maxGap: 640, // 장애물 사이 최대 간격 (px)

  firstSpawnDelay: 0.9, // 시작 후 첫 장애물까지 시간 (초)
}

// ---------- 헬퍼 ----------

function roundRect(ctx, x, y, w, h, r) {
  if (w < 0) w = 0
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// ---------- 캐릭터 (러너) ----------

function drawRunner(ctx, p, t) {
  const { x, y, w, h } = p
  const ducking = p.ducking && p.grounded
  const airborne = !p.grounded
  const feet = y + h

  ctx.save()

  // 꼬리 (왼쪽 뒤)
  const tailY = ducking ? feet - h * 0.45 : feet - h * 0.5
  ctx.fillStyle = '#2f9e63'
  ctx.beginPath()
  ctx.moveTo(x + 5, tailY)
  ctx.lineTo(x - 14, tailY - 9)
  ctx.lineTo(x + 2, tailY + 13)
  ctx.closePath()
  ctx.fill()

  // 몸통
  const bodyTop = ducking ? y + h * 0.04 : y + h * 0.1
  const bodyBottom = feet - (ducking ? 3 : h * 0.42)
  const bodyH = bodyBottom - bodyTop
  roundRect(ctx, x - 2, bodyTop, w + 2, bodyH, 10)
  ctx.fillStyle = '#4fc08d'
  ctx.fill()

  // 배
  roundRect(ctx, x + 4, bodyTop + bodyH * 0.34, w - 10, bodyH * 0.55, 6)
  ctx.fillStyle = '#d8f6e6'
  ctx.fill()

  // 머리 (오른쪽 앞)
  const headW = w * 0.44
  const headH = h * 0.34
  const headX = x + w * 0.52
  const headY = bodyTop - headH * 0.72
  roundRect(ctx, headX, headY, headW, headH, 5)
  ctx.fillStyle = '#4fc08d'
  ctx.fill()
  // 주둥이
  ctx.fillStyle = '#2f9e63'
  roundRect(ctx, headX + headW * 0.45, headY + headH * 0.42, headW * 0.62, headH * 0.52, 3)
  ctx.fill()

  // 눈
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(headX + headW * 0.36, headY + headH * 0.4, 3.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.arc(headX + headW * 0.39, headY + headH * 0.42, 1.8, 0, Math.PI * 2)
  ctx.fill()

  // 다리
  ctx.fillStyle = '#2f9e63'
  if (airborne) {
    roundRect(ctx, x + 4, feet - 8, 7, 8, 3)
    ctx.fill()
    roundRect(ctx, x + w - 11, feet - 8, 7, 8, 3)
    ctx.fill()
  } else if (ducking) {
    roundRect(ctx, x + 6, feet - 7, 10, 7, 3)
    ctx.fill()
    roundRect(ctx, x + w - 8, feet - 7, 10, 7, 3)
    ctx.fill()
  } else {
    const s = Math.sin(t * 18)
    const l1 = 9 + s * 4
    const l2 = 9 - s * 4
    roundRect(ctx, x + 6, feet - l1, 8, l1, 3)
    ctx.fill()
    roundRect(ctx, x + w - 14, feet - l2, 8, l2, 3)
    ctx.fill()
  }

  ctx.restore()
}

// ---------- 익룡 ----------

function drawWing(ctx, px, py, dir, angle) {
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(angle * dir)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-20, -18, -46, -10)
  ctx.quadraticCurveTo(-24, 0, 0, 4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawPtero(ctx, o, t) {
  const { x, y, w, h } = o
  const cx = x + w / 2
  const cy = y + h / 2
  const flap = Math.sin(t * 11 + x * 0.01)

  ctx.save()

  // 날개 (뒤)
  ctx.fillStyle = '#6d4fc0'
  drawWing(ctx, cx - 2, cy - 2, -1, flap * 0.55 - 0.25)

  // 몸통
  ctx.fillStyle = '#5b6bd6'
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.28, h * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()

  // 머리/부리 (왼쪽, 플레이어 방향)
  ctx.fillStyle = '#6d4fc0'
  const headX = cx - w * 0.28
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.15, cy - h * 0.16)
  ctx.lineTo(headX - w * 0.42, cy - h * 0.08)
  ctx.lineTo(headX, cy + h * 0.14)
  ctx.closePath()
  ctx.fill()

  // 볏
  ctx.fillStyle = '#5b6bd6'
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.04, cy - h * 0.24)
  ctx.lineTo(cx - w * 0.2, cy - h * 0.52)
  ctx.lineTo(cx + w * 0.06, cy - h * 0.3)
  ctx.closePath()
  ctx.fill()

  // 눈
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx - w * 0.06, cy - h * 0.04, 2.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.arc(cx - w * 0.07, cy - h * 0.04, 1.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// ---------- 장애물 (지상) ----------

function drawCactus(ctx, o) {
  const { x, y, w, h } = o
  ctx.save()
  ctx.fillStyle = '#3fae6a'
  roundRect(ctx, x + w * 0.28, y, w * 0.44, h, w * 0.22)
  ctx.fill()
  // 왼팔
  roundRect(ctx, x, y + h * 0.32, w * 0.3, h * 0.16, w * 0.15)
  ctx.fill()
  roundRect(ctx, x, y + h * 0.32, w * 0.16, h * 0.32, w * 0.08)
  ctx.fill()
  // 오른팔
  roundRect(ctx, x + w * 0.7, y + h * 0.5, w * 0.3, h * 0.16, w * 0.15)
  ctx.fill()
  roundRect(ctx, x + w * 0.84, y + h * 0.5, w * 0.16, h * 0.28, w * 0.08)
  ctx.fill()
  ctx.fillStyle = '#2f8a52'
  roundRect(ctx, x + w * 0.34, y, w * 0.12, h, w * 0.06)
  ctx.fill()
  ctx.restore()
}

function drawRock(ctx, o) {
  const { x, y, w, h } = o
  ctx.save()
  ctx.fillStyle = '#8b93a7'
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x + w * 0.12, y + h * 0.45)
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.05, x + w * 0.9, y + h * 0.4)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#a8b0c4'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.2, y + h)
  ctx.lineTo(x + w * 0.26, y + h * 0.5)
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.16, x + w * 0.78, y + h * 0.48)
  ctx.lineTo(x + w * 0.8, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawObstacle(ctx, o, t) {
  if (o.type === 'ptero') {
    drawPtero(ctx, o, t)
    // 행동 안내 화살표 (점프/숙이기)
    const dir = o.action === 'jump' ? 1 : -1
    drawChevron(ctx, o.x + o.w / 2, o.y - 16, dir, t)
  } else if (o.type === 'cactus') {
    drawCactus(ctx, o)
  } else {
    drawRock(ctx, o)
  }
}

function drawChevron(ctx, cx, cy, dir, t) {
  const s = 7
  const pulse = 0.55 + Math.sin(t * 6) * 0.25
  ctx.save()
  ctx.globalAlpha = pulse
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#ffd54f'
  ctx.beginPath()
  if (dir > 0) {
    ctx.moveTo(cx - s, cy + s * 0.5)
    ctx.lineTo(cx, cy - s * 0.7)
    ctx.lineTo(cx + s, cy + s * 0.5)
  } else {
    ctx.moveTo(cx - s, cy - s * 0.5)
    ctx.lineTo(cx, cy + s * 0.7)
    ctx.lineTo(cx + s, cy - s * 0.5)
  }
  ctx.stroke()
  ctx.restore()
}

// ---------- 구름 ----------

function drawCloud(ctx, c) {
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(c.x, c.y, 30 * c.s, 12 * c.s, 0, 0, Math.PI * 2)
  ctx.ellipse(c.x - 22 * c.s, c.y + 3 * c.s, 18 * c.s, 9 * c.s, 0, 0, Math.PI * 2)
  ctx.ellipse(c.x + 22 * c.s, c.y + 2 * c.s, 20 * c.s, 10 * c.s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---------- 게임 클래스 ----------

export class RunnerGame {
  constructor(canvas, { onUpdate = () => {} } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onUpdate = onUpdate
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)

    this.highScore = Number(localStorage.getItem('runner-highscore') || 0)
    this.state = 'ready' // 'ready' | 'running' | 'over'
    this.t = 0
    this.nowMs = 0
    this.lastMs = 0
    this.downHeld = false
    this.overAt = 0

    this._resize()
    this._initClouds()
    this._reset()

    this._onKeyDown = (e) => this._keyDown(e)
    this._onKeyUp = (e) => this._keyUp(e)
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    this._loop = this._loop.bind(this)
    this.raf = requestAnimationFrame(this._loop)
  }

  _resize() {
    this.canvas.width = W * this.dpr
    this.canvas.height = H * this.dpr
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  _initClouds() {
    this.clouds = []
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: 30 + Math.random() * 130,
        s: 0.6 + Math.random() * 1.1,
      })
    }
  }

  _resetPlayer() {
    this.player = {
      x: 90,
      y: GROUND - STAND_H,
      w: PLAYER_W,
      h: STAND_H,
      vy: 0,
      grounded: true,
      ducking: false,
    }
  }

  _reset() {
    this._resetPlayer()
    this.obstacles = []
    this.score = 0
    this.speed = TUNING.baseSpeed
    this.elapsed = 0
    this.spawnTimer = TUNING.firstSpawnDelay
    this.groundOffset = 0
  }

  start() {
    this._reset()
    this.state = 'running'
    this._emit()
  }

  pressJump() {
    if (this.state === 'ready') {
      this.start()
      return
    }
    if (this.state === 'over') {
      if (this.nowMs - this.overAt > 400) this.start()
      return
    }
    if (this.player.grounded) {
      this.player.vy = JUMP_V
      this.player.grounded = false
      this.player.ducking = false
      this.downHeld = false
    }
  }

  setDuck(v) {
    this.downHeld = v
  }

  _keyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault()
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.pressJump()
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.setDuck(true)
    }
  }

  _keyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.setDuck(false)
  }

  _emit() {
    this.onUpdate({
      state: this.state,
      score: Math.floor(this.score),
      highScore: this.highScore,
    })
  }

  _gameOver() {
    this.state = 'over'
    this.overAt = this.nowMs
    const s = Math.floor(this.score)
    if (s > this.highScore) {
      this.highScore = s
      localStorage.setItem('runner-highscore', String(s))
    }
    this._emit()
  }

  _spawn() {
    const pteroAllowed = this.elapsed > TUNING.pteroFirstAt
    let type
    const r = Math.random()
    if (!pteroAllowed || r > TUNING.pteroChance) {
      type = Math.random() < 0.6 ? 'cactus' : 'rock'
    } else {
      type = 'ptero'
    }

    if (type === 'ptero') {
      const high = Math.random() < TUNING.pteroHighChance
      if (high) {
        const bottom = GROUND - DUCK_H - 4
        this.obstacles.push({
          type: 'ptero',
          action: 'duck',
          x: W + 20,
          y: bottom - PTERO_H,
          w: PTERO_W,
          h: PTERO_H,
        })
      } else {
        this.obstacles.push({
          type: 'ptero',
          action: 'jump',
          x: W + 20,
          y: GROUND - PTERO_H,
          w: PTERO_W,
          h: PTERO_H,
        })
      }
    } else if (type === 'cactus') {
      const h = 46 + Math.random() * 28
      const w = 28 + Math.random() * 14
      this.obstacles.push({
        type: 'cactus',
        action: 'jump',
        x: W + 20,
        y: GROUND - h,
        w,
        h,
      })
    } else {
      const h = 34 + Math.random() * 20
      const w = 40 + Math.random() * 22
      this.obstacles.push({
        type: 'rock',
        action: 'jump',
        x: W + 20,
        y: GROUND - h,
        w,
        h,
      })
    }

    const minGap = TUNING.minGap
    const maxGap = TUNING.maxGap
    this.spawnTimer = (minGap + Math.random() * (maxGap - minGap)) / this.speed
  }

  _update(dt) {
    this.t += dt

    // 구름 (항상 흐름)
    const cloudSpeed = (this.state === 'running' ? this.speed : 60) * 0.22
    for (const c of this.clouds) {
      c.x -= cloudSpeed * dt
      if (c.x < -60) {
        c.x = W + 60
        c.y = 30 + Math.random() * 130
        c.s = 0.6 + Math.random() * 1.1
      }
    }

    if (this.state !== 'running') return

    this.elapsed += dt
    this.speed = Math.min(TUNING.maxSpeed, TUNING.baseSpeed + this.elapsed * TUNING.accel)
    this.score += this.speed * dt * 0.05
    this.groundOffset = (this.groundOffset + this.speed * dt) % 28

    const p = this.player
    p.ducking = this.downHeld

    // 수직 물리
    if (p.grounded) {
      p.h = p.ducking ? DUCK_H : STAND_H
      p.y = GROUND - p.h
    } else {
      p.h = STAND_H
      p.vy += GRAVITY * dt
      if (this.downHeld) p.vy += FAST_FALL * dt
      p.y += p.vy * dt
      if (p.y + p.h >= GROUND) {
        p.y = GROUND - p.h
        p.vy = 0
        p.grounded = true
      }
    }

    // 장애물 이동/제거
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i]
      o.x -= this.speed * dt
      if (o.x + o.w < -20) this.obstacles.splice(i, 1)
    }

    // 스폰
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) this._spawn()

    // 충돌
    const pad = 5
    const pb = { x: p.x, y: p.y, w: p.w, h: p.h }
    for (const o of this.obstacles) {
      if (
        pb.x + pad < o.x + o.w - pad &&
        pb.x + pb.w - pad > o.x + pad &&
        pb.y + pad < o.y + o.h - pad &&
        pb.y + pb.h - pad > o.y + pad
      ) {
        this._gameOver()
        return
      }
    }
  }

  _draw() {
    const ctx = this.ctx

    // 하늘
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0d1326')
    sky.addColorStop(0.7, '#1b2a4a')
    sky.addColorStop(1, '#2c3e5e')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // 구름
    for (const c of this.clouds) drawCloud(ctx, c)

    // 지면
    ctx.fillStyle = '#20293a'
    ctx.fillRect(0, GROUND, W, H - GROUND)
    ctx.fillStyle = '#5b6b8c'
    ctx.fillRect(0, GROUND, W, 2)

    // 지면의 작은 흔적 (스크롤)
    ctx.fillStyle = '#39445c'
    for (let x = -this.groundOffset; x < W; x += 28) {
      ctx.fillRect(x, GROUND + 10, 10, 2)
    }

    // 장애물
    for (const o of this.obstacles) drawObstacle(ctx, o, this.t)

    // 플레이어
    drawRunner(ctx, this.player, this.t)

    // HUD
    this._drawHUD(ctx)
  }

  _drawHUD(ctx) {
    ctx.save()
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.font = '700 26px system-ui, sans-serif'
    ctx.fillStyle = '#e5e7eb'
    ctx.fillText(String(Math.floor(this.score)).padStart(5, '0'), W - 16, 16)
    ctx.font = '600 15px system-ui, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText('최고 ' + String(this.highScore).padStart(5, '0'), W - 16, 48)

    // 익룡 등장 전 안내
    if (this.state === 'running' && this.elapsed < TUNING.pteroFirstAt) {
      ctx.textAlign = 'center'
      ctx.font = '600 15px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(229,231,235,0.55)'
      ctx.fillText('익룡이 곧 등장합니다! ↑ 점프 / ↓ 숙이기', W / 2, 16)
    }
    ctx.restore()
  }

  _loop(ms) {
    this.raf = requestAnimationFrame(this._loop)
    if (!this.lastMs) this.lastMs = ms
    let dtMs = ms - this.lastMs
    this.lastMs = ms
    this.nowMs = ms
    if (dtMs > 100) dtMs = 100
    this._update(dtMs / 1000)
    this._draw()
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }
}
