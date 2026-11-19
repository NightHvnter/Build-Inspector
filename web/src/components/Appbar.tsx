import ContrastIcon from "@mui/icons-material/Contrast";
import GitHubIcon from "@mui/icons-material/GitHub";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks";
import { REPO_URL } from "../downloads";

const LINKS = [
  { to: "/explore", label: "Funzionalità" },
  { to: "/download", label: "Download" },
  { to: "/about-us", label: "Chi siamo" },
];

export default function Appbar() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="primary" elevation={6}>
      <Toolbar sx={{ gap: { xs: 0, sm: 1 }, px: { xs: 0.5, sm: 2 } }}>
        <Tooltip title="Home" enterNextDelay={1000} arrow>
          <IconButton onClick={() => navigate("/")} aria-label="Home" sx={{ p: 0.75 }}>
            {/* The app's own logo (public/favicon.svg, the same as build_inspector/build/logo.svg). */}
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              sx={{ width: 40, height: 40, display: "block" }}
            />
          </IconButton>
        </Tooltip>
        <Typography
          component="span"
          sx={{ fontWeight: 700, color: "white", mr: 2, display: { xs: "none", md: "block" } }}
        >
          Build Inspector
        </Typography>
        <Stack direction="row" component="nav" aria-label="Pagine" sx={{ gap: 0.5 }}>
          {LINKS.map((link) => (
            <Button
              key={link.to}
              component={NavLink}
              to={link.to}
              sx={{
                color: "white",
                minWidth: 0,
                whiteSpace: "nowrap",
                px: { xs: 0.75, sm: 1 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                "&.active": { bgcolor: "rgba(255,255,255,0.16)" },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="GitHub" enterNextDelay={1000} arrow>
          <IconButton href={REPO_URL} aria-label="Codice su GitHub" sx={{ color: "white" }}>
            <GitHubIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cambia tema" enterNextDelay={1000} arrow>
          <IconButton
            aria-label="Cambia tema"
            onClick={theme.toggleColorMode}
            sx={{ color: "white" }}
          >
            <ContrastIcon
              sx={{ transform: theme.mode === "light" ? "rotate(0turn)" : "rotate(0.5turn)" }}
            />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
