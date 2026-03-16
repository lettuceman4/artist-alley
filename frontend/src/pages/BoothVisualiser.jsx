import { useReducer, useEffect, useState, useRef } from 'react'

// ─── Task 1.1: Fixture type definitions ───────────────────────────────────────

export const FIXTURE_TYPES = [
  { type: 'rack',  label: 'Rack',  color: '#6c3fc5', defaultWidth: 30,  defaultHeight: 150 },
  { type: 'box',   label: 'Box',   color: '#27ae60', defaultWidth: 40,  defaultHeight: 30  },
  { type: 'stand', label: 'Stand', color: '#e67e22', defaultWidth: 20,  defaultHeight: 80  },
]

// ─── Task 1.2: Default state and action types ──────────────────────────────────

export const DEFAULT_TABLE = { width: 180, depth: 60, height: 75, unit: 'cm' }
export const DEFAULT_STATE = { table: DEFAULT_TABLE, view: 'top', fixtures: [] }

export const ACTION_TYPES = {
  SET_TABLE_DIM:  'SET_TABLE_DIM',
  SET_UNIT:       'SET_UNIT',
  SET_VIEW:       'SET_VIEW',
  ADD_FIXTURE:    'ADD_FIXTURE',
  MOVE_FIXTURE:   'MOVE_FIXTURE',
  RESIZE_FIXTURE: 'RESIZE_FIXTURE',
  DELETE_FIXTURE: 'DELETE_FIXTURE',
  CLEAR_LAYOUT:   'CLEAR_LAYOUT',
  LOAD_LAYOUT:    'LOAD_LAYOUT',
}

// ─── Task 1.3: Reducer ─────────────────────────────────────────────────────────

const CM_TO_IN = 1 / 2.54
const IN_TO_CM = 2.54

function convertDim(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value
  const factor = fromUnit === 'cm' ? CM_TO_IN : IN_TO_CM
  return Math.round(value * factor * 100) / 100
}

export function layoutReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_TABLE_DIM:
      return { ...state, table: { ...state.table, [action.field]: action.value } }

    case ACTION_TYPES.SET_UNIT: {
      const from = state.table.unit
      const to = action.unit
      return {
        ...state,
        table: {
          width:  convertDim(state.table.width,  from, to),
          depth:  convertDim(state.table.depth,  from, to),
          height: convertDim(state.table.height, from, to),
          unit: to,
        },
      }
    }

    case ACTION_TYPES.SET_VIEW:
      return { ...state, view: action.view }

    case ACTION_TYPES.ADD_FIXTURE:
      return { ...state, fixtures: [...state.fixtures, action.fixture] }

    case ACTION_TYPES.MOVE_FIXTURE:
      return {
        ...state,
        fixtures: state.fixtures.map(f =>
          f.id === action.id ? { ...f, x: action.x, y: action.y } : f
        ),
      }

    case ACTION_TYPES.RESIZE_FIXTURE:
      return {
        ...state,
        fixtures: state.fixtures.map(f =>
          f.id === action.id
            ? { ...f, width: Math.max(1, action.width), height: Math.max(1, action.height) }
            : f
        ),
      }

    case ACTION_TYPES.DELETE_FIXTURE:
      return { ...state, fixtures: state.fixtures.filter(f => f.id !== action.id) }

    case ACTION_TYPES.CLEAR_LAYOUT:
      return DEFAULT_STATE

    case ACTION_TYPES.LOAD_LAYOUT:
      return { ...state, ...action.layout }

    default:
      return state
  }
}

// ─── Task 2.1: Layout validation ──────────────────────────────────────────────

export function isValidLayout(parsed) {
  if (parsed === null || typeof parsed !== 'object') return false

  // Validate table
  const { table } = parsed
  if (table === null || typeof table !== 'object') return false
  if (typeof table.width !== 'number' || table.width <= 0) return false
  if (typeof table.depth !== 'number' || table.depth <= 0) return false
  if (typeof table.height !== 'number' || table.height <= 0) return false
  if (table.unit !== 'cm' && table.unit !== 'in') return false

  // Validate view
  if (parsed.view !== 'top' && parsed.view !== 'front') return false

  // Validate fixtures
  if (!Array.isArray(parsed.fixtures)) return false
  for (const f of parsed.fixtures) {
    if (typeof f.id !== 'string') return false
    if (typeof f.type !== 'string') return false
    if (typeof f.x !== 'number') return false
    if (typeof f.y !== 'number') return false
    if (typeof f.width !== 'number' || f.width <= 0) return false
    if (typeof f.height !== 'number' || f.height <= 0) return false
  }

  return true
}

// ─── Task 3.1 + 3.2: DimensionPanel component ─────────────────────────────────

export function DimensionPanel({ table, onTableChange, onUnitChange, errors: externalErrors = {} }) {
  const [localErrors, setLocalErrors] = useState({})

  const errors = { ...externalErrors, ...localErrors }

  function handleChange(field, rawValue) {
    const parsed = parseFloat(rawValue)
    if (rawValue === '' || isNaN(parsed) || parsed <= 0) {
      setLocalErrors(prev => ({ ...prev, [field]: 'Must be a number greater than 0' }))
    } else {
      setLocalErrors(prev => { const next = { ...prev }; delete next[field]; return next })
      onTableChange(field, parsed)
    }
  }

  const inputStyle = {
    width: '80px',
    padding: '4px 6px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  }

  const errorStyle = {
    color: '#c0392b',
    fontSize: '12px',
    marginTop: '2px',
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
  }

  const unitBtnStyle = (active) => ({
    padding: '4px 12px',
    border: '1px solid #6c3fc5',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    background: active ? '#6c3fc5' : '#fff',
    color: active ? '#fff' : '#6c3fc5',
    fontWeight: active ? '600' : '400',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', padding: '12px 0' }}>
      {['width', 'depth', 'height'].map(field => (
        <div key={field} style={fieldStyle}>
          <label style={labelStyle}>
            {field.charAt(0).toUpperCase() + field.slice(1)} ({table.unit})
          </label>
          <input
            type="number"
            value={table[field]}
            onChange={e => handleChange(field, e.target.value)}
            style={inputStyle}
            aria-label={`Table ${field} in ${table.unit}`}
          />
          {errors[field] && <span style={errorStyle}>{errors[field]}</span>}
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={labelStyle}>Unit</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={unitBtnStyle(table.unit === 'cm')} onClick={() => onUnitChange('cm')}>cm</button>
          <button style={unitBtnStyle(table.unit === 'in')} onClick={() => onUnitChange('in')}>in</button>
        </div>
      </div>
    </div>
  )
}

// ─── Task 4.1: ViewToggle component ───────────────────────────────────────────

export function ViewToggle({ view, onChange }) {
  const btnStyle = (active) => ({
    padding: '6px 16px',
    border: '1px solid #6c3fc5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    background: active ? '#6c3fc5' : '#fff',
    color: active ? '#fff' : '#6c3fc5',
  })

  return (
    <div style={{ display: 'inline-flex' }}>
      <button
        style={{ ...btnStyle(view === 'top'), borderRadius: '4px 0 0 4px', borderRight: 'none' }}
        onClick={() => onChange('top')}
        aria-pressed={view === 'top'}
      >
        Top View
      </button>
      <button
        style={{ ...btnStyle(view === 'front'), borderRadius: '0 4px 4px 0' }}
        onClick={() => onChange('front')}
        aria-pressed={view === 'front'}
      >
        Front View
      </button>
    </div>
  )
}

// ─── Task 5.1: calcScaleFactor pure function ──────────────────────────────────

export const MARGIN_FACTOR = 0.85

export function calcScaleFactor(tableRealW, tableRealH, canvasPixelW, canvasPixelH) {
  return Math.min(canvasPixelW / tableRealW, canvasPixelH / tableRealH) * MARGIN_FACTOR
}

// ─── Tasks 9.1, 9.2, 9.3: FixtureRect component ──────────────────────────────

export function FixtureRect({
  fixture,
  scaleFactor,
  canvasRealW,
  canvasRealH,
  isSelected,
  color,
  unit,
  onPointerDown,
  onResize,
  onDelete,
  onSelect,
  opacity = 0.8,
}) {
  const x = fixture.x * scaleFactor
  const y = fixture.y * scaleFactor
  const w = fixture.width * scaleFactor
  const h = fixture.height * scaleFactor

  const HANDLE_SIZE = 8
  const DELETE_R = 8

  // ── Task 9.2: Resize handle pointer logic ──────────────────────────────────
  function handleResizePointerDown(e) {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = fixture.width
    const startH = fixture.height

    e.currentTarget.setPointerCapture(e.pointerId)

    function onMove(ev) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      // clamp so fixture can't grow past canvas edge
      const maxW = (canvasRealW ?? Infinity) - fixture.x
      const maxH = (canvasRealH ?? Infinity) - fixture.y
      const newW = Math.min(maxW, Math.max(1, startW + dx / scaleFactor))
      const newH = Math.min(maxH, Math.max(1, startH + dy / scaleFactor))
      onResize && onResize(fixture.id, newW, newH)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ── Task 9.3: Delete button click ─────────────────────────────────────────
  function handleDeletePointerDown(e) {
    e.stopPropagation()
    e.preventDefault()
    onDelete && onDelete(fixture.id)
  }

  return (
    <g>
      {/* Task 9.1: Fixture body */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={color}
        opacity={opacity}
        stroke={isSelected ? '#fff' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        style={{ cursor: 'grab' }}
        onPointerDown={e => onPointerDown && onPointerDown(e, fixture)}
        onClick={() => onSelect && onSelect(fixture.id)}
      />

      {isSelected && (
        <>
          {/* Task 9.2: Dimension label — inside fixture, top-center */}
          <text
            x={x + w / 2}
            y={y + 12}
            textAnchor="middle"
            fontSize={11}
            fill="#fff"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {Math.round(fixture.width * 10) / 10} × {Math.round(fixture.height * 10) / 10} {unit}
          </text>

          {/* Task 9.2: Resize handle — bottom-right corner, inset */}
          <rect
            x={x + w - HANDLE_SIZE - 1}
            y={y + h - HANDLE_SIZE - 1}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#fff"
            stroke="#6c3fc5"
            strokeWidth={1.5}
            style={{ cursor: 'se-resize' }}
            onPointerDown={handleResizePointerDown}
          />

          {/* Task 9.3: Delete button — top-right corner, inset */}
          <circle
            cx={x + w - DELETE_R - 1}
            cy={y + DELETE_R + 1}
            r={DELETE_R}
            fill="#e74c3c"
            style={{ cursor: 'pointer' }}
            onPointerDown={handleDeletePointerDown}
          />
          <text
            x={x + w - DELETE_R - 1}
            y={y + DELETE_R + 5}
            textAnchor="middle"
            fontSize={11}
            fill="#fff"
            fontWeight="bold"
            style={{ cursor: 'pointer', pointerEvents: 'none', userSelect: 'none' }}
          >
            ×
          </text>
        </>
      )}
    </g>
  )
}

// ─── Task 5.2 + 7.1 + 7.2 + 7.3: BoothCanvas component ──────────────────────

export function BoothCanvas({
  table,
  view,
  fixtures,
  selectedId,
  onFixtureDrop,
  onFixtureMove,
  onFixtureResize,
  onFixtureSelect,
  onFixtureDelete,
  dragState,
  onDragStateChange,
}) {
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 })
  const [ghostPos, setGhostPos] = useState(null) // { x, y, width, height, color } in SVG pixels
  const wrapperRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ width, height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const tableRealW = table.width
  const tableRealH = view === 'top' ? table.depth : table.height

  const scaleFactor = calcScaleFactor(tableRealW, tableRealH, canvasSize.width, canvasSize.height)

  const tablePixelW = tableRealW * scaleFactor
  const tablePixelH = tableRealH * scaleFactor
  const tableOriginX = (canvasSize.width - tablePixelW) / 2
  const tableOriginY = (canvasSize.height - tablePixelH) / 2

  // ── Task 7.1: Pointer helpers ──────────────────────────────────────────────

  function getSvgCoords(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const pointerSvgX = (e.clientX - rect.left) * (canvasSize.width / rect.width)
    const pointerSvgY = (e.clientY - rect.top) * (canvasSize.height / rect.height)
    return { pointerSvgX, pointerSvgY }
  }

  function isWithinBounds(e) {
    const rect = svgRef.current.getBoundingClientRect()
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    )
  }

  // Canvas real-world dimensions (the full workable area)
  const canvasRealW = canvasSize.width / scaleFactor
  const canvasRealH = canvasSize.height / scaleFactor

  function toCanvasCoords(pointerSvgX, pointerSvgY, offsetX = 0, offsetY = 0) {
    const x = (pointerSvgX - offsetX) / scaleFactor
    const y = (pointerSvgY - offsetY) / scaleFactor
    return { x, y }
  }

  function clampToCanvas(x, y, fixtureW, fixtureH) {
    return {
      x: Math.max(0, Math.min(x, canvasRealW - fixtureW)),
      y: Math.max(0, Math.min(y, canvasRealH - fixtureH)),
    }
  }

  // ── Task 7.1: SVG onPointerDown (background) ──────────────────────────────

  function handleSvgPointerDown(e) {
    // Only fires when clicking the SVG background (fixture rects call stopPropagation)
    if (dragState?.source === 'palette') {
      // Palette drag already in progress — do nothing, wait for pointerup
    } else {
      onFixtureSelect && onFixtureSelect(null)
    }
    // Capture pointer on SVG for smooth drag
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  // ── Task 7.1: SVG onPointerMove ───────────────────────────────────────────

  function handleSvgPointerMove(e) {
    if (!dragState) return
    const { pointerSvgX, pointerSvgY } = getSvgCoords(e)

    if (dragState.source === 'palette') {
      const typeDef = FIXTURE_TYPES.find(t => t.type === dragState.type)
      if (!typeDef) return
      const { x, y } = clampToCanvas(
        pointerSvgX / scaleFactor,
        pointerSvgY / scaleFactor,
        typeDef.defaultWidth,
        typeDef.defaultHeight,
      )
      setGhostPos({
        x: x * scaleFactor,
        y: y * scaleFactor,
        width: typeDef.defaultWidth * scaleFactor,
        height: typeDef.defaultHeight * scaleFactor,
        color: typeDef.color,
      })
    } else if (dragState.source === 'canvas') {
      const fixture = fixtures.find(f => f.id === dragState.fixtureId)
      if (!fixture) return
      const raw = toCanvasCoords(pointerSvgX, pointerSvgY, dragState.offsetX, dragState.offsetY)
      const { x, y } = clampToCanvas(raw.x, raw.y, fixture.width, fixture.height)
      const typeDef = FIXTURE_TYPES.find(t => t.type === fixture.type)
      setGhostPos({
        x: x * scaleFactor,
        y: y * scaleFactor,
        width: fixture.width * scaleFactor,
        height: fixture.height * scaleFactor,
        color: typeDef ? typeDef.color : '#999',
      })
    }
  }

  // ── Task 7.2 + 7.3: SVG onPointerUp ──────────────────────────────────────

  function handleSvgPointerUp(e) {
    if (!dragState) return

    if (!isWithinBounds(e)) {
      // Task 7.3: outside bounds — revert
      onDragStateChange && onDragStateChange(null)
      setGhostPos(null)
      return
    }

    const { pointerSvgX, pointerSvgY } = getSvgCoords(e)

    if (dragState.source === 'palette') {
      // Task 7.2: commit palette drop
      const typeDef = FIXTURE_TYPES.find(t => t.type === dragState.type)
      if (!typeDef) {
        onDragStateChange && onDragStateChange(null)
        return
      }
      const { x, y } = clampToCanvas(
        pointerSvgX / scaleFactor,
        pointerSvgY / scaleFactor,
        typeDef.defaultWidth,
        typeDef.defaultHeight,
      )
      onFixtureDrop && onFixtureDrop(dragState.type, x, y)
      onDragStateChange && onDragStateChange(null)
      setGhostPos(null)
    } else if (dragState.source === 'canvas') {
      // Task 7.2: commit canvas move
      const fixture = fixtures.find(f => f.id === dragState.fixtureId)
      if (!fixture) {
        onDragStateChange && onDragStateChange(null)
        return
      }
      const raw = toCanvasCoords(pointerSvgX, pointerSvgY, dragState.offsetX, dragState.offsetY)
      const { x, y } = clampToCanvas(raw.x, raw.y, fixture.width, fixture.height)
      onFixtureMove && onFixtureMove(dragState.fixtureId, x, y)
      onDragStateChange && onDragStateChange(null)
      setGhostPos(null)
    }
  }

  // ── Task 7.1: Fixture rect onPointerDown ──────────────────────────────────

  function handleFixturePointerDown(e, fixture) {
    e.stopPropagation()
    const { pointerSvgX, pointerSvgY } = getSvgCoords(e)
    // offset in SVG pixels from fixture canvas-origin
    const offsetX = pointerSvgX - fixture.x * scaleFactor
    const offsetY = pointerSvgY - fixture.y * scaleFactor
    onDragStateChange && onDragStateChange({
      fixtureId: fixture.id,
      source: 'canvas',
      offsetX,
      offsetY,
    })
    onFixtureSelect && onFixtureSelect(fixture.id)
    e.currentTarget.closest('svg')?.setPointerCapture(e.pointerId)
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', minHeight: '800px', height: '800px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', background: '#f8f8f8' }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        style={{ cursor: dragState ? 'grabbing' : 'default' }}
      >
        {/* Workable area background */}
        <rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill="#f8f8f8"
          stroke="#ccc"
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />

        {/* Workable area label */}
        <text
          x={8}
          y={16}
          fontSize={10}
          fill="#bbb"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          Workable area
        </text>

        {/* TableRect */}
        <rect
          x={tableOriginX}
          y={tableOriginY}
          width={tablePixelW}
          height={tablePixelH}
          fill={dragState?.source === 'palette' ? '#ede7ff' : '#f5f0ff'}
          stroke="#6c3fc5"
          strokeWidth={2}
        />

        {/* Table label */}
        <text
          x={tableOriginX + tablePixelW / 2}
          y={tableOriginY + tablePixelH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#9b7fd4"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          Table
        </text>

        {/* Fixture rects */}
        {fixtures.map(fixture => {
          const typeDef = FIXTURE_TYPES.find(t => t.type === fixture.type)
          const color = typeDef ? typeDef.color : '#999'
          const isSelected = fixture.id === selectedId
          const isDragging = dragState?.source === 'canvas' && dragState.fixtureId === fixture.id
          return (
            <FixtureRect
              key={fixture.id}
              fixture={fixture}
              scaleFactor={scaleFactor}
              canvasRealW={canvasRealW}
              canvasRealH={canvasRealH}
              isSelected={isSelected}
              color={color}
              unit={table.unit}
              onPointerDown={handleFixturePointerDown}
              onResize={onFixtureResize}
              onDelete={onFixtureDelete}
              onSelect={onFixtureSelect}
              opacity={isDragging ? 0.25 : 0.8}
            />
          )
        })}

        {/* Ghost preview during drag */}
        {ghostPos && (
          <rect
            x={ghostPos.x}
            y={ghostPos.y}
            width={ghostPos.width}
            height={ghostPos.height}
            fill={ghostPos.color}
            opacity={0.6}
            stroke="#fff"
            strokeWidth={2}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
    </div>
  )
}

// ─── Task 6.1: FixturePalette component ───────────────────────────────────────

export function FixturePalette({ fixtureTypes, onDragStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
      {fixtureTypes.map(ft => (
        <div
          key={ft.type}
          onPointerDown={() => onDragStart(ft.type)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: ft.color,
            color: '#fff',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {ft.label}
        </div>
      ))}
    </div>
  )
}

// ─── Task 2.2 + Placeholder component (full UI in task 10) ────────────────────

const LS_KEY = 'booth-visualiser-layout'

export default function BoothVisualiser() {
  const [state, dispatch] = useReducer(layoutReducer, DEFAULT_STATE)
  const [selectedId, setSelectedId] = useState(null)
  const [dragState, setDragState] = useState(null)

  // On mount: restore from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (isValidLayout(parsed)) {
          dispatch({ type: ACTION_TYPES.LOAD_LAYOUT, layout: parsed })
        } else {
          localStorage.removeItem(LS_KEY)
        }
      }
    } catch {
      localStorage.removeItem(LS_KEY)
    }
  }, [])

  // On state change: persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state))
    } catch {
      // silently swallow storage errors
    }
  }, [state])

  function handleTableChange(field, value) {
    dispatch({ type: ACTION_TYPES.SET_TABLE_DIM, field, value })
  }

  function handleUnitChange(unit) {
    dispatch({ type: ACTION_TYPES.SET_UNIT, unit })
  }

  function handleViewChange(view) {
    dispatch({ type: ACTION_TYPES.SET_VIEW, view })
  }

  function handleFixtureDrop(type, x, y) {
    const id = crypto.randomUUID?.() ?? String(Date.now())
    const typeDef = FIXTURE_TYPES.find(t => t.type === type)
    if (!typeDef) return
    dispatch({
      type: ACTION_TYPES.ADD_FIXTURE,
      fixture: { id, type, x, y, width: typeDef.defaultWidth, height: typeDef.defaultHeight },
    })
  }

  function handleFixtureMove(id, x, y) {
    dispatch({ type: ACTION_TYPES.MOVE_FIXTURE, id, x, y })
  }

  function handleFixtureResize(id, width, height) {
    dispatch({ type: ACTION_TYPES.RESIZE_FIXTURE, id, width, height })
  }

  function handleFixtureDelete(id) {
    dispatch({ type: ACTION_TYPES.DELETE_FIXTURE, id })
    setSelectedId(null)
  }

  function handleFixtureSelect(id) {
    setSelectedId(id)
  }

  function handleDragStart(type) {
    setDragState({ type, source: 'palette' })
  }

  function handleClearLayout() {
    dispatch({ type: ACTION_TYPES.CLEAR_LAYOUT })
    localStorage.removeItem(LS_KEY)
    setSelectedId(null)
    setDragState(null)
  }

  return (
    <div id="booth-visualiser" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
      <DimensionPanel
        table={state.table}
        onTableChange={handleTableChange}
        onUnitChange={handleUnitChange}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ViewToggle view={state.view} onChange={handleViewChange} />
        <button
          onClick={handleClearLayout}
          style={{
            border: '1px solid #e74c3c',
            color: '#e74c3c',
            background: '#fff',
            padding: '6px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Layout
        </button>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <BoothCanvas
            table={state.table}
            view={state.view}
            fixtures={state.fixtures}
            selectedId={selectedId}
            onFixtureDrop={handleFixtureDrop}
            onFixtureMove={handleFixtureMove}
            onFixtureResize={handleFixtureResize}
            onFixtureSelect={handleFixtureSelect}
            onFixtureDelete={handleFixtureDelete}
            dragState={dragState}
            onDragStateChange={setDragState}
          />
        </div>
        <FixturePalette
          fixtureTypes={FIXTURE_TYPES}
          onDragStart={handleDragStart}
        />
      </div>
    </div>
  )
}
