import { Chip, IconButton, InputAdornment, MenuItem, Stack, TextField } from '@mui/material'
import type { JSX } from 'react'
import { Icon } from '../Icon'

interface GameFiltersProps {
  search: string
  genre: string
  sort: string
  genres: string[] // the first entry means "every genre"
  onChange: (values: Record<string, string>) => void
}

export function GameFilters({
  search,
  genre,
  sort,
  genres,
  onChange
}: GameFiltersProps): JSX.Element {
  const [allGenres, ...genreList] = genres
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          label="Cerca un gioco"
          placeholder="Nome del gioco, anche non in catalogo: cerco su Steam"
          value={search}
          onChange={(event) => onChange({ q: event.target.value })}
          sx={{ flex: 1 }}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" size={20} />
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
          label="Ordina per"
          value={sort}
          onChange={(event) => onChange({ sort: event.target.value })}
          sx={{ width: { xs: '100%', sm: 190 }, flexShrink: 0 }}
        >
          <MenuItem value="featured">Più giocati</MenuItem>
          <MenuItem value="alphabetical">Nome A–Z</MenuItem>
        </TextField>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        role="group"
        aria-label="Filtra per genere"
        sx={{ flexWrap: 'wrap' }}
      >
        {[allGenres, ...genreList].map((entry) => {
          const selected = entry === genre
          return (
            <Chip
              key={entry}
              label={entry === allGenres ? 'Tutti i generi' : entry}
              clickable
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              aria-pressed={selected}
              onClick={() => onChange({ genre: entry === allGenres ? '' : entry })}
              sx={{ fontWeight: selected ? 600 : 400 }}
            />
          )
        })}
      </Stack>
    </Stack>
  )
}
