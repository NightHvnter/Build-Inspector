import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from '@mui/material/TextField';
interface LoginComponentProps {}

export default function LoginComponent(props: LoginComponentProps) {
  return (
    <Box sx={{width: "100%"}}>
      <Stack>
        <Box sx={{ position: "relative" }}>
          <Box sx={{ display: "flex", position: "relative", top: 0 }}>
            <Box>
              <Typography variant="h3">Build Inspector</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
          </Box>
          <Box>
            <TextField></TextField>
          </Box>
        </Box>
        <Box sx={{ width: "50%" }}></Box>
      </Stack>
    </Box>
  );
}
