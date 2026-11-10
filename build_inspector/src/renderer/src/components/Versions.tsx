import { List, ListItem, ListItemText } from '@mui/material'
import type { JSX } from 'react'

export default function Versions(): JSX.Element | null {
  const versions = window.electron?.process?.versions
  if (!versions) return null
  return (
    <List dense aria-label="Versioni dell’app">
      <ListItem>
        <ListItemText primary={'Electron v' + versions.electron} />
      </ListItem>
      <ListItem>
        <ListItemText primary={'Chromium v' + versions.chrome} />
      </ListItem>
      <ListItem>
        <ListItemText primary={'Node v' + versions.node} />
      </ListItem>
    </List>
  )
}
