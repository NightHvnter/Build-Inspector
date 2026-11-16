import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

interface LoginComponentProps {}

export default function LoginComponent(_props: LoginComponentProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack>
        <Box>
          <Box>
            <Box sx={{ display: "flex", mt: 1, mx: 2 }}>
              <Box>
                <Typography variant="h4">Build Inspector</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 10, ml: 7.5, mr: 20 }}>
              <Typography sx={{ fontSize: "2rem" }}>Benvenuto in Build Inspector</Typography>
              <Typography sx={{ fontSize: "1rem", color: "text.secondary" }}>
                Piattaforma di analisi e ispezione senza autenticazione.
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ width: "50%" }}></Box>
      </Stack>
    </Box>
  );
}