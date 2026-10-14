import { useEffect, useRef, useState } from 'react'
import { RunnerGame } from './game.js'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [ui, setUi] = useState({ state: 'ready', score: 0, highScore: 0 })

  useEffect(() => {
    const game = new RunnerGame(canvasRef.current, {
      onUpdate: setUi,
    })
    gameRef.current = game
    return () => game.destroy()
  }, [])

  const start = () => gameRef.current?.start()

  return (
    <div className="game">
      <canvas ref={canvasRef} className="game-canvas" />

      {ui.state === 'ready' && (
        <div className="overlay">
          <h1>쿠키 러너</h1>
          <div className="controls">
            <p>
              <kbd>↑</kbd> / <kbd>Space</kbd> 점프
            </p>
            <p>
              <kbd>↓</kbd> 숙이기
            </p>
          </div>
          <p className="sub">장애물을 피해 달리세요. 익룡이 나타나면 화살표를 따라 행동하세요!</p>
          <button type="button" className="start-btn" onClick={start}>
            시작
          </button>
          <p className="hint">스페이스바 또는 위 화살표로 시작</p>
        </div>
      )}

      {ui.state === 'over' && (
        <div className="overlay">
          <h2>게임 오버</h2>
          <div className="score-box">
            <div>
              <span className="label">점수</span>
              <span className="value">{ui.score}</span>
            </div>
            <div>
              <span className="label">최고 기록</span>
              <span className="value">{ui.highScore}</span>
            </div>
          </div>
          <button type="button" className="start-btn" onClick={start}>
            다시 시작
          </button>
          <p className="hint">스페이스바로 다시 시작</p>
        </div>
      )}

      <div className="touch-controls">
        <button
          type="button"
          className="ctl duck-btn"
          onPointerDown={() => gameRef.current?.setDuck(true)}
          onPointerUp={() => gameRef.current?.setDuck(false)}
          onPointerLeave={() => gameRef.current?.setDuck(false)}
        >
          ↓ 숙이기
        </button>
        <button
          type="button"
          className="ctl jump-btn"
          onPointerDown={() => gameRef.current?.pressJump()}
        >
          ↑ 점프
        </button>
      </div>
    </div>
  )
}

export default App
