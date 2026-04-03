import { Component } from "react";
import { RefreshCw, Home } from "lucide-react";
import { logger } from "../utils/logger";
import {
  ErrorFallbackShell,
  ErrorCard,
  ErrorHeaderRow,
  ErrorAlertIcon,
  ErrorHeading,
  ErrorLead,
  ErrorDetailsPanel,
  ErrorDetailsLabel,
  ErrorDetailsMessage,
  ErrorStackDetails,
  ErrorStackSummary,
  ErrorStackPre,
  ErrorActionsRow,
  ErrorPrimaryButton,
  ErrorSecondaryButton,
} from "./ErrorBoundary.styled";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReset = this.handleReset.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }

  handleGoHome() {
    window.location.href = "/";
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallbackShell>
          <ErrorCard>
            <ErrorHeaderRow>
              <ErrorAlertIcon aria-hidden />
              <ErrorHeading>Something went wrong</ErrorHeading>
            </ErrorHeaderRow>
            <ErrorLead>
              We&apos;re sorry, but something unexpected happened. Please try
              refreshing the page or returning to the home page.
            </ErrorLead>
            {this.state.error && (
              <ErrorDetailsPanel>
                <ErrorDetailsLabel>Error Details:</ErrorDetailsLabel>
                <ErrorDetailsMessage>
                  {this.state.error.toString()}
                </ErrorDetailsMessage>
                {process.env.NODE_ENV === "development" &&
                  this.state.errorInfo && (
                    <ErrorStackDetails>
                      <ErrorStackSummary>Stack Trace</ErrorStackSummary>
                      <ErrorStackPre>
                        {this.state.errorInfo.componentStack}
                      </ErrorStackPre>
                    </ErrorStackDetails>
                  )}
              </ErrorDetailsPanel>
            )}
            <ErrorActionsRow>
              <ErrorPrimaryButton type="button" onClick={this.handleReset}>
                <RefreshCw />
                Try Again
              </ErrorPrimaryButton>
              <ErrorSecondaryButton type="button" onClick={this.handleGoHome}>
                <Home />
                Go Home
              </ErrorSecondaryButton>
            </ErrorActionsRow>
          </ErrorCard>
        </ErrorFallbackShell>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary as default };
