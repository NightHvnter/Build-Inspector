import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';

export interface Game {
  id: number;
  title: string;
  image: string;
  genre: string[];
  description: string;
  reqCpu: string;
  reqGpu: string;
  reqRam: number;
  baseFps: number;
}

interface PreRegistrazioneProps {
  games: Game[];
  allGenres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenAuth: () => void;
}

export const PreRegistrazione: React.FC<PreRegistrazioneProps> = ({
  games,
  allGenres,
  selectedGenre,
  onSelectGenre,
  searchTerm,
  onSearchChange,
  onOpenAuth
}) => {
  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Libreria Giochi
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Sfoglia i giochi Steam più popolari e controlla i loro requisiti. Accedi per stimare gli FPS
        con la tua configurazione.
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
              <CardActionArea onClick={onOpenAuth}>
                <CardMedia component="img" height="130" image={game.image} alt={game.title} />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {game.title}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {game.genre.map((g) => (
                      <Chip key={g} label={g} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          Nessun gioco trovato in questa categoria.
        </Typography>
      )}

      <Paper
        variant="outlined"
        sx={{ mt: 5, p: 3, borderLeft: 3, borderLeftColor: 'primary.main' }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Vuoi testare le prestazioni del tuo PC?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Registrati gratuitamente per sbloccare l'Ispettore Hardware. Potrai selezionare la tua{' '}
          <strong>CPU, GPU e RAM</strong>, scoprire gli <strong>FPS stimati</strong> per ogni gioco
          ed evitare i colli di bottiglia.
        </Typography>
        <Button variant="contained" onClick={onOpenAuth}>
          Registrati per sbloccare i benchmark
        </Button>
      </Paper>
    </>
  );
};