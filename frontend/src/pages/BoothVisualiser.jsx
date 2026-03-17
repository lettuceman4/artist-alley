import { useReducer, useEffect, useState, useRef } from 'react'
import { fetchBoothLayouts, saveBoothLayout, deleteBoothLayout } from '../api'
import { useEvent } from '../EventContext'
import './BoothVisualiser.css'

// ── Shape definitions ─────────────────────────────────────────────────────────
export const BASIC_SHAPES = [
  { type: 'rect',     label: 'Rectangle', color: '#6c3fc5', defaultWidth: 60, defaultHeight: 40 },
  { type: 'circle',   label: 'Circle',    color: '#27ae60', defaultWidth: 50, defaultHeight: 50 },
  { type: 'triangle', label: 'Triangle',  color: '#e67e22', defaultWidth: 60, defaultHeight: 50 },
  { type: 'line',     label: 'Line',      color: '#2980b9', defaultWidth: 80, defaultHeight: 8  },
]
export const FIXTURE_TYPES = BASIC_SHAPES // backward compat

// ── State ─────────────────────────────────────────────────────────────────────
export const DEFAULT_TABLE = { width: 180, depth: 60, height: 75, unit: 'cm' }
export const DEFAULT_STATE = { table: DEFAULT_TABLE, view: 'top', fixtures: [] }
export const ACTION_TYPES = {
  SET_TABLE_DIM: 'SET_TABLE_DIM', SET_UNIT: 'SET_UNIT', SET_VIEW: 'SET_VIEW',
  ADD_FIXTURE: 'ADD_FIXTURE', MOVE_FIXTURE: 'MOVE_FIXTURE', RESIZE_FIXTURE: 'RESIZE_FIXTURE',
  DELETE_FIXTURE: 'DELETE_FIXTURE', CLEAR_LAYOUT: 'CLEAR_LAYOUT', LOAD_LAYOUT: 'LOAD_LAYOUT',
}

const CM_TO_IN = 1 / 2.54, IN_TO_CM = 2.54
function convertDim(v, from, to) {
  if (from === to) return v
  return Math.round(v * (from === 'cm' ? CM_TO_IN : IN_TO_CM) * 100) / 100
}

export function layoutReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_TABLE_DIM:
      return { ...state, table: { ...state.table, [action.field]: action.value } }
    case ACTION_TYPES.SET_UNIT: {
      const { unit: from } = state.table, to = action.unit
      return { ...state, table: { width: convertDim(state.table.width, from, to), depth: convertDim(state.table.depth, from, to), height: convertDim(state.table.height, from, to), unit: to } }
    }
    case ACTION_TYPES.SET_VIEW: return { ...state, view: action.view }
    case ACTION_TYPES.ADD_FIXTURE: return { ...state, fixtures: [...state.fixtures, action.fixture] }
    case ACTION_TYPES.MOVE_FIXTURE:
      return { ...state, fixtures: state.fixtures.map(f => f.id === action.id ? { ...f, x: action.x, y: action.y } : f) }
    case ACTION_TYPES.RESIZE_FIXTURE:
      return { ...state, fixtures: state.fixtures.map(f => f.id === action.id ? { ...f, width: Math.max(1, action.width), height: Math.max(1, action.height) } : f) }
    case ACTION_TYPES.DELETE_FIXTURE:
      return { ...state, fixtures: state.fixtures.filter(f => f.id !== action.id) }
    case ACTION_TYPES.CLEAR_LAYOUT: return DEFAULT_STATE
    case ACTION_TYPES.LOAD_LAYOUT: return { ...state, ...action.layout }
    default: return state
  }
}

export function isValidLayout(p) {
  if (!p || typeof p !== 'object') return false
  const { table } = p
  if (!table || typeof table.width !== 'number' || table.width <= 0) return false
  if (typeof table.depth !== 'number' || table.depth <= 0) return false
  if (typeof table.height !== 'number' || table.height <= 0) return false
  if (table.unit !== 'cm' && table.unit !== 'in') return false
  if (p.view !== 'top' && p.view !== 'front') return false
  if (!Array.isArray(p.fixtures)) return false
  for (const f of p.fixtures) {
    if (typeof f.id !== 'string' || typeof f.type !== 'string') return false
    if (typeof f.x !== 'number' || typeof f.y !== 'number') return false
    if (typeof f.width !== 'number' || f.width <= 0 || typeof f.height !== 'number' || f.height <= 0) return false
  }
  return true
}

// ── DimensionPanel ────────────────────────────────────────────────────────────
export function DimensionPanel({ table, onTableChange, onUnitChange }) {
  const [errs, setErrs] = useState({})
  function handleChange(field, raw) {
    const v = parseFloat(raw)
    if (!raw || isNaN(v) || v <= 0) setErrs(e => ({ ...e, [field]: 'Must be > 0' }))
    else { setErrs(e => { const n = { ...e }; delete n[field]; return n }); onTableChange(field, v) }
  }
  return (
    <div className="dim-panel">
      {['width', 'depth', 'height'].map(f => (
        <div key={f} className="dim-field">
          <label>{f.charAt(0).toUpperCase() + f.slice(1)} ({table.unit})</label>
          <input type="number" value={table[f]} onChange={e => handleChange(f, e.target.value)} />
          {errs[f] && <span className="dim-error">{errs[f]}</span>}
        </div>
      ))}
      <div className="dim-unit-group">
        <span>Unit</span>
        <div className="dim-unit-btns">
          <button className={`dim-unit-btn${table.unit === 'cm' ? ' active' : ''}`} onClick={() => onUnitChange('cm')}>cm</button>
          <button className={`dim-unit-btn${table.unit === 'in' ? ' active' : ''}`} onClick={() => onUnitChange('in')}>in</button>
        </div>
      </div>
    </div>
  )
}

// ── ViewToggle ────────────────────────────────────────────────────────────────
export function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      <button className={`view-toggle-btn${view === 'top' ? ' active' : ''}`} onClick={() => onChange('top')}>Top View</button>
      <button className={`view-toggle-btn${view === 'front' ? ' active' : ''}`} onClick={() => onChange('front')}>Front View</button>
    </div>
  )
}

export const MARGIN_FACTOR = 0.85
export function calcScaleFactor(rw, rh, pw, ph) {
  return Math.min(pw / rw, ph / rh) * MARGIN_FACTOR
}

// ── FixtureRect — renders any shape ──────────────────────────────────────────
export function FixtureRect({ fixture, scaleFactor, canvasRealW, canvasRealH, isSelected, color, unit, onPointerDown, onResize, onDelete, onSelect, opacity = 0.85 }) {
  const x = fixture.x * scaleFactor, y = fixture.y * scaleFactor
  const w = fixture.width * scaleFactor, h = fixture.height * scaleFactor
  const HS = 10, DR = 9

  function handleResizePointerDown(e) {
    e.stopPropagation()
    const sx = e.clientX, sy = e.clientY, sw = fixture.width, sh = fixture.height
    e.currentTarget.setPointerCapture(e.pointerId)
    function onMove(ev) {
      const maxW = (canvasRealW ?? Infinity) - fixture.x, maxH = (canvasRealH ?? Infinity) - fixture.y
      onResize && onResize(fixture.id, Math.min(maxW, Math.max(1, sw + (ev.clientX - sx) / scaleFactor)), Math.min(maxH, Math.max(1, sh + (ev.clientY - sy) / scaleFactor)))
    }
    function onUp() { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
  }

  function handleDeletePointerDown(e) { e.stopPropagation(); e.preventDefault(); onDelete && onDelete(fixture.id) }

  const bodyProps = { fill: color, opacity, stroke: isSelected ? '#fff' : 'rgba(0,0,0,0.18)', strokeWidth: isSelected ? 2 : 1, style: { cursor: 'grab' }, onPointerDown: e => onPointerDown && onPointerDown(e, fixture), onClick: () => onSelect && onSelect(fixture.id) }

  function renderBody() {
    if (fixture.type === 'circle') return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...bodyProps} />
    if (fixture.type === 'triangle') return <polygon points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`} {...bodyProps} />
    return <rect x={x} y={y} width={w} height={h} rx={fixture.type === 'line' ? 3 : 5} {...bodyProps} />
  }

  return (
    <g>
      {renderBody()}
      {fixture.label && (
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={Math.min(13, w / Math.max(1, fixture.label.length * 0.65))} fill="#fff" fontWeight="600" style={{ pointerEvents: 'none', userSelect: 'none' }}>{fixture.label}</text>
      )}
      {isSelected && (<>
        <text x={x + w / 2} y={y + 11} textAnchor="middle" fontSize={10} fill="#fff" style={{ pointerEvents: 'none', userSelect: 'none' }}>{Math.round(fixture.width * 10) / 10} × {Math.round(fixture.height * 10) / 10} {unit}</text>
        <rect x={x + w - HS - 1} y={y + h - HS - 1} width={HS} height={HS} fill="#fff" stroke="#6c3fc5" strokeWidth={1.5} rx={2} style={{ cursor: 'se-resize' }} onPointerDown={handleResizePointerDown} />
        <circle cx={x + w - DR - 1} cy={y + DR + 1} r={DR} fill="#e74c3c" style={{ cursor: 'pointer' }} onPointerDown={handleDeletePointerDown} />
        <text x={x + w - DR - 1} y={y + DR + 5} textAnchor="middle" fontSize={12} fill="#fff" fontWeight="bold" style={{ cursor: 'pointer', pointerEvents: 'none', userSelect: 'none' }}>×</text>
      </>)}
    </g>
  )
}

// ── BoothCanvas ───────────────────────────────────────────────────────────────
export function BoothCanvas({ table, view, fixtures, selectedId, onFixtureDrop, onFixtureMove, onFixtureResize, onFixtureSelect, onFixtureDelete, dragState, onDragStateChange }) {
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 })
  const [ghostPos, setGhostPos] = useState(null)
  const wrapperRef = useRef(null), svgRef = useRef(null)

  useEffect(() => {
    const el = wrapperRef.current; if (!el) return
    const obs = new ResizeObserver(entries => { for (const e of entries) setCanvasSize({ width: e.contentRect.width, height: e.contentRect.height }) })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  const tableRealW = table.width, tableRealH = view === 'top' ? table.depth : table.height
  const scaleFactor = calcScaleFactor(tableRealW, tableRealH, canvasSize.width, canvasSize.height)
  const tablePixelW = tableRealW * scaleFactor, tablePixelH = tableRealH * scaleFactor
  const tableOriginX = (canvasSize.width - tablePixelW) / 2, tableOriginY = (canvasSize.height - tablePixelH) / 2
  const canvasRealW = canvasSize.width / scaleFactor, canvasRealH = canvasSize.height / scaleFactor

  function getSvgCoords(e) {
    const r = svgRef.current.getBoundingClientRect()
    return { pointerSvgX: (e.clientX - r.left) * (canvasSize.width / r.width), pointerSvgY: (e.clientY - r.top) * (canvasSize.height / r.height) }
  }
  function isWithinBounds(e) { const r = svgRef.current.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }
  function clamp(x, y, fw, fh) { return { x: Math.max(0, Math.min(x, canvasRealW - fw)), y: Math.max(0, Math.min(y, canvasRealH - fh)) } }
  function getDefaults(type) { const b = BASIC_SHAPES.find(s => s.type === type); return { w: b?.defaultWidth ?? 60, h: b?.defaultHeight ?? 40 } }

  function handleSvgPointerDown(e) { if (dragState?.source !== 'palette') onFixtureSelect && onFixtureSelect(null); e.currentTarget.setPointerCapture(e.pointerId) }

  function handleSvgPointerMove(e) {
    if (!dragState) return
    const { pointerSvgX: px, pointerSvgY: py } = getSvgCoords(e)
    if (dragState.source === 'palette') {
      const { w, h } = getDefaults(dragState.type)
      const { x, y } = clamp(px / scaleFactor, py / scaleFactor, w, h)
      setGhostPos({ type: dragState.type, x: x * scaleFactor, y: y * scaleFactor, width: w * scaleFactor, height: h * scaleFactor, color: dragState.color || '#6c3fc5' })
    } else if (dragState.source === 'canvas') {
      const f = fixtures.find(f => f.id === dragState.fixtureId); if (!f) return
      const { x, y } = clamp((px - dragState.offsetX) / scaleFactor, (py - dragState.offsetY) / scaleFactor, f.width, f.height)
      setGhostPos({ type: f.type, x: x * scaleFactor, y: y * scaleFactor, width: f.width * scaleFactor, height: f.height * scaleFactor, color: f.color || '#6c3fc5' })
    }
  }

  function handleSvgPointerUp(e) {
    if (!dragState) return
    if (!isWithinBounds(e)) { onDragStateChange && onDragStateChange(null); setGhostPos(null); return }
    const { pointerSvgX: px, pointerSvgY: py } = getSvgCoords(e)
    if (dragState.source === 'palette') {
      const { w, h } = getDefaults(dragState.type)
      const { x, y } = clamp(px / scaleFactor, py / scaleFactor, w, h)
      onFixtureDrop && onFixtureDrop(dragState.type, x, y, dragState.label, dragState.color)
    } else if (dragState.source === 'canvas') {
      const f = fixtures.find(f => f.id === dragState.fixtureId)
      if (f) { const { x, y } = clamp((px - dragState.offsetX) / scaleFactor, (py - dragState.offsetY) / scaleFactor, f.width, f.height); onFixtureMove && onFixtureMove(dragState.fixtureId, x, y) }
    }
    onDragStateChange && onDragStateChange(null); setGhostPos(null)
  }

  function handleFixturePointerDown(e, fixture) {
    e.stopPropagation()
    const { pointerSvgX: px, pointerSvgY: py } = getSvgCoords(e)
    onDragStateChange && onDragStateChange({ fixtureId: fixture.id, source: 'canvas', offsetX: px - fixture.x * scaleFactor, offsetY: py - fixture.y * scaleFactor })
    onFixtureSelect && onFixtureSelect(fixture.id)
    e.currentTarget.closest('svg')?.setPointerCapture(e.pointerId)
  }

  return (
    <div ref={wrapperRef} className="booth-canvas-container">
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`} onPointerDown={handleSvgPointerDown} onPointerMove={handleSvgPointerMove} onPointerUp={handleSvgPointerUp} style={{ cursor: dragState ? 'grabbing' : 'default' }}>
        <rect x={0} y={0} width={canvasSize.width} height={canvasSize.height} fill="#f8f8f8" stroke="#ccc" strokeWidth={1.5} strokeDasharray="6 3" />
        <text x={8} y={16} fontSize={10} fill="#bbb" style={{ pointerEvents: 'none', userSelect: 'none' }}>Workable area</text>
        <rect x={tableOriginX} y={tableOriginY} width={tablePixelW} height={tablePixelH} fill={dragState?.source === 'palette' ? '#ede7ff' : '#f5f0ff'} stroke="#6c3fc5" strokeWidth={2} />
        <text x={tableOriginX + tablePixelW / 2} y={tableOriginY + tablePixelH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#9b7fd4" style={{ pointerEvents: 'none', userSelect: 'none' }}>Table</text>
        {fixtures.map(f => (
          <FixtureRect key={f.id} fixture={f} scaleFactor={scaleFactor} canvasRealW={canvasRealW} canvasRealH={canvasRealH} isSelected={f.id === selectedId} color={f.color || '#6c3fc5'} unit={table.unit} onPointerDown={handleFixturePointerDown} onResize={onFixtureResize} onDelete={onFixtureDelete} onSelect={onFixtureSelect} opacity={dragState?.source === 'canvas' && dragState.fixtureId === f.id ? 0.25 : 0.85} />
        ))}
        {ghostPos && (() => {
          const { type, x, y, width: w, height: h, color } = ghostPos
          const ghostProps = { fill: color, opacity: 0.45, stroke: '#fff', strokeWidth: 2, strokeDasharray: '4 2', style: { pointerEvents: 'none' } }
          if (type === 'circle') return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...ghostProps} />
          if (type === 'triangle') return <polygon points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`} {...ghostProps} />
          return <rect x={x} y={y} width={w} height={h} rx={type === 'line' ? 3 : 5} {...ghostProps} />
        })()}
      </svg>
    </div>
  )
}

// ── FixturePalette — shapes + custom builder ──────────────────────────────────
export function FixturePalette({ onDragStart }) {
  const [customLabel, setCustomLabel] = useState('')
  const [customColor, setCustomColor] = useState('#e74c3c')
  const [customShape, setCustomShape] = useState('rect')
  const ICONS = { rect: '▬', circle: '●', triangle: '▲', line: '━' }
  return (
    <div className="palette">
      <div className="palette-section-label">Basic Shapes</div>
      {BASIC_SHAPES.map(s => (
        <div key={s.type} onPointerDown={() => onDragStart(s.type, s.label, s.color)}
          className="palette-shape-item" style={{ background: s.color }}>
          <span className="palette-shape-icon">{ICONS[s.type]}</span>{s.label}
        </div>
      ))}
      <div className="palette-section-label mt">Custom Shape</div>
      <div className="custom-builder">
        <input type="text" value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Label (optional)" />
        <div className="custom-builder-shapes">
          {['rect', 'circle', 'triangle'].map(s => (
            <button key={s} onClick={() => setCustomShape(s)} title={s}
              className={`custom-shape-btn${customShape === s ? ' active' : ''}`}>
              {ICONS[s]}
            </button>
          ))}
        </div>
        <div className="custom-color-row">
          <label>Color</label>
          <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} />
        </div>
        <div onPointerDown={() => onDragStart(customShape, customLabel || 'Custom', customColor)}
          className="custom-add-btn" style={{ background: customColor }}>
          + Add Shape
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const LS_KEY = 'booth-visualiser-layout'

function BoothVisualiser() {
  const [state, dispatch] = useReducer(layoutReducer, DEFAULT_STATE)
  const [selectedId, setSelectedId] = useState(null)
  const [dragState, setDragState] = useState(null)
  const { activeEventId } = useEvent()
  const [savedLayouts, setSavedLayouts] = useState([])
  const [saveName, setSaveName] = useState('')
  const [saveStatus, setSaveStatus] = useState('')

  const loadLayouts = () => fetchBoothLayouts(activeEventId).then(setSavedLayouts).catch(console.error)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) { const p = JSON.parse(raw); if (isValidLayout(p)) dispatch({ type: ACTION_TYPES.LOAD_LAYOUT, layout: p }); else localStorage.removeItem(LS_KEY) }
    } catch { localStorage.removeItem(LS_KEY) }
  }, [])

  useEffect(() => { loadLayouts() }, [activeEventId])
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch { /* ignore */ } }, [state])

  function handleFixtureDrop(type, x, y, label, color) {
    const id = crypto.randomUUID?.() ?? String(Date.now())
    const base = BASIC_SHAPES.find(s => s.type === type)
    dispatch({ type: ACTION_TYPES.ADD_FIXTURE, fixture: { id, type, x, y, width: base?.defaultWidth ?? 60, height: base?.defaultHeight ?? 40, label: label || '', color: color || base?.color || '#6c3fc5' } })
  }

  async function handleSave() {
    if (!saveName.trim()) { setSaveStatus('Enter a name first.'); return }
    try {
      await saveBoothLayout(saveName.trim(), JSON.stringify(state), activeEventId)
      setSaveName(''); setSaveStatus('✓ Saved'); loadLayouts()
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (e) { setSaveStatus('✗ ' + e.message) }
  }

  function handleLoadLayout(layout) {
    try { const p = JSON.parse(layout.layoutJson); if (isValidLayout(p)) { dispatch({ type: ACTION_TYPES.LOAD_LAYOUT, layout: p }); setSelectedId(null) } } catch { /* ignore */ }
  }

  return (
    <div className="booth-visualiser">
      <DimensionPanel table={state.table} onTableChange={(f, v) => dispatch({ type: ACTION_TYPES.SET_TABLE_DIM, field: f, value: v })} onUnitChange={u => dispatch({ type: ACTION_TYPES.SET_UNIT, unit: u })} />
      <div className="booth-toolbar">
        <ViewToggle view={state.view} onChange={v => dispatch({ type: ACTION_TYPES.SET_VIEW, view: v })} />
        <div className="booth-save-group">
          <input className="booth-save-input" value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Layout name…" />
          <button onClick={handleSave} className="booth-save-btn">💾 Save</button>
          {saveStatus && <span className={`booth-save-status ${saveStatus.startsWith('✓') ? 'success' : 'error'}`}>{saveStatus}</span>}
        </div>
        <button onClick={() => { dispatch({ type: ACTION_TYPES.CLEAR_LAYOUT }); localStorage.removeItem(LS_KEY); setSelectedId(null); setDragState(null) }} className="booth-clear-btn">Clear Layout</button>
      </div>
      {savedLayouts.length > 0 && (
        <div className="booth-saved-bar">
          <span className="booth-saved-label">Saved:</span>
          {savedLayouts.map(l => (
            <div key={l.id} className="booth-layout-chip">
              <button onClick={() => handleLoadLayout(l)} title={`Saved: ${new Date(l.savedAt).toLocaleString()}`} className="booth-layout-chip-load">{l.name}</button>
              <button onClick={async () => { const { deleteBoothLayout: del } = await import('../api'); await del(l.id); loadLayouts() }} title="Delete" className="booth-layout-chip-delete">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="booth-main-row">
        <div className="booth-canvas-wrap">
          <BoothCanvas table={state.table} view={state.view} fixtures={state.fixtures} selectedId={selectedId}
            onFixtureDrop={handleFixtureDrop}
            onFixtureMove={(id, x, y) => dispatch({ type: ACTION_TYPES.MOVE_FIXTURE, id, x, y })}
            onFixtureResize={(id, w, h) => dispatch({ type: ACTION_TYPES.RESIZE_FIXTURE, id, width: w, height: h })}
            onFixtureSelect={setSelectedId}
            onFixtureDelete={id => { dispatch({ type: ACTION_TYPES.DELETE_FIXTURE, id }); setSelectedId(null) }}
            dragState={dragState} onDragStateChange={setDragState} />
        </div>
        <FixturePalette onDragStart={(type, label, color) => setDragState({ type, source: 'palette', label, color })} />
      </div>
    </div>
  )
}

export default BoothVisualiser
