import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import { Link, NavLink } from 'react-router-dom'
import type { JSX } from 'react'
import { Icon } from '../Icon'
import { useAuth } from '../../hooks/useAuth'

const items = [
  { to: '/home', title: 'Home', icon: 'home' },
  { to: '/libreria', title: 'Esplora giochi', icon: 'grid' },
  { to: '/preferiti', title: 'Preferiti', icon: 'heart' },
  { to: '/configurazione', title: 'La mia build', icon: 'chip' },
  { to: '/cronologia', title: 'Cronologia', icon: 'history' }
] as const

export function Sidebar({ onLogout }: { onLogout: () => void }): JSX.Element {
  const { user } = useAuth()
  return (
    <Box
      component="aside"
      aria-label="Navigazione principale"
      sx={{
        width: { xs: '100%', md: 210 },
        position: { xs: 'static', md: 'fixed' },
        inset: '0 auto 0 0',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: { md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: 'divider',
        p: 2
      }}
    >
      <Button
        component={Link}
        to="/home"
        color="inherit"
        sx={{ justifyContent: 'flex-start', p: 0, mt: 1, fontSize: 20 }}
      >
        Build
        <Box component="span" sx={{ color: 'primary.main', ml: 0.5 }}>
          Inspector
        </Box>
      </Button>
      <Typography
        color="text.secondary"
        variant="body2"
        sx={{ mt: 4, mb: 1, display: { xs: 'none', md: 'block' } }}
      >
        Menu
      </Typography>
      <List
        component="nav"
        aria-label="Pagine"
        sx={{ display: { xs: 'flex', md: 'block' }, mt: { xs: 1, md: 0 } }}
      >
        {items.map((item) => (
          <ListItemButton
            component={NavLink}
            key={item.to}
            to={item.to}
            sx={{
              px: 1,
              mb: 0.5,
              borderRadius: 1,
              '&.active': { bgcolor: 'action.selected', color: 'primary.main' }
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 30, color: 'inherit', display: { xs: 'none', sm: 'flex' } }}
            >
              <Icon name={item.icon} />
            </ListItemIcon>
            <ListItemText primary={item.title} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Icon name={user ? 'user' : 'game'} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere', fontWeight: 600 }}>
              {user?.name ?? 'Modalità ospite'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user ? 'Accesso effettuato' : 'Accesso non effettuato'}
            </Typography>
          </Box>
          {user && (
            <IconButton onClick={onLogout} aria-label="Esci dal profilo" size="small">
              <Icon name="logout" />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
