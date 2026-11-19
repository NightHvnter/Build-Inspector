import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import TerminalIcon from "@mui/icons-material/Terminal";
import SettingsIcon from "@mui/icons-material/Settings";
import { DOWNLOADS, RELEASES_URL, detectPlatform, type Platform } from "../downloads";
import { PageHeader, Section } from "../components/Page";

const ICONS: Record<Platform, typeof DesktopWindowsIcon> = {
  windows: DesktopWindowsIcon,
  macos: LaptopMacIcon,
  linux: TerminalIcon,
};

// /download: the installer for the visitor's system first, then the others.
export default function Download() {
  const detected = detectPlatform(navigator.userAgent);
  const ordered = [...DOWNLOADS].sort(
    (a, b) => Number(b.platform === detected) - Number(a.platform === detected),
  );

  return (
    <>
      <PageHeader
        eyebrow="Download"
        title="Scarica Build Inspector"
        text="L’app è gratuita. Scegli il tuo sistema operativo: il file viene scaricato dall’ultima release su GitHub."
      />
      <Section>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {ordered.map((download) => {
            const Icon = ICONS[download.platform];
            const yours = download.platform === detected;
            return (
              <Paper
                key={download.platform}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  borderColor: yours ? "primary.main" : "divider",
                  borderWidth: yours ? 2 : 1,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Icon color="primary" fontSize="large" />
                  <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                    {download.name}
                  </Typography>
                  {yours && <Chip size="small" color="primary" label="Il tuo sistema" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {download.requirements}
                </Typography>
                <Button
                  href={download.url}
                  variant={yours ? "contained" : "outlined"}
                  size="large"
                  startIcon={<DownloadIcon />}
                  sx={{ mt: "auto" }}
                >
                  Scarica per {download.name}
                </Button>
                {download.extra && (
                  <Link href={download.extra.url} variant="body2" underline="hover">
                    {download.extra.label}
                  </Link>
                )}
                <Typography variant="caption" color="text.secondary">
                  {download.firstLaunch}
                </Typography>
              </Paper>
            );
          })}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Versioni precedenti e note di rilascio su{" "}
          <Link href={RELEASES_URL} underline="hover">
            GitHub
          </Link>
          .
        </Typography>
      </Section>

      <Section title="Primo avvio">
        <Alert severity="info" icon={<SettingsIcon />} sx={{ borderRadius: 2 }}>
          L’app si collega a un server Build Inspector per giochi, account e cronologia. Se ti hanno
          dato un indirizzo (per esempio <code>https://….trycloudflare.com</code>), aprilo in{" "}
          <strong>Impostazioni › Indirizzo del server</strong>, premi “Verifica” e poi “Salva e
          riavvia”.
        </Alert>
      </Section>
    </>
  );
}
