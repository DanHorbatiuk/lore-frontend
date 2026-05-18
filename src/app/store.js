import { create } from 'zustand'
import { clearTokens } from '../api/client'

export const useStore = create((set) => ({
  user: null,
  currentWorld: null,
  currentView: 'graph', // 'graph' | 'timeline'
  selectedNode: null,
  panelOpen: false,

  setUser:       (user)  => set({ user }),
  setCurrentWorld:(world) => set({ currentWorld: world, selectedNode: null, panelOpen: false }),
  setCurrentView:(view)  => set({ currentView: view }),
  selectNode:    (node)  => set({ selectedNode: node, panelOpen: !!node }),
  closePanel:    ()      => set({ panelOpen: false, selectedNode: null }),

  logout: () => {
    clearTokens()
    set({ user: null, currentWorld: null, selectedNode: null, panelOpen: false })
  },
}))
