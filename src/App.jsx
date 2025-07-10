import { useState, useRef, useEffect } from 'react'
import p5 from 'p5'
import './App.css'

function App() {
  // Estados principales
  const [dibujos, setDibujos] = useState([])
  const [dibujando, setDibujando] = useState(false)
  const [canvasListo, setCanvasListo] = useState(false)
  
  // Estados para herramientas de dibujo
  const [colorUsuario, setColorUsuario] = useState('#FF6B6B')
  const [grosorTrazo, setGrosorTrazo] = useState(3)
  
  // Función para cambiar el grosor del trazo de forma segura
  const cambiarGrosorTrazo = (nuevoValor) => {
    try {
      const nuevoGrosor = parseInt(nuevoValor)
      if (!isNaN(nuevoGrosor) && nuevoGrosor >= 1 && nuevoGrosor <= 20) {
        setGrosorTrazo(nuevoGrosor)
      }
    } catch (error) {
      console.error("Error al cambiar el grosor:", error)
    }
  }
  
  // Colores predefinidos para selección rápida
  const coloresPredefinidos = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#FD79A8', '#FDCB6E', '#6C5CE7',
    '#A29BFE', '#FF7675', '#74B9FF', '#00B894',
    '#000000', '#FFFFFF', '#808080', '#FF0000'
  ]
  
  // Referencias para p5.js
  const canvasRef = useRef(null)
  const p5Instance = useRef(null)
  const estadoRef = useRef({
    dibujos,
    dibujando,
    colorUsuario,
    grosorTrazo
  })
  
  // Actualizar la referencia cuando cambien los estados
  useEffect(() => {
    estadoRef.current = {
      dibujos,
      dibujando,
      colorUsuario,
      grosorTrazo
    }
  }, [dibujos, dibujando, colorUsuario, grosorTrazo])
  
  // Efecto para configurar p5.js
  useEffect(() => {
    const sketch = (p) => {
      p.setup = () => {
        const canvas = p.createCanvas(800, 600)
        canvas.parent('canvas-container')
        p.background(255)
        p.strokeWeight(3)
        setCanvasListo(true)
      }
      
      p.draw = () => {
        p.background(255)
        
        // Dibujar todos los trazos guardados
        estadoRef.current.dibujos.forEach(trazo => {
          if (trazo.puntos && trazo.puntos.length > 0) {
            p.stroke(trazo.color)
            p.strokeWeight(trazo.grosor)
            
            // Si solo hay un punto, dibujar un círculo
            if (trazo.puntos.length === 1) {
              p.fill(trazo.color)
              p.noStroke()
              p.ellipse(trazo.puntos[0].x, trazo.puntos[0].y, trazo.grosor, trazo.grosor)
            } else {
              // Si hay más de un punto, dibujar líneas conectadas
              p.noFill()
              for (let i = 1; i < trazo.puntos.length; i++) {
                const puntoAnterior = trazo.puntos[i-1]
                const puntoActual = trazo.puntos[i]
                
                if (puntoAnterior && puntoActual && 
                    typeof puntoAnterior.x === 'number' && typeof puntoAnterior.y === 'number' &&
                    typeof puntoActual.x === 'number' && typeof puntoActual.y === 'number') {
                  p.line(puntoAnterior.x, puntoAnterior.y, puntoActual.x, puntoActual.y)
                }
              }
            }
          }
        })
      }
      
      p.mousePressed = () => {
        const x = p.mouseX
        const y = p.mouseY
        
        // Verificar que el mouse esté dentro del canvas
        if (x >= 0 && x <= p.width && y >= 0 && y <= p.height) {
          setDibujando(true)
          const nuevoTrazo = {
            id: Date.now() + Math.random(),
            color: estadoRef.current.colorUsuario,
            grosor: estadoRef.current.grosorTrazo,
            puntos: [{ x: Math.round(x), y: Math.round(y) }]
          }
          setDibujos(prev => [...prev, nuevoTrazo])
        }
        return false
      }
      
      p.mouseDragged = () => {
        const x = p.mouseX
        const y = p.mouseY
        
        if (estadoRef.current.dibujando && x >= 0 && x <= p.width && y >= 0 && y <= p.height) {
          setDibujos(prev => {
            const nuevos = [...prev]
            if (nuevos.length > 0) {
              const nuevoPunto = { x: Math.round(x), y: Math.round(y) }
              nuevos[nuevos.length - 1].puntos.push(nuevoPunto)
            }
            return nuevos
          })
        }
        return false
      }
      
      p.mouseReleased = () => {
        setDibujando(false)
      }
    }
    
    // Solo crear la instancia una vez
    if (!p5Instance.current) {
      p5Instance.current = new p5(sketch)
    }
    
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [])
  
  // Función para limpiar el tablero
  const limpiarTablero = () => {
    setDibujos([])
    if (p5Instance.current) {
      p5Instance.current.background(255)
    }
  }
  
  // Función para deshacer último trazo
  const deshacerTrazo = () => {
    if (dibujos.length > 0) {
      setDibujos(prev => prev.slice(0, -1))
    }
  }
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎨 Tablero de Dibujo Simple</h1>
        <p>Dibuja, crea y expresa tu creatividad</p>
      </header>
      
      <div className="controles">
        <div className="herramientas-dibujo">
          {/* Selector de colores */}
          <div className="selector-colores">
            <label>Color:</label>
            <div className="paleta-colores">
              {coloresPredefinidos.map((color, index) => (
                <button
                  key={index}
                  className={`color-btn ${colorUsuario === color ? 'activo' : ''}`}
                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '2px solid #ccc' : 'none' }}
                  onClick={() => setColorUsuario(color)}
                  title={`Color ${index + 1}`}
                />
              ))}
              {/* Selector de color personalizado */}
              <input
                type="color"
                value={colorUsuario}
                onChange={(e) => setColorUsuario(e.target.value)}
                className="color-picker"
                title="Color personalizado"
              />
            </div>
          </div>
          
          {/* Selector de grosor */}
          <div className="selector-grosor">
            <label>Grosor: {grosorTrazo}px</label>
            <div className="grosor-controles">
              <button 
                className="btn-grosor"
                onClick={() => cambiarGrosorTrazo(grosorTrazo - 1)}
                disabled={grosorTrazo <= 1}
              >
                -
              </button>
              <input
                type="range"
                min="1"
                max="20"
                value={grosorTrazo}
                onChange={(e) => cambiarGrosorTrazo(e.target.value)}
                className="grosor-slider"
              />
              <button 
                className="btn-grosor"
                onClick={() => cambiarGrosorTrazo(grosorTrazo + 1)}
                disabled={grosorTrazo >= 20}
              >
                +
              </button>
            </div>
            <div className="preview-grosor">
              <div 
                style={{
                  width: `${Math.max(grosorTrazo * 2, 10)}px`,
                  height: `${Math.max(grosorTrazo * 2, 10)}px`,
                  backgroundColor: colorUsuario,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: colorUsuario === '#FFFFFF' ? '1px solid #ccc' : 'none'
                }}
              >
                <span style={{ 
                  fontSize: '9px', 
                  color: grosorTrazo > 6 ? 'white' : 'black', 
                  fontWeight: 'bold' 
                }}>{grosorTrazo}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="botones-accion">
          <button 
            className="btn btn-deshacer"
            onClick={deshacerTrazo}
            disabled={dibujos.length === 0}
          >
            ↶ Deshacer
          </button>
          <button 
            className="btn btn-limpiar"
            onClick={limpiarTablero}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>
      
      <div className="canvas-wrapper">
        <div id="canvas-container" ref={canvasRef}></div>
        {!canvasListo && (
          <div className="loading">
            <p>Cargando tablero...</p>
          </div>
        )}
      </div>
      
      <div className="stats">
        <p>Trazos dibujados: {dibujos.length}</p>
      </div>
      
      <footer className="app-footer">
        <p>Haz clic y arrastra para dibujar. Tu trabajo se guarda automáticamente.</p>
      </footer>
    </div>
  )
}

export default App
