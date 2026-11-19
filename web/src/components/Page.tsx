import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// The title block at the top of an inner page.
export function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="overline"
          color="primary"
          sx={{ fontWeight: 700, letterSpacing: 1.2, display: "block" }}
        >
          {eyebrow}
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 700 }}>
          {title}
        </Typography>
        {text && (
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
            {text}
          </Typography>
        )}
      </Container>
    </Box>
  );
}

// A content section with an optional heading.
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Container component="section" maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      {title && (
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>
      )}
      {children}
    </Container>
  );
}
