import ContrastIcon from "@mui/icons-material/Contrast";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MemoryIcon from "@mui/icons-material/Memory";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks";
import { useUser } from "../hooks/useUser";
import AuthModal from "./AuthModal";

export default function Appbar() {
  const theme = useTheme();
  const nativigate = useNavigate();
  const user = useUser();

  return (
    <>
      <AppBar position="static" color="primary" elevation={6}>
        <Toolbar>
          <Stack direction={"row"} sx={{ gap: 1 }}>
            <Tooltip title="Home" enterNextDelay={1000} arrow>
              <IconButton
                onClick={() => {
                  nativigate("/");
                }}
              >
                <MemoryIcon fontSize="large" sx={{ color: "white" }} />
              </IconButton>
            </Tooltip>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                nativigate("/explore");
              }}
            >
              Explore
            </Button>
            <Button color="primary" variant="contained">
              Download
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                nativigate("/about-us");
              }}
            >
              About Us
            </Button>
          </Stack>

          <Box sx={{ flexGrow: 1 }}></Box>

          <Tooltip title="Account" enterNextDelay={1000} arrow>
            <IconButton>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Change theme" enterNextDelay={1000} arrow>
            <IconButton
              aria-label="toggle theme"
              onClick={theme.toggleColorMode}
            >
              <ContrastIcon
                sx={{
                  transform:
                    theme.mode == "light" ? "rotate(0turn)" : "rotate(0.5turn)",
                }}
              />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <AuthModal Open={user.Open} HandleClose={user.HandleClose} AuthType={"login"}></AuthModal>
    </>
  );
}
