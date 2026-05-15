import type { CSSProperties } from "react";

export const pageShell: CSSProperties = {
  maxWidth: "1040px",
  margin: "0 auto",
  padding: "0 20px 40px",
};

export const narrowPageShell: CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "0 20px 40px",
};

export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #d7d7d7",
  borderRadius: "8px",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
};

export const cardPadding: CSSProperties = {
  ...card,
  padding: "20px",
};

export const mutedText: CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.5",
};

export const sectionTitle: CSSProperties = {
  margin: "0 0 6px",
  color: "#111827",
  fontSize: "18px",
  fontWeight: 750,
  lineHeight: "1.25",
};

export const primaryButton: CSSProperties = {
  alignItems: "center",
  background: "#111827",
  border: "1px solid #111827",
  borderRadius: "8px",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: "14px",
  fontWeight: 700,
  justifyContent: "center",
  minHeight: "38px",
  padding: "0 16px",
  textDecoration: "none",
};

export const secondaryButton: CSSProperties = {
  ...primaryButton,
  background: "#fff",
  border: "1px solid #d7d7d7",
  color: "#111827",
};

export const badge: CSSProperties = {
  alignItems: "center",
  borderRadius: "999px",
  display: "inline-flex",
  fontSize: "11px",
  fontWeight: 800,
  minHeight: "24px",
  padding: "0 9px",
};
