import React from 'react';
import { Box, Card, CardContent, CardMedia, Chip, MenuItem, TextField, Typography } from '@mui/material';
import { Game } from './pre-registrazione';

interface LibraryProps {
  games: Game[];
  allGenres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const Library: React.FC<LibraryProps> = ({
  games,
  allGenres,
  selectedGenre,
  onSelectGenre,
  searchTerm,
  onSearchChange
}) => {
  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Libreria Giochi
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Tutti i giochi disponibili con i requisiti consigliati. Per stimare gli FPS con il tuo PC
        apri il Pannello dell'Ispettore.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', mb: 3 }}>
        <TextField
          select
          size="small"
          label="Categoria"
          value={selectedGenre}
          onChange={(e) => onSelectGenre(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {allGenres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Cerca un gioco"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </Box>

      {games.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 2.5
          }}
        >
          {games.map((game) => (
            <Card key={game.id} variant="outlined">
              <CardMedia component="img" height="130" image={game.image} alt={game.title} />
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {game.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                  {game.genre.map((g) => (
                    <Chip key={g} label={g} size="small" variant="outlined" />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {game.description}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>CPU:</strong> {game.reqCpu}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>GPU:</strong> {game.reqGpu}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>RAM:</strong> {game.reqRam} GB
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          Nessun gioco trovato in questa categoria.
        </Typography>
      )}
    </>
  );
};