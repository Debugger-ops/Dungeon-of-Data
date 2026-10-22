import { createContext } from 'react'

// Set while a room is played as one stage of a Boss Rush. The Result card uses it to show "Next room" instead of "Play again".
export const RushFlag = createContext(null)
