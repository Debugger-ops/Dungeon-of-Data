import { createContext } from 'react'

// Set while a room is played as a campaign level: { level, record(stars) -> bonus XP, next(), retry(), back() }.
export const LevelFlag = createContext(null)
