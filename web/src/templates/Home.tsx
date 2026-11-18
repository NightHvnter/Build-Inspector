import { useRef, useState } from "react";
import * as banners from "../static/images/banners";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

import { useOS } from "../hooks/useOs";
import { useUser } from "../hooks/useUser";

const STEPS = [
  {
    label: "Scarica Build Inspector",
    description: "Scarica Build Inspector dalla nostra download page",
  },
  {
    label: "Registra o Accedi",
    description: "Registra o accedi al tuo account per ottenere più vantaggi",
  },
];

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

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const stepperRef = useRef<HTMLDivElement | null>(null);
  const os = useOS();
  const user = useUser();

  const nextStep = () => setActiveStep((prev: number) => prev + 1);
  const handleReset = () => setActiveStep(0);

  const handleScroll = () => {
    stepperRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleNext = () => {
    switch (activeStep) {
      case 0: {
        const targetOs = os ? os.toLowerCase() : "";
        window.open(
          `${window.location.origin}/download/${targetOs}`,
          "_blank",
          "noopener,noreferrer"
        );
        nextStep();
        break;
      }
      case 1: {
        if (localStorage.getItem("username")) {
          nextStep();
        } else {
          user.HandleOpen();
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      <Box sx={{ my: "3vh", position: "relative" }}>
        <Stack direction="row" sx={imgStackStyle}>
          {GAME_BANNERS.map((banner) => (
            <Box
              key={banner.alt}
              component="img"
              src={banner.src}
              alt={banner.alt}
              sx={imgStyle}
            />
          ))}
        </Stack>

        <Box
          sx={(theme: Theme) => ({
            position: "absolute",
            transform: "translate(-50%, -50%)",
            p: { xs: 2.5, md: 4 },
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            zIndex: 10,
            top: "50%",
            left: "50%",
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            width: { xs: "90%", sm: "75%", md: "60%" },
          })}
        >
          <Stack alignItems="center">
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.4rem", md: "2rem" },
                textAlign: "center",
              }}
            >
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

            <Button
              sx={{ mt: 3, fontSize: { xs: "1rem", md: "1.25rem" }, px: 3, py: 1 }}
              variant="contained"
              onClick={handleScroll}
            >
              Utilizza Build Inspector!
            </Button>
          </Stack>
        </Box>
      </Box>

      <Divider orientation="horizontal" variant="fullWidth" />

      <Box sx={{ m: { xs: 2, md: 4 } }} ref={stepperRef}>
        <Box sx={{ maxWidth: { xs: "100%", md: "50%" } }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {STEPS.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  optional={
                    index === STEPS.length - 1 ? (
                      <Typography variant="caption">Ultimo step</Typography>
                    ) : null
                  }
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">{step.description}</Typography>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 3 }}
                  >
                    {index === STEPS.length - 1 ? "Completa" : "Avanti"}
                  </Button>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === STEPS.length && (
            <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Configurazione completata! Ora puoi utilizzare Build Inspector.
              </Typography>
              <Button onClick={handleReset} sx={{ mt: 1 }}>
                Ricomincia
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
}
