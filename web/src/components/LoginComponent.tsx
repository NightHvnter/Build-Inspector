import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
interface LoginComponentProps {}

export default function LoginComponent(props: LoginComponentProps) {
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
            <Box sx={{ mt: 10, ml: 7.5, mr: 20}}>
              <Typography sx={{ fontSize: "2rem" }}>Ben tornato!</Typography>
              <Typography sx={{ fontSize: "1rem" }}>
                Perfavore, accedi al tuo account
              </Typography>
              <Box>
                <TextField></TextField>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ width: "50%" }}></Box>
      </Stack>
    </Box>
  );
}
