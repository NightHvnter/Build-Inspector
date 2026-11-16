import * as banners from "../static/images/banners";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";

import { alpha, type SxProps, type Theme } from "@mui/material/styles";

import { useRef, useState } from "react";
import { useOS } from "../hooks/useOs";
import { useUser } from "../hooks/useUser";

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const nextStep = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);

  const stepperRef = useRef<HTMLDivElement | null>(null);
  const os = useOS();
  const user = useUser();

  const handleScroll = () => {
    stepperRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start'      
    });
  };

  const handleNext = () => {
    switch(activeStep) {
      case 0:
        window.open(`${window.location.origin}/download/${os?.toLocaleLowerCase()}`, '_blank');
        nextStep();
        break
      case 1:
        if(localStorage.getItem("username")) nextStep();
        else user.HandleOpen();
        break
      case 2:
        break
    }
  };

  const steps = [
    {
      label: "Scarica Build Inspector",
      description:
        "Scarica Build Inspector dalla nostra download page",
    },
    {
      label: "Registra o Accedi",
      description: "Registra o accedi al tuo account per ottenere più vantaggi",
    },
  ];

  const imgStyle: SxProps<Theme> = {
    filter: "brightness(50%) blur(3px)",
    width: "25%",
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
    fontSize: "2rem",
    backgroundImage:
      "linear-gradient(90deg,rgba(22, 165, 222, 1) 0%, rgba(2, 173, 73, 1) 50%, rgba(208, 235, 5, 1) 100%)",
  };

  return (
    <>
      <Box sx={{ my: "3vh", position: "relative" }}>
        <Stack direction={"row"} sx={imgStackStyle}>
          <Box component={"img"} src={banners.cs2} sx={imgStyle} />
          <Box component={"img"} src={banners.gta5} sx={imgStyle} />
          <Box component={"img"} src={banners.lol} sx={imgStyle} />
          <Box component={"img"} src={banners.minecraft} sx={imgStyle} />
        </Stack>
        <Box
          sx={(theme) => ({
            position: "absolute",
            transform: "translate(-50%, -50%)",
            p: 4,
            border: 1,
            zIndex: 10,
            top: "50%",
            left: "50%",
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            width: "60%",
          })}
        >
          <Stack>
            <Typography sx={{ fontSize: "2rem", textAlign: "center" }}>
              Sei curioso di sapere se un{" "}
              <Typography component={"span"} sx={textSpecial}>
                GIOCO
              </Typography>{" "}
              e' supportato dal tuo{" "}
              <Typography component={"span"} sx={textSpecial}>
                DISPOSITIVO
              </Typography>
              ?
            </Typography>
            <Button sx={{ mt: 3 }} variant="contained" onClick={handleScroll}>
              <Typography variant="h5">Utilizza Build Inspector!</Typography>
            </Button>
          </Stack>
        </Box>
      </Box>
      <Divider orientation="horizontal" variant="fullWidth"/>
      <Box sx={{ m: 4 }} ref={stepperRef}>
        <Stack>
          <Box sx={{maxWidth: "40%"}}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel
                    optional={
                      index === steps.length - 1 ? (
                        <Typography variant="caption">Ultimo step</Typography>
                      ) : null
                    }
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Box>
                      <Typography variant="body2">
                        {step.description}
                      </Typography>
                    </Box>
                    <Button variant="contained" onClick={handleNext} sx={{mx: 1, mt: 3}}>Avanti</Button>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Stack>
      </Box>
    </>
  );
}
