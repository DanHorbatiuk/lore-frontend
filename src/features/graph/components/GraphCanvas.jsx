import { useRef } from 'react'
import { useGraphEngine } from '../hooks/useGraphEngine'
import styles from './GraphCanvas.module.css'

export default function GraphCanvas({ graphData, onFitRef, onZoomInRef, onZoomOutRef }) {
  const canvasRef = useRef(null)
  const { onMouseDown, onMouseMove, onMouseUp, onClick, onWheel, fitView, zoomIn, zoomOut } =
    useGraphEngine(canvasRef, graphData)

  // expose controls to parent
  if (onFitRef)    onFitRef.current    = fitView
  if (onZoomInRef) onZoomInRef.current = zoomIn
  if (onZoomOutRef)onZoomOutRef.current= zoomOut

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onClick}
      onWheel={onWheel}
    />
  )
}
