import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "../hooks";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <Box sx={{ height: "80vh", display: "flex", alignItems: "center" }}>
        <Stack
          direction={"row"}
          sx={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              maxWidth: "20vw",
              transform: "translateX(40px) translateY(100px)",
            }}
          >
            <Box
              sx={{
                border: 1,
                borderRadius: 1,
                padding: 5,
              }}
            >
              <Typography variant="h5">Ops, pagina non trovata</Typography>
              <Typography>
                Sembra proprio che la pagina non sia ancora stata buildata...
              </Typography>
            </Box>
            <Button
              color="primary"
              variant="contained"
              sx={{
                width: "100%",
                mt: 1
              }}

              onClick={() => {navigate("/")}}
            >
              torna alla home
            </Button>
          </Box>

          <Box
            sx={{
              border: 1,
              borderRadius: 1,
              padding: 10,
              py: 20,
            }}
          >
            <Typography sx={{ fontSize: "10rem" }}>404</Typography>
          </Box>
          <Box sx={{ width: "50vh" }}></Box>
        </Stack>
      </Box>
    </>
  );
}
