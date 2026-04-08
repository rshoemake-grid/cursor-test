import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API_CONFIG } from "../config/constants";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { defaultAdapters } from "../types/adapters";
import {
  AuthGradientShell,
  AuthCard,
  AuthHeroBlock,
  AuthHeading1,
  AuthLead,
  AuthFormStack,
  AuthErrorBanner,
  AuthFieldLabel,
  AuthTextInput,
  AuthPrimaryButton,
  AuthBackNavButton,
  AuthSuccessIconCircle,
  AuthDevTokenPanel,
  AuthDevTokenTitle,
  AuthDevTokenHint,
  AuthDevTokenCode,
  AuthDevTokenLink,
  AuthStack,
} from "../styles/authPages.styled";

function CheckIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

CheckIcon.propTypes = {};

function ForgotPasswordPage({
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL,
} = {}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
        {
          email,
        },
        {
          "Content-Type": "application/json",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          extractApiErrorMessage(errorData, "Failed to send reset email"),
        );
      }
      const data = await response.json();
      setSuccess(true);
      const isDev =
        typeof process !== "undefined" &&
        process.env?.NODE_ENV === "development";
      if (isDev && data.token) {
        setResetToken(data.token);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return (
      <AuthGradientShell>
        <AuthCard>
          <AuthHeroBlock $compact>
            <AuthSuccessIconCircle>
              <CheckIcon />
            </AuthSuccessIconCircle>
            <AuthHeading1>Check Your Email</AuthHeading1>
            <AuthLead>
              If an account with that email exists, we&apos;ve sent password reset
              instructions.
            </AuthLead>
            {resetToken && (
              <AuthDevTokenPanel>
                <AuthDevTokenTitle>Development Mode:</AuthDevTokenTitle>
                <AuthDevTokenHint>Reset Token:</AuthDevTokenHint>
                <AuthDevTokenCode>{resetToken}</AuthDevTokenCode>
                <AuthDevTokenLink
                  type="button"
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                >
                  Click here to reset password
                </AuthDevTokenLink>
              </AuthDevTokenPanel>
            )}
          </AuthHeroBlock>
          <AuthStack>
            <AuthPrimaryButton type="button" onClick={() => navigate("/auth")}>
              Back to Login
            </AuthPrimaryButton>
          </AuthStack>
        </AuthCard>
      </AuthGradientShell>
    );
  }
  return (
    <AuthGradientShell>
      <AuthCard>
        <AuthBackNavButton type="button" onClick={() => navigate("/auth")}>
          <ArrowLeft aria-hidden />
          Back to Login
        </AuthBackNavButton>
        <AuthHeroBlock>
          <AuthHeading1 $size="lg">Forgot Password?</AuthHeading1>
          <AuthLead>
            Enter your email address and we&apos;ll send you a link to reset your
            password.
          </AuthLead>
        </AuthHeroBlock>
        <AuthFormStack onSubmit={handleSubmit}>
          {error && <AuthErrorBanner>{error}</AuthErrorBanner>}
          <div>
            <AuthFieldLabel htmlFor="forgot-email">Email Address</AuthFieldLabel>
            <AuthTextInput
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={true}
              autoFocus={true}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="your@email.com"
            />
          </div>
          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </AuthPrimaryButton>
        </AuthFormStack>
      </AuthCard>
    </AuthGradientShell>
  );
}

ForgotPasswordPage.propTypes = {
  httpClient: PropTypes.object,
  apiBaseUrl: PropTypes.string,
};

export { ForgotPasswordPage as default };
