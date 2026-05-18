import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../../app/store'
import { entityColor } from '../../../app/constants'

const NODE_R    = 20
const REPEL     = 7000
const ATTRACT   = 0.035
const CENTER_F  = 0.007
const DAMPING   = 0.80

export function useGraphEngine(canvasRef, graphData) {
  const { selectNode, selectedNode } = useStore()
  const simRef        = useRef([])
  const edgesRef      = useRef([])
  const transformRef  = useRef({ x: 0, y: 0, scale: 1 })
  const hoveredRef    = useRef(null)
  const selectedRef   = useRef(null)
  const frameRef      = useRef(null)
  const draggingRef   = useRef(null)
  const dragOffRef    = useRef({ x: 0, y: 0 })
  const panRef        = useRef(null)

  // keep selectedRef in sync
  useEffect(() => { selectedRef.current = selectedNode }, [selectedNode])

  // ── init simulation ──
  useEffect(() => {
    if (!graphData) return
    simRef.current = graphData.nodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      vx: 0, vy: 0,
    }))
    edgesRef.current = graphData.edges || []
  }, [graphData])

  // ── resize ──
  const resize = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const p = c.parentElement.getBoundingClientRect()
    c.width = p.width; c.height = p.height
    transformRef.current.x = p.width / 2
    transformRef.current.y = p.height / 2
  }, [canvasRef])

  // ── coord helpers ──
  const toWorld  = (sx, sy) => {
    const t = transformRef.current
    return { x: (sx - t.x) / t.scale, y: (sy - t.y) / t.scale }
  }
  const toScreen = (wx, wy) => {
    const t = transformRef.current
    return { x: wx * t.scale + t.x, y: wy * t.scale + t.y }
  }

  const getNode = useCallback((sx, sy) => {
    const { x, y } = toWorld(sx, sy)
    let nearest = null, nd = NODE_R * 1.6
    simRef.current.forEach(n => {
      const d = Math.hypot(n.x - x, n.y - y)
      if (d < nd) { nearest = n; nd = d }
    })
    return nearest
  }, [])

  // ── draw ──
  const draw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    const t = transformRef.current

    // dot grid
    const spacing = 22 * t.scale
    const ox = t.x % spacing, oy = t.y % spacing
    ctx.fillStyle = 'rgba(127,119,221,0.045)'
    for (let x = ox; x < c.width; x += spacing)
      for (let y = oy; y < c.height; y += spacing)
        ctx.fillRect(x - 1, y - 1, 2, 2)

    // edges
    edgesRef.current.forEach(e => {
      const s = simRef.current.find(n => n.id === e.from_entity_id)
      const tg = simRef.current.find(n => n.id === e.to_entity_id)
      if (!s || !tg) return
      const sp = toScreen(s.x, s.y), tp = toScreen(tg.x, tg.y)
      const isHov = hoveredRef.current?.id === s.id || hoveredRef.current?.id === tg.id
      const isSel = selectedRef.current?.id === s.id || selectedRef.current?.id === tg.id

      ctx.beginPath()
      ctx.moveTo(sp.x, sp.y)
      ctx.lineTo(tp.x, tp.y)
      ctx.strokeStyle = (isHov || isSel) ? 'rgba(127,119,221,0.55)' : 'rgba(127,119,221,0.14)'
      ctx.lineWidth = (isHov || isSel) ? 1.5 : 1
      ctx.stroke()

      // arrowhead
      const ang = Math.atan2(tp.y - sp.y, tp.x - sp.x)
      const ar = NODE_R * t.scale + 4
      const ax = tp.x - ar * Math.cos(ang), ay = tp.y - ar * Math.sin(ang)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 7 * Math.cos(ang - 0.38), ay - 7 * Math.sin(ang - 0.38))
      ctx.lineTo(ax - 7 * Math.cos(ang + 0.38), ay - 7 * Math.sin(ang + 0.38))
      ctx.closePath()
      ctx.fillStyle = (isHov || isSel) ? 'rgba(127,119,221,0.55)' : 'rgba(127,119,221,0.14)'
      ctx.fill()

      // edge label on hover
      if ((isHov || isSel) && t.scale > 0.5) {
        const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2
        ctx.font = `${Math.max(9, 10 * t.scale)}px DM Mono, monospace`
        const tw = ctx.measureText(e.label).width
        ctx.fillStyle = 'rgba(19,19,31,0.9)'
        ctx.fillRect(mx - tw / 2 - 5, my - 9, tw + 10, 16)
        ctx.fillStyle = 'rgba(159,155,192,0.9)'
        ctx.textAlign = 'center'
        ctx.fillText(e.label, mx, my + 2)
      }
    })

    // nodes
    simRef.current.forEach(n => {
      const { x, y } = toScreen(n.x, n.y)
      const r = NODE_R * t.scale
      const color = entityColor(n.entity_type)
      const isHov = hoveredRef.current?.id === n.id
      const isSel = selectedRef.current?.id === n.id
      const sc = (isHov || isSel) ? 1.13 : 1
      const rr = r * sc

      // glow ring for selected
      if (isSel) {
        ctx.beginPath()
        ctx.arc(x, y, rr + 7, 0, Math.PI * 2)
        ctx.fillStyle = color + '18'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, rr + 3, 0, Math.PI * 2)
        ctx.strokeStyle = color + '55'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // fill
      ctx.beginPath()
      ctx.arc(x, y, rr, 0, Math.PI * 2)
      ctx.fillStyle = color + '1e'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = isSel ? 2 : 1.5
      ctx.stroke()

      // letter icon
      ctx.font = `${Math.max(9, 12 * t.scale * sc)}px Outfit, sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(n.entity_type[0].toUpperCase(), x, y)

      // name label
      if (t.scale > 0.5) {
        const label = n.name.length > 15 ? n.name.slice(0, 14) + '…' : n.name
        ctx.font = `${Math.max(8, 11 * t.scale)}px Outfit, sans-serif`
        ctx.fillStyle = isHov ? '#e8e6f8' : '#9f9bc0'
        ctx.textBaseline = 'top'
        ctx.fillText(label, x, y + rr + 4 * t.scale)
      }
    })
  }, [canvasRef])

  // ── physics tick ──
  const tick = useCallback(() => {
    const nodes = simRef.current
    const edges = edgesRef.current

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d2 = dx * dx + dy * dy + 0.1
        const d  = Math.sqrt(d2)
        const f  = REPEL / d2
        const fx = f * dx / d, fy = f * dy / d
        a.vx -= fx; a.vy -= fy
        b.vx += fx; b.vy += fy
      }
      a.vx -= a.x * CENTER_F
      a.vy -= a.y * CENTER_F
    }

    edges.forEach(e => {
      const s = nodes.find(n => n.id === e.from_entity_id)
      const tg = nodes.find(n => n.id === e.to_entity_id)
      if (!s || !tg) return
      const dx = tg.x - s.x, dy = tg.y - s.y
      const d = Math.hypot(dx, dy) + 0.1
      const f = (d - 130) * ATTRACT
      const fx = f * dx / d, fy = f * dy / d
      s.vx += fx; s.vy += fy
      tg.vx -= fx; tg.vy -= fy
    })

    nodes.forEach(n => {
      if (draggingRef.current?.id === n.id) return
      n.vx *= DAMPING; n.vy *= DAMPING
      n.x += n.vx; n.y += n.vy
    })

    draw()
    frameRef.current = requestAnimationFrame(tick)
  }, [draw])

  // ── start/stop ──
  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [resize, tick])

  // ── mouse events ──
  const onMouseDown = useCallback((e) => {
    const node = getNode(e.offsetX, e.offsetY)
    if (node) {
      draggingRef.current = node
      const w = toWorld(e.offsetX, e.offsetY)
      dragOffRef.current = { x: node.x - w.x, y: node.y - w.y }
    } else {
      panRef.current = { sx: e.offsetX, sy: e.offsetY, tx: transformRef.current.x, ty: transformRef.current.y }
    }
  }, [getNode])

  const onMouseMove = useCallback((e) => {
    hoveredRef.current = getNode(e.offsetX, e.offsetY)
    if (canvasRef.current) canvasRef.current.style.cursor = hoveredRef.current ? 'pointer' : panRef.current ? 'grabbing' : 'default'
    if (draggingRef.current) {
      const w = toWorld(e.offsetX, e.offsetY)
      draggingRef.current.x = w.x + dragOffRef.current.x
      draggingRef.current.y = w.y + dragOffRef.current.y
      draggingRef.current.vx = 0; draggingRef.current.vy = 0
    } else if (panRef.current) {
      transformRef.current.x = panRef.current.tx + (e.offsetX - panRef.current.sx)
      transformRef.current.y = panRef.current.ty + (e.offsetY - panRef.current.sy)
    }
  }, [getNode, canvasRef])

  const onMouseUp   = useCallback(() => { draggingRef.current = null; panRef.current = null }, [])
  const onClick     = useCallback((e) => {
    const node = getNode(e.offsetX, e.offsetY)
    selectNode(node || null)
  }, [getNode, selectNode])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const t = transformRef.current
    t.x = e.offsetX - (e.offsetX - t.x) * factor
    t.y = e.offsetY - (e.offsetY - t.y) * factor
    t.scale = Math.max(0.15, Math.min(3.5, t.scale * factor))
  }, [])

  // fit view
  const fitView = useCallback(() => {
    const c = canvasRef.current
    const nodes = simRef.current
    if (!c || nodes.length === 0) return
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const pw = c.width - 120, ph = c.height - 120
    const gw = maxX - minX + 1, gh = maxY - minY + 1
    const t = transformRef.current
    t.scale = Math.min(pw / gw, ph / gh, 1.4)
    t.x = c.width  / 2 - ((minX + maxX) / 2) * t.scale
    t.y = c.height / 2 - ((minY + maxY) / 2) * t.scale
  }, [canvasRef])

  const zoomIn  = () => { transformRef.current.scale = Math.min(3.5, transformRef.current.scale * 1.2) }
  const zoomOut = () => { transformRef.current.scale = Math.max(0.15, transformRef.current.scale / 1.2) }

  return { onMouseDown, onMouseMove, onMouseUp, onClick, onWheel, fitView, zoomIn, zoomOut }
}
