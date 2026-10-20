"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  EASE,
  MotionBox,
  MotionStack,
  StaggerItem,
  containerVariants,
} from "@/components/motion";
import { AQUA, AZUL, INK, LINE } from "@/lib/brand";
import { login } from "./actions";

const REMEMBER_KEY = "lumayo:login-email";

// Remembered email lives only in this browser; storage can be unavailable (private mode), so never throw.
function readRemembered() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}
function writeRemembered(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Ignore: remembering the email is a convenience.
  }
}
const noopSubscribe = () => () => {};

// Flat brand surfaces: a single soft shadow only hints at separation (Brandbook V2).
const CARD_SHADOW =
  "0 1px 2px rgba(26,47,81,0.06), 0 24px 48px -28px rgba(26,47,81,0.28)";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    transition: "box-shadow .2s ease",
    "& fieldset": { borderColor: LINE },
    "&:hover fieldset": { borderColor: AZUL[300] },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(35,100,194,0.12)" },
    "&.Mui-focused fieldset": { borderColor: AZUL[700], borderWidth: 1.5 },
  },
  // Browser autofill paints its own background; keep the field white and the text on brand.
  "& input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 100px #fff inset",
    WebkitTextFillColor: INK[900],
    caretColor: INK[900],
    borderRadius: "inherit",
  },
};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // Server renders "", the browser reads storage after hydration.
  const remembered = useSyncExternalStore(
    noopSubscribe,
    readRemembered,
    () => "",
  );
  const initialEmail = state?.email ?? remembered;

  function rememberOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    writeRemembered(
      data.get("remember") ? String(data.get("email") ?? "").trim() : null,
    );
  }

  const checkCaps = (e: React.KeyboardEvent) =>
    setCapsLock(e.getModifierState("CapsLock"));

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 4 },
        bgcolor: AZUL[50],
      }}
    >
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        sx={{
          width: "100%",
          maxWidth: { xs: 420, md: 960 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          bgcolor: "#fff",
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid ${LINE}`,
          boxShadow: CARD_SHADOW,
        }}
      >
        <Box sx={{ px: { xs: 3, sm: 6 }, py: { xs: 5, sm: 7 } }}>
          <Box component="form" action={action} onSubmit={rememberOnSubmit}>
            <MotionStack
              variants={containerVariants}
              initial="hidden"
              animate="show"
              spacing={3}
            >
              <StaggerItem>
                <Box
                  component="img"
                  src="/images/lumayo-logo.svg"
                  alt="Lumayo"
                  sx={{ display: "block", width: 128, height: "auto" }}
                />
              </StaggerItem>

              <StaggerItem>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 26, sm: 30 },
                    fontWeight: 400,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                    color: AZUL[950],
                  }}
                >
                  Bienvenido de{" "}
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    vuelta
                  </Box>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Ingresa con tu correo y contraseña.
                </Typography>
              </StaggerItem>

              <StaggerItem>
                <Stack spacing={2.5}>
                  {/* Labels sit above the field (not floating inside it), so they never stick to the input edge. */}
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="login-email"
                      variant="body2"
                      sx={{
                        display: "block",
                        mb: 0.75,
                        fontWeight: 600,
                        color: INK[900],
                      }}
                    >
                      Correo
                    </Typography>
                    <TextField
                      id="login-email"
                      key={`email-${initialEmail}`}
                      name="email"
                      type="email"
                      placeholder="tu@lumayo.pe"
                      defaultValue={initialEmail}
                      required
                      fullWidth
                      autoFocus={!initialEmail}
                      autoComplete="username"
                      sx={fieldSx}
                    />
                  </Box>
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="login-password"
                      variant="body2"
                      sx={{
                        display: "block",
                        mb: 0.75,
                        fontWeight: 600,
                        color: INK[900],
                      }}
                    >
                      Contraseña
                    </Typography>
                    <TextField
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      fullWidth
                      autoFocus={!!initialEmail}
                      autoComplete="current-password"
                      onKeyDown={checkCaps}
                      onKeyUp={checkCaps}
                      onBlur={() => setCapsLock(false)}
                      sx={fieldSx}
                      helperText={
                        capsLock ? "Bloq Mayús está activado" : undefined
                      }
                      slotProps={{
                        formHelperText: {
                          sx: { color: "#c26a12", fontWeight: 600, mx: 0 },
                        },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => setShowPassword((v) => !v)}
                                onMouseDown={(e) => e.preventDefault()}
                                aria-label={
                                  showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                                }
                                aria-pressed={showPassword}
                                sx={{ color: INK[400] }}
                              >
                                {showPassword ? (
                                  <VisibilityOffRoundedIcon fontSize="small" />
                                ) : (
                                  <VisibilityRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                  <FormControlLabel
                    key={`remember-${remembered}`}
                    control={
                      <Checkbox
                        name="remember"
                        defaultChecked={remembered !== ""}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Recordar mi correo
                      </Typography>
                    }
                    sx={{ mt: -0.5 }}
                  />
                </Stack>
              </StaggerItem>

              <Box aria-live="polite" sx={{ "&:empty": { display: "none" } }}>
                {state?.error && (
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: [0, -8, 8, -6, 6, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Alert severity="error">{state.error}</Alert>
                  </motion.div>
                )}
              </Box>

              <StaggerItem>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={pending}
                  fullWidth
                  sx={{
                    py: 1.4,
                    fontSize: 15,
                    bgcolor: AZUL[700],
                    boxShadow: "0 8px 20px -12px rgba(35,100,194,0.8)",
                    "&:hover": {
                      bgcolor: AZUL[800],
                      boxShadow: "0 10px 24px -12px rgba(35,100,194,0.9)",
                    },
                    "&.Mui-disabled": {
                      color: "#fff",
                      bgcolor: AZUL[700],
                      opacity: 0.75,
                    },
                  }}
                >
                  {pending ? (
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                      <span>Ingresando...</span>
                    </Stack>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </StaggerItem>

              <StaggerItem>
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: INK[400] }}
                >
                  ¿Problemas para ingresar? Consulta con el administrador.
                </Typography>
              </StaggerItem>
            </MotionStack>
          </Box>
        </Box>

        {/* Brand panel: photo under a flat brand-blue veil, one message. */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            position: "relative",
            alignItems: "flex-end",
            p: 6,
            color: "#fff",
            minHeight: 560,
            bgcolor: AZUL[700],
          }}
        >
          <MotionBox
            aria-hidden
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: EASE }}
            sx={{ position: "absolute", inset: 0 }}
          >
            <Image
              src="/images/login-dentists.jpg"
              alt=""
              fill
              sizes="480px"
              priority
              style={{ objectFit: "cover", objectPosition: "50% 30%" }}
            />
          </MotionBox>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, rgba(35,100,194,0.55) 0%, rgba(35,100,194,0.72) 50%, ${AZUL[900]} 100%)`,
            }}
          />
          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
            sx={{ position: "relative" }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: AQUA[300],
              }}
            >
              Centro Odontológico
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontSize: 34,
                fontWeight: 400,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              Tu sonrisa nos inspira a dar{" "}
              <Box component="span" sx={{ fontWeight: 800 }}>
                el primer paso.
              </Box>
            </Typography>
          </MotionBox>
        </Box>
      </MotionBox>
    </Box>
  );
}
