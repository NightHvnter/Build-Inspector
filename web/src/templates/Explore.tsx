import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HistoryIcon from "@mui/icons-material/History";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MemoryIcon from "@mui/icons-material/Memory";
import SpeedIcon from "@mui/icons-material/Speed";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import { PageHeader, Section } from "../components/Page";

const FEATURES = [
  {
    icon: SportsEsportsIcon,
    title: "I giochi più giocati",
    text: "La classifica di Steam degli ultimi 7 giorni, sempre aggiornata, più la ricerca su tutto il negozio.",
  },
  {
    icon: LocalOfferIcon,
    title: "Filtra per tag",
    text: "Scegli un tag come “GDR” o “Mondo aperto” e vedi i giochi più giocati di quel tipo.",
  },
  {
    icon: MemoryIcon,
    title: "Scansione del PC",
    text: "Processore, scheda video, memoria, spazio libero e sistema operativo rilevati in automatico, senza moduli da compilare.",
  },
  {
    icon: AssessmentIcon,
    title: "Report di compatibilità",
    text: "Per ogni componente l’esito (soddisfatto, insufficiente o da verificare) confrontato con i requisiti minimi ufficiali di Steam.",
  },
  {
    icon: SpeedIcon,
    title: "Qualità in percentuale",
    text: "Non solo sì o no: vedi di quanto il tuo processore e la tua scheda video superano il minimo, con i punteggi PassMark.",
  },
  {
    icon: FavoriteIcon,
    title: "Preferiti nel tuo account",
    text: "Salva i giochi che ti interessano e ritrovali su ogni computer da cui accedi.",
  },
  {
    icon: HistoryIcon,
    title: "Cronologia dei confronti",
    text: "Ogni confronto viene salvato, così puoi tornarci o vedere come cambia dopo un aggiornamento del PC.",
  },
];

// /explore: what the app does.
export default function Explore() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Funzionalità"
        title="Tutto quello che serve per decidere"
        text="Build Inspector confronta i requisiti dei giochi Steam con i componenti del tuo computer, prima di acquistare un gioco o aggiornare il PC."
      />
      <Section>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          }}
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Paper key={title} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  mb: 1.5,
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                })}
              >
                <Icon />
              </Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {text}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Section>
      <Section>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Typography variant="h6">Pronto a controllare il tuo PC?</Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={() => navigate("/download")}
          >
            Scarica l’app
          </Button>
        </Stack>
      </Section>
    </>
  );
}
