import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as banners from "../static/images/banners";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";

import { DOWNLOADS, detectPlatform } from "../downloads";

const GAME_BANNERS = [
  { src: banners.cs2, alt: "Counter-Strike 2" },
  { src: banners.gta5, alt: "Grand Theft Auto V" },
  { src: banners.lol, alt: "League of Legends" },
  { src: banners.minecraft, alt: "Minecraft" },
];

const imgStyle: SxProps<Theme> = {
  filter: "brightness(50%) blur(3px)",
  width: "25%",
  objectFit: "cover",
  mx: 0.5,
  transition: "filter 0.3s ease-in-out",
};

const imgStackStyle: SxProps<Theme> = {
  mx: 1,
  minHeight: { xs: 180, sm: 360, md: 420 },
  "& > *:hover": {
    filter: "brightness(1) blur(0px)",
  },
};

const textSpecial: SxProps<Theme> = {
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "inline-block",
  backgroundClip: "text",
  fontWeight: "bold",
  backgroundImage:
    "linear-gradient(90deg, rgba(22, 165, 222, 1) 0%, rgba(2, 173, 73, 1) 50%, rgba(208, 235, 5, 1) 100%)",
};

const HIGHLIGHTS = [
  ["Requisiti ufficiali", "Letti da Steam per ogni gioco."],
  ["Scansione automatica", "Il PC viene analizzato in pochi secondi."],
  ["Margine in percentuale", "Sai di quanto superi il minimo."],
];

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const stepperRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const platform = detectPlatform(navigator.userAgent);
  const download = DOWNLOADS.find((d) => d.platform === platform);

  const steps = [
    {
      label: "Scarica Build Inspector",
      description: download
        ? `Scarica l’installer per ${download.name} e installalo.`
        : "Scegli la versione per il tuo sistema dalla pagina Download.",
      action: download ? `Scarica per ${download.name}` : "Vai ai download",
      run: () => {
        if (download) window.location.href = download.url;
        else navigate("/download");
      },
    },
    {
      label: "Crea un account",
      description:
        "Apri l’app e scegli “Registrati”: con un account salvi preferiti e cronologia. Puoi accedere anche con Google o Discord.",
      action: "Avanti",
    },
    {
      label: "Confronta un gioco",
      description:
        "Cerca un gioco o sceglilo tra i più giocati, poi premi “Confronta con il mio PC”: l’app scansiona il computer e ti mostra il report.",
      action: "Completa",
    },
  ];

  const handleNext = () => {
    steps[activeStep].run?.();
    setActiveStep((step) => step + 1);
  };

  return (
    <>
      <Box sx={{ my: "3vh", position: "relative" }}>
        <Stack direction="row" sx={imgStackStyle}>
          {GAME_BANNERS.map((banner) => (
            <Box key={banner.alt} component="img" src={banner.src} alt={banner.alt} sx={imgStyle} />
          ))}
        </Stack>

        <Box
          sx={(theme: Theme) => ({
            // Over the banners on wide screens; below them (slightly overlapping) on phones,
            // where the text is taller than the banners.
            position: { xs: "relative", sm: "absolute" },
            transform: { xs: "none", sm: "translate(-50%, -50%)" },
            mt: { xs: -6, sm: 0 },
            mx: { xs: 2, sm: 0 },
            p: { xs: 2.5, md: 4 },
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            zIndex: 10,
            top: { sm: "50%" },
            left: { sm: "50%" },
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            width: { sm: "75%", md: "60%" },
          })}
        >
          <Stack sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography component="h1" sx={{ fontSize: { xs: "1.4rem", md: "2rem" } }}>
              Sei curioso di sapere se un{" "}
              <Box component="span" sx={textSpecial}>
                GIOCO
              </Box>{" "}
              è supportato dal tuo{" "}
              <Box component="span" sx={textSpecial}>
                DISPOSITIVO
              </Box>
              ?
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
              Build Inspector confronta i requisiti minimi dei giochi Steam con i componenti del tuo PC
              e ti dice cosa va bene, cosa no e quanto margine hai.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 3, alignItems: "center" }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={() => navigate("/download")}
              >
                {download ? `Scarica per ${download.name}` : "Scarica l’app"}
              </Button>
              <Button
                size="large"
                onClick={() =>
                  stepperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Come funziona
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            my: 3,
          }}
        >
          {HIGHLIGHTS.map(([title, text]) => (
            <Paper key={title} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {text}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      <Divider orientation="horizontal" variant="fullWidth" />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }} ref={stepperRef}>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Come funziona
        </Typography>
        <Box sx={{ maxWidth: { xs: "100%", md: "60%" } }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  optional={
                    index === steps.length - 1 ? (
                      <Typography variant="caption">Ultimo passaggio</Typography>
                    ) : null
                  }
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">{step.description}</Typography>
                  <Button variant="contained" onClick={handleNext} sx={{ mt: 2 }}>
                    {step.action}
                  </Button>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Tutto pronto! Ora puoi usare Build Inspector.
              </Typography>
              <Button onClick={() => setActiveStep(0)} sx={{ mt: 1 }}>
                Ricomincia
              </Button>
            </Paper>
          )}
        </Box>
      </Container>
    </>
  );
}
