import { Box, AppBar, Toolbar, IconButton, Button } from "@mui/material";
import ContrastIcon from '@mui/icons-material/Contrast';
import { useTheme } from "../hooks";

export default function Appbar() {

  const theme = useTheme()

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Button color="inherit" variant="contained">Login</Button>
        <Box sx={{ flexGrow: 1 }}></Box>
        <IconButton
          aria-label="toggle theme"
          onClick={theme.toggleColorMode}
          color="primary"
      >
          <ContrastIcon sx={{ color: "white" }} />
      </IconButton>
      </Toolbar>
    </AppBar>
  );
}
