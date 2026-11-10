import { IconButton, InputAdornment, MenuItem, Stack, TextField } from '@mui/material'
import type { JSX } from 'react'
import { Icon } from '../Icon'

interface GameFiltersProps {
  search: string
  genre: string
  sort: string
  genres: string[]
  onChange: (values: Record<string, string>) => void
}
export function GameFilters({
  search,
  genre,
  sort,
  genres,
  onChange
}: GameFiltersProps): JSX.Element {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        size="small"
        label="Cerca un gioco"
        value={search}
        onChange={(event) => onChange({ q: event.target.value })}
        sx={{ flex: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="search" size={18} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onChange({ q: '' })}
                  aria-label="Cancella ricerca"
                >
                  <Icon name="close" size={16} />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        }}
      />
      <TextField
        select
        size="small"
        label="Genere"
        value={genre}
        onChange={(event) => onChange({ genre: event.target.value })}
        sx={{ width: { xs: '100%', sm: 180 } }}
      >
        {genres.map((entry) => (
          <MenuItem value={entry} key={entry}>
            {entry}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Ordina per"
        value={sort}
        onChange={(event) => onChange({ sort: event.target.value })}
        sx={{ width: { xs: '100%', sm: 160 } }}
      >
        <MenuItem value="featured">In evidenza</MenuItem>
        <MenuItem value="alphabetical">Nome A–Z</MenuItem>
      </TextField>
    </Stack>
  )
}
