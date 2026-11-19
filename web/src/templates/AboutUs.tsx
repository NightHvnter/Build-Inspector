import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import { PageHeader, Section } from "../components/Page";
import { REPO_URL } from "../downloads";

const PARTS = [
  {
    title: "App desktop",
    text: "Scansiona il PC, mostra il catalogo e genera il report di compatibilità.",
    stack: ["Electron", "React", "TypeScript", "Material UI"],
  },
  {
    title: "Server",
    text: "Gestisce account, preferiti e cronologia, e tiene in archivio i dati dei giochi presi da Steam.",
    stack: ["NestJS", "TypeORM", "MariaDB"],
  },
  {
    title: "Sito",
    text: "Questa pagina: presenta il progetto e porta ai download.",
    stack: ["React", "Vite", "GitHub Pages"],
  },
];

const SOURCES = [
  ["Steam", "classifica dei più giocati, schede e requisiti minimi dei giochi"],
  ["PassMark", "punteggi di processori e schede video, usati per i confronti"],
];

// /about-us: the project and where its data comes from.
export default function AboutUs() {
  return (
    <>
      <PageHeader
        eyebrow="Chi siamo"
        title="Il progetto Build Inspector"
        text="Build Inspector nasce per rispondere a una domanda semplice: il mio PC fa girare questo gioco? Invece di confrontare a mano sigle di processori e schede video, l’app lo fa per te e ti dice anche quanto margine hai."
      />
      <Section title="Com’è fatto">
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {PARTS.map((part) => (
            <Paper key={part.title} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
                {part.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {part.text}
              </Typography>
              <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
                {part.stack.map((tech) => (
                  <Chip key={tech} size="small" variant="outlined" label={tech} />
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      </Section>
      <Section title="Da dove vengono i dati">
        <Stack spacing={1}>
          {SOURCES.map(([name, text]) => (
            <Typography key={name}>
              <strong>{name}</strong>: {text}.
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary">
            I confronti sono stime basate su questi dati, non una garanzia di prestazioni.
          </Typography>
        </Stack>
      </Section>
      <Section title="Codice sorgente">
        <Typography sx={{ mb: 2 }}>
          Il progetto è open source: codice, release e segnalazioni sono su GitHub.
        </Typography>
        <Button variant="outlined" startIcon={<GitHubIcon />} href={REPO_URL}>
          Apri su GitHub
        </Button>
      </Section>
    </>
  );
}
