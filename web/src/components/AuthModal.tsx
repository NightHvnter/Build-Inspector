import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import { CheckCircleOutlined as CheckCircleOutlinedIcon } from '@mui/icons-material';
interface AuthModalProps {
  AuthType: string;
  Open: boolean;
  HandleClose: () => void;
}

export default function AuthModal(props: AuthModalProps) {
  return (
    <Modal open={props.Open} onClose={props.HandleClose}>
      <Box sx={{ width: "100vh", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Card
            elevation={8}
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row-reverse",
              },
              borderRadius: 5,
              overflow: "hidden",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* CONTENT SIDE CONTAINER */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3, sm: 5, md: 6 },
              transition: "all 0.4s ease-in-out",
            }}
          >
            <Fade in={true} timeout={400}>
              <Box>
                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "primary.main",
                    color: "white",
                    mb: 2,
                    boxShadow: "0 8px 16px rgba(99, 102, 241, 0.25)",
                    backgroundColor: theme.palette.background.paper
                  })}
                >
                  <CheckCircleOutlinedIcon fontSize="small" />
                </Paper>

                <Typography variant="h4" sx={{ color: "text.primary" }}>
                  Benvenuto
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Esplora l'applicazione e scopri le funzionalità disponibili senza bisogno di autenticazione.
                </Typography>
              </Box>
            </Fade>
          </Box>

          {/* PICTURE PANEL */}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              minHeight: { xs: 260, md: "auto" },
              backgroundImage: 'url("https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              p: { xs: 4, md: 6 },
              color: "white",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 100%)",
              },
            }}
          >
            <Fade in={true} timeout={500}>
              <Box sx={{ position: "relative", zIndex: 1, maxWidth: 400 }}>
                <Typography
                  variant="overline"
                  sx={{ fontWeight: 700 }}
                  color="primary.light"
                >
                  WELCOME
                </Typography>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ mt: 1, fontWeight: 600 }}
                >
                  Start your creative journey today.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.85, mb: 3, lineHeight: 1.6 }}
                >
                  Access all metrics, tools, and seamless features directly without credentials.
                </Typography>
              </Box>
            </Fade>
          </Box>
        </Card>
      </Box>
    </Modal>
  );
}
