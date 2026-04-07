import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  AuthPrimaryButton,
  AuthBackNavButton,
  AuthSuccessIconCircle,
  AuthPasswordFieldWrap,
  AuthTextInputWithIconPadding,
  AuthPasswordToggle,
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

function ResetPasswordPage({
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL,
} = {}) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
    }
  }, [token]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Reset token is missing");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}`,
        {
          token,
          new_password: password,
        },
        {
          "Content-Type": "application/json",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          extractApiErrorMessage(errorData, "Failed to reset password"),
        );
      }
      setSuccess(true);
      setTimeout(() => {
        navigate("/auth");
      }, 2e3);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to reset password"));
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
            <AuthHeading1>Password Reset Successful!</AuthHeading1>
            <AuthLead>
              Your password has been reset. Redirecting to login...
            </AuthLead>
          </AuthHeroBlock>
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
          <AuthHeading1 $size="lg">Reset Password</AuthHeading1>
          <AuthLead>Enter your new password below.</AuthLead>
        </AuthHeroBlock>
        <AuthFormStack onSubmit={handleSubmit}>
          {error && <AuthErrorBanner>{error}</AuthErrorBanner>}
          <div>
            <AuthFieldLabel htmlFor="reset-password">New Password</AuthFieldLabel>
            <AuthPasswordFieldWrap>
              <AuthTextInputWithIconPadding
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={true}
                minLength={6}
                autoFocus={true}
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              />
              <AuthPasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </AuthPasswordToggle>
            </AuthPasswordFieldWrap>
          </div>
          <div>
            <AuthFieldLabel htmlFor="reset-password-confirm">
              Confirm New Password
            </AuthFieldLabel>
            <AuthPasswordFieldWrap>
              <AuthTextInputWithIconPadding
                id="reset-password-confirm"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={true}
                minLength={6}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading && token) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              />
              <AuthPasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </AuthPasswordToggle>
            </AuthPasswordFieldWrap>
          </div>
          <AuthPrimaryButton type="submit" disabled={loading || !token}>
            {loading ? "Resetting..." : "Reset Password"}
          </AuthPrimaryButton>
        </AuthFormStack>
      </AuthCard>
    </AuthGradientShell>
  );
}
export { ResetPasswordPage as default };
