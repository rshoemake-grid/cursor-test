import styled, { css } from "styled-components";
import { Link } from "react-router-dom";

/* Aligns with tailwind.config.js primary + neutral grays */
const c = {
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray600: "#4b5563",
  gray700: "#374151",
  gray900: "#111827",
  white: "#ffffff",
  primary100: "#e0f2fe",
  primary500: "#0ea5e9",
  primary600: "#0284c7",
  primary700: "#0369a1",
};

const flexCenter = css`
  display: flex;
  align-items: center;
`;

export const LayoutRoot = styled.div`
  ${flexCenter};
  flex-direction: column;
  height: 100vh;
  background: ${c.gray50};
`;

export const Header = styled.header`
  background: ${c.white};
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  border-bottom: 1px solid ${c.gray200};
  padding: 1rem 1.5rem;
`;

export const HeaderInner = styled.div`
  ${flexCenter};
  justify-content: space-between;
`;

export const BrandRow = styled.div`
  ${flexCenter};
  gap: 0.75rem;
`;

export const LogoMark = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(to bottom right, ${c.primary500}, ${c.primary700});
  ${flexCenter};
  justify-content: center;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: ${c.white};
  }
`;

export const TitleBlock = styled.div``;

export const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${c.gray600};
`;

export const Nav = styled.nav`
  ${flexCenter};
  gap: 0.5rem;
`;

const navItemBase = css`
  ${flexCenter};
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font: inherit;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const NavTabButton = styled.button`
  ${navItemBase};
  color: ${c.gray600};
  background: transparent;

  &:hover {
    background: ${c.gray100};
  }

  ${(p) =>
    p.$active &&
    css`
      background: ${c.primary100};
      color: ${c.primary700};
      font-weight: 500;
    `}
`;

export const NavRouteLink = styled(Link)`
  ${navItemBase};
  color: ${c.gray600};
  background: transparent;

  &:hover {
    background: ${c.gray100};
  }

  ${(p) =>
    p.$active &&
    css`
      background: ${c.primary100};
      color: ${c.primary700};
      font-weight: 500;
    `}
`;

export const UserSection = styled.div`
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid ${c.gray300};
  ${flexCenter};
  gap: 0.5rem;
`;

export const UserBadge = styled.div`
  ${flexCenter};
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${c.gray100};
  border-radius: 0.5rem;

  svg {
    width: 1rem;
    height: 1rem;
    color: ${c.gray600};
  }
`;

export const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const LogoutButton = styled.button`
  padding: 0.5rem;
  color: ${c.gray600};
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${c.gray100};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const SignInLink = styled(Link)`
  ${flexCenter};
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${c.primary600};
  color: ${c.white};
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${c.primary700};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const Main = styled.main`
  flex: 1;
  overflow: hidden;
`;
