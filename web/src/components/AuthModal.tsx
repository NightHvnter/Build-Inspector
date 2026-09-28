import { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlined from '@mui/icons-material/LockOutlined'
interface AuthModalProps {
  AuthType: string;
  Open: boolean;
  HandleClose: () => void;
}

export default function AuthModal(props: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false); // Controls toggle between Login (false) and Sign Up (true)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Submission & Loading feedback states
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to toggle between Login and Sign Up modes with animation trigger
  const handleToggleMode = () => {
    setIsSignUp((prev) => !prev);
    // Reset validation and submission states when switching mode
    setSubmitted(false);
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Il campo emaill è obbligatorio";
    if (!emailRegex.test(value)) return "Perfavore inserisci un indirizzo email valido";
    return "";
  };

  const validatePassword = (value: string | any[]) => {
    if (!value) return "Il campo password è obbligatorio";
    if (value.length < 6) return "La password deve essere lunga almeno 6 caratteri";
    return "";
  };

  const validateName = (value: string) => {
    if (isSignUp && !value.trim()) return "Full name is required";
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (isSignUp) {
      if (!value) return "Perfavore conferma la tua password";
      if (value !== password) return "Le password non corrispondono";
    }
    return "";
  };

  // Handler for form submission (shared for both Login and Sign Up)
  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    // Check if there are no errors before proceeding with submission
    if (!emailErr && !passwordErr && (!isSignUp || (!nameErr && !confirmErr))) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 1200);
    }
  };

  return (
    <Modal open={props.Open} onClose={props.HandleClose}>
      <Box sx={{ width: "100vh", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Card
            elevation={8}
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                md: isSignUp ? "row-reverse" : "row",
              },
              borderRadius: 5,
              overflow: "hidden",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              transition: "flex-direction 0.4s ease-in-out",
            }}
          >
            {/* ========================================== */}
            {/* LEFT/FORM SIDE CONTAINER (LOGIN & SIGN UP) */}
            {/* ========================================== */}
            <Box
              sx={{
                flex: 1,
                p: { xs: 3, sm: 5, md: 6 },
                transition: "all 0.4s ease-in-out",
              }}
            >
              <Fade
                in={true}
                timeout={400}
                key={isSignUp ? "signup-form" : "login-form"}
              >
                <Box>
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
                        bgcolor: isSignUp ? "secondary.main" : "primary.main",
                        color: "white",
                        mb: 2,
                        boxShadow: isSignUp
                          ? "0 8px 16px rgba(236, 72, 153, 0.25)"
                          : "0 8px 16px rgba(99, 102, 241, 0.25)",
                        transition: "background-color 0.4s ease",
                        backgroundColor: theme.palette.background.paper
                      })}
                      
                    >
                      <LockOutlined fontSize="small" />
                    </Paper>

                    {/* Dynamic Title based on current mode (Login vs Sign Up) */}
                    <Typography variant="h4" sx={{color: "text.primary"}}>
                      {isSignUp
                        ? "Crea account"
                        : "Ben tornato!"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isSignUp
                        ? "Compila tutti i campi per creare un nuovo account"
                        : "Perfavore inserisci le tue credenziali per accedere al tuo account"}
                    </Typography>
                  </Box>

                  {submitted ? (
                    <Fade in={submitted}>
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <CheckCircleOutlinedIcon
                          color="success"
                          sx={{ fontSize: 64, mb: 2 }}
                        />
                        <Typography variant="h5" sx={{fontWeight: 700}} gutterBottom>
                          {isSignUp
                            ? "Registrazione completata!"
                            : "Accesso effettuato!"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          {isSignUp
                            ? `Benvenuto, ${email}! Il tuo account è stato creato.`
                            : `Bentornato, ${email}. Sei stato autenticato.`}
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => setSubmitted(false)}
                          sx={{ textTransform: "none", fontWeight: 600, px: 4 }}
                        >
                          Torna al form
                        </Button>
                      </Box>
                    </Fade>
                  ) : (
                    /* ========================================== */
                    /* START OF INPUT FORM (HANDLES BOTH VIEWS)   */
                    /* ========================================== */
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                      {/* --- SIGN UP ONLY FIELD: Full Name --- */}
                      {isSignUp && (
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          id="name"
                          label="Full Name"
                          name="name"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (nameError)
                              setNameError(validateName(e.target.value));
                          }}
                          error={Boolean(nameError)}
                          helperText={nameError}
                          sx={{ mb: 1.5 }}
                        />
                      )}

                      {/* --- COMMON FIELD: Email Address (Used in Login & Sign Up) --- */}
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError)
                            setEmailError(validateEmail(e.target.value));
                        }}
                        error={Boolean(emailError)}
                        helperText={emailError}
                        sx={{ mb: 1.5 }}
                      />

                      {/* --- COMMON FIELD: Password (Used in Login & Sign Up) --- */}
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        id="password"
                        autoComplete={
                          isSignUp ? "new-password" : "current-password"
                        }
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError)
                            setPasswordError(validatePassword(e.target.value));
                        }}
                        error={Boolean(passwordError)}
                        helperText={passwordError}
                        sx={{ mb: 1.5 }}
                      />

                      {/* --- SIGN UP ONLY FIELD: Confirm Password --- */}
                      {isSignUp && (
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="confirmPassword"
                          label="Conferma Password"
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (confirmPasswordError)
                              setConfirmPasswordError(
                                validateConfirmPassword(e.target.value),
                              );
                          }}
                          error={Boolean(confirmPasswordError)}
                          helperText={confirmPasswordError}
                          sx={{ mb: 1.5 }}
                        />
                      )}

                      {/* --- LOGIN ONLY EXTRAS: Remember Me & Forgot Password --- */}
                      {!isSignUp && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            my: 1,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={rememberMe}
                                onChange={(e) =>
                                  setRememberMe(e.target.checked)
                                }
                                color="primary"
                                size="small"
                              />
                            }
                            label={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Remember me
                              </Typography>
                            }
                          />
                          <Link
                            href="#"
                            variant="body2"
                            underline="hover"
                            onClick={(e: { preventDefault: () => any; }) => e.preventDefault()}
                          >
                            Forgot password?
                          </Link>
                        </Box>
                      )}

                      {/* --- SUBMIT BUTTON (Ends Login/Sign Up Form) --- */}
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        color={isSignUp ? "secondary" : "primary"}
                        sx={{
                          py: 1.5,
                          mt: 2,
                          mb: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "1rem",
                          boxShadow: isSignUp
                            ? "0 4px 14px rgba(236, 72, 153, 0.35)"
                            : "0 4px 14px rgba(99, 102, 241, 0.35)",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            boxShadow: isSignUp
                              ? "0 6px 20px rgba(236, 72, 153, 0.5)"
                              : "0 6px 20px rgba(99, 102, 241, 0.5)",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        {loading
                          ? isSignUp
                            ? "Creating account..."
                            : "Signing in..."
                          : isSignUp
                            ? "Create Account"
                            : "Sign In"}
                      </Button>
                    </Box>
                    /* ========================================== */
                    /* END OF INPUT FORM                          */
                    /* ========================================== */
                  )}
                </Box>
              </Fade>
            </Box>

            {/* Central Divider & Interactive Switch Button (Desktop Only Layout Feature) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: 0,
                zIndex: 2,
              }}
            >
              <Box
                onClick={handleToggleMode}
                sx={{
                  position: "absolute",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "white",
                  border: "2px solid",
                  borderColor: isSignUp ? "secondary.main" : "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: isSignUp ? "secondary.main" : "primary.main",
                    color: "white",
                    transform: "scale(1.15) rotate(180deg)",
                  },
                  color: isSignUp ? "secondary.main" : "primary.main",
                }}
                title={isSignUp ? "Switch to Login" : "Switch to Sign Up"}
              >
                <SwapHorizIcon fontSize="medium" />
              </Box>
            </Box>

            {/* ========================================== */}
            {/* RIGHT SIDE: PICTURE PANEL WITH VIEW SWITCH */}
            {/* ========================================== */}
            <Box
              sx={{
                flex: 1,
                position: "relative",
                minHeight: { xs: 260, md: "auto" },
                // Smoothly swap background image or keep cohesive high performance visuals during slide animation
                backgroundImage: isSignUp
                  ? 'url("https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop")'
                  : 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop")',
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                p: { xs: 4, md: 6 },
                color: "white",
                transition: "background-image 0.6s ease-in-out",
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
              <Fade
                in={true}
                timeout={500}
                key={isSignUp ? "signup-banner" : "login-banner"}
              >
                <Box sx={{ position: "relative", zIndex: 1, maxWidth: 400 }}>
                  <Typography
                    variant="overline"
                    sx={{fontWeight: 700}}
                    color={isSignUp ? "secondary.light" : "primary.light"}
                  >
                    {isSignUp
                      ? "JOIN OUR COMMUNITY"
                      : "WELCOME BACK EXPERIENCES"}
                  </Typography>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ mt: 1, fontWeight: 600 }}
                  >
                    {isSignUp
                      ? "Start your creative journey today."
                      : "Discover high performance workflows."}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85, mb: 3, lineHeight: 1.6 }}
                  >
                    {isSignUp
                      ? "Unlock full access to custom metrics, tools, and seamless collaborations designed to accelerate your growth."
                      : "Log back in to keep track of your analytics, projects, and engage directly with your team."}
                  </Typography>

                  {/* Mobile / Direct switch action banner button */}
                  <Button
                    variant="contained"
                    onClick={handleToggleMode}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(10px)",
                      color: "white",
                      textTransform: "none",
                      fontWeight: 600,
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.25)",
                      },
                    }}
                  >
                    {isSignUp
                      ? "Already have an account? Sign In"
                      : "Don't have an account? Sign Up"}
                  </Button>
                </Box>
              </Fade>
            </Box>
          </Card>
      </Box>
    </Modal>
  );
}
