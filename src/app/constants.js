export const ENTITY_COLORS = {
  character: '#7F77DD',
  location:  '#1D9E75',
  event:     '#D85A30',
  faction:   '#BA7517',
  artifact:  '#D4537E',
  chapter:   '#888780',
}

export const ENTITY_TYPES = Object.keys(ENTITY_COLORS)

export const entityColor = (type) => ENTITY_COLORS[type] || '#888'
