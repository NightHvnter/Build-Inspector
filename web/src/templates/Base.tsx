import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Appbar } from "../components";
import { REPO_URL } from "../downloads";

export default function Base() {
  return (
    <>
      <Appbar />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 4 }}>
        <Container
          maxWidth="lg"
          sx={{ py: 2, display: "flex", gap: 2, justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Build Inspector
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dati dei giochi da Steam · Punteggi da PassMark ·{" "}
            <Link href={REPO_URL} underline="hover" color="inherit">
              GitHub
            </Link>
          </Typography>
        </Container>
      </Box>
    </>
  );
}
