import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
  AuthPasswordFieldWrap,
  AuthTextInputWithIconPadding,
  AuthPasswordToggle,
  AuthPrimaryButton,
  AuthLinkRow,
  AuthModeToggle,
  AuthGhostLink,
  AuthRememberRow,
  AuthCheckboxRow,
  AuthCheckbox,
  AuthCheckboxLabel,
  AuthInlineLinkButton,
} from "../styles/authPages.styled";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password, rememberMe);
      } else {
        await register(username, email, password, fullName);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthGradientShell>
      <AuthCard>
        <AuthHeroBlock>
          <AuthHeading1 $size="lg">
            {isLogin ? "Welcome Back" : "Create Account"}
          </AuthHeading1>
          <AuthLead>
            {isLogin
              ? "Sign in to your workflow account"
              : "Start building amazing workflows"}
          </AuthLead>
        </AuthHeroBlock>
        <AuthFormStack onSubmit={handleSubmit}>
          {error && <AuthErrorBanner>{error}</AuthErrorBanner>}
          <div>
            <AuthFieldLabel htmlFor="auth-username">Username</AuthFieldLabel>
            <AuthTextInput
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={true}
              autoFocus={true}
              placeholder="Enter your username"
            />
          </div>
          {!isLogin && (
            <>
              <div>
                <AuthFieldLabel htmlFor="auth-email">Email</AuthFieldLabel>
                <AuthTextInput
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={true}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <AuthFieldLabel htmlFor="auth-fullname">
                  Full Name (optional)
                </AuthFieldLabel>
                <AuthTextInput
                  id="auth-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </>
          )}
          <div>
            <AuthFieldLabel htmlFor="auth-password">Password</AuthFieldLabel>
            <AuthPasswordFieldWrap>
              <AuthTextInputWithIconPadding
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={true}
                minLength={6}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
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
          {isLogin && (
            <AuthRememberRow>
              <AuthCheckboxRow>
                <AuthCheckbox
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <AuthCheckboxLabel htmlFor="rememberMe">
                  Keep me logged in
                </AuthCheckboxLabel>
              </AuthCheckboxRow>
              <AuthInlineLinkButton
                type="button"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </AuthInlineLinkButton>
            </AuthRememberRow>
          )}
          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </AuthPrimaryButton>
        </AuthFormStack>
        <AuthLinkRow>
          <AuthModeToggle
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </AuthModeToggle>
        </AuthLinkRow>
        <AuthLinkRow>
          <AuthGhostLink type="button" onClick={() => navigate("/")}>
            ← Continue without signing in
          </AuthGhostLink>
        </AuthLinkRow>
      </AuthCard>
    </AuthGradientShell>
  );
}

AuthPage.propTypes = {};

export { AuthPage as default };
