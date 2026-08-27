import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useNavigate, useRouteError, useFetcher, Form } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { requireEntitlements, getEntitlements } from "../services/billing.server";
import { getServerT } from "../i18n";
import { useT } from "../i18n/context";
import { fetchBranding, saveBranding, type FtcBranding } from "../utils/shopify-graphql";
import {
  card,
  cardPadding,
  mutedText,
  pageShell,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from "../styles/ui";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { isPremium } = await requireEntitlements(session.shop, request);
  // Branding is Premium-only. Keep `branding` present (empty) when locked so the
  // component's hooks stay stable; the JSX renders an upgrade prompt instead.
  if (!isPremium) return { locked: true as const, branding: {} as FtcBranding };
  const branding = await fetchBranding(admin);
  return { locked: false as const, branding };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const t = getServerT(request);
  if (request.method !== "POST") return { success: false, error: t("branding.error.invalidMethod") };

  const { admin, session } = await authenticate.admin(request);
  const { isPremium } = await getEntitlements(session.shop);
  if (!isPremium) {
    return { success: false, error: t("branding.error.premium") };
  }

  try {
    const formData = await request.formData();
    const logoImageUrl = (formData.get("logoImageUrl") as string) || undefined;
    const bubbleBgColor  = (formData.get("bubbleBgColor") as string) || "#111827";
    const bubbleMode       = (formData.get("bubbleMode") as string) === "logo" ? "logo" : "product";

    const branding: FtcBranding = {
      ...(logoImageUrl ? { logoImageUrl } : {}),
      bubbleBgColor,
      bubbleMode,
    };

    await saveBranding(admin, branding);
    return { success: true, error: null };
  } catch (err: any) {
    console.error("[FlyToCart] Branding save failed:", err?.message);
    return { success: false, error: err?.message || t("branding.error.saveFailed") };
  }
};

export default function BrandingPage() {
  const { branding, locked } = useLoaderData<typeof loader>();
  const actionData    = useActionData<typeof action>();
  const navigation    = useNavigation();
  const navigate      = useNavigate();
  const shopify       = useAppBridge();
  const t             = useT();
  const uploadFetcher = useFetcher<{ url?: string; error?: string }>();

  const isSaving    = navigation.state === "submitting";
  const isUploading = uploadFetcher.state !== "idle";

  const [logoUrl,      setLogoUrl]      = useState<string>(branding.logoImageUrl || "");
  const [logoFileName, setLogoFileName] = useState<string>(() => {
    if (branding.logoImageUrl) {
      const parts = branding.logoImageUrl.split("/");
      return parts[parts.length - 1]?.split("?")[0] || "Saved logo";
    }
    return "";
  });
  const [bgColor,      setBgColor]      = useState<string>(branding.bubbleBgColor || "#111827");
  const [bubbleMode,   setBubbleMode]   = useState<'product' | 'logo'>(branding.bubbleMode || "product");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state from loader whenever branding data changes (e.g. after save re-runs the loader)
  useEffect(() => {
    setLogoUrl(branding.logoImageUrl || "");
    setBgColor(branding.bubbleBgColor || "#111827");
    setBubbleMode(branding.bubbleMode || "product");
    if (branding.logoImageUrl) {
      const parts = branding.logoImageUrl.split("/");
      setLogoFileName(parts[parts.length - 1]?.split("?")[0] || "Saved logo");
    } else {
      setLogoFileName("");
    }
  }, [branding.logoImageUrl, branding.bubbleBgColor, branding.bubbleMode]);

  useEffect(() => {
    if (uploadFetcher.state === "idle" && uploadFetcher.data) {
      if (uploadFetcher.data.url) {
        setLogoUrl(uploadFetcher.data.url);
      } else if (uploadFetcher.data.error) {
        shopify.toast.show(uploadFetcher.data.error, { isError: true, duration: 5000 });
      }
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show(t("branding.toast.saved"), { duration: 3000 });
    } else if (actionData.success === false && actionData.error) {
      shopify.toast.show(actionData.error, { isError: true, duration: 5000 });
    }
  }, [actionData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reset = () => { if (fileInputRef.current) fileInputRef.current.value = ""; };

    if (file.size > 2 * 1024 * 1024) {
      shopify.toast.show(t("branding.toast.tooBig"), { isError: true, duration: 5000 });
      reset();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < 50 || h < 50) {
        shopify.toast.show(t("branding.toast.tooSmall", { w, h }), { isError: true, duration: 5000 });
        reset();
        return;
      }
      if (w > 4000 || h > 4000) {
        shopify.toast.show(t("branding.toast.tooLarge", { w, h }), { isError: true, duration: 5000 });
        reset();
        return;
      }

      setLogoFileName(file.name);
      setLogoUrl("");
      const fd = new FormData();
      fd.append("file", file);
      uploadFetcher.submit(fd, {
        method: "post",
        action: "/api/image-upload",
        encType: "multipart/form-data",
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      shopify.toast.show(t("branding.toast.unreadable"), { isError: true, duration: 5000 });
      reset();
    };
    img.src = objectUrl;
  };

  const bubblePreviewStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: bgColor,
    backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "3px solid #fff",
    boxShadow: "0 6px 24px rgba(0,0,0,0.30)",
    flexShrink: 0,
  };

  if (locked) {
    return (
      <s-page heading={t("branding.pageHeading")}>
        <div style={pageShell}>
          <div
            style={{
              ...cardPadding,
              textAlign: "center",
              padding: "48px 32px",
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
            }}
          >
            <div style={{ fontSize: "40px", lineHeight: 1, marginBottom: "16px" }}>✨</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", color: "#1e1b4b" }}>
              {t("branding.locked.title")}
            </h2>
            <p style={{ margin: "0 auto 22px", maxWidth: "460px", color: "#3730a3", fontSize: "14px", lineHeight: 1.6 }}>
              {t("branding.locked.desc")}
            </p>
            <button type="button" style={primaryButton} onClick={() => navigate("/app/billing")}>
              {t("branding.locked.cta")}
            </button>
          </div>
        </div>
      </s-page>
    );
  }

  return (
    <s-page heading={t("branding.pageHeading")}>
      <div style={pageShell}>

        {/* Header */}
        <div style={{ ...cardPadding, marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 6px", color: "#111827", fontSize: "22px", lineHeight: "1.2" }}>
            {t("branding.header.title")}
          </h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: "640px" }}>
            {t("branding.header.desc")}
          </p>
        </div>

        {/* Bubble source */}
        <section style={{ ...cardPadding, marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitle}>{t("branding.step1.title")}</h2>
            <p style={{ ...mutedText, margin: 0 }}>{t("branding.step1.desc")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {(["product", "logo"] as const).map((mode) => {
              const active = bubbleMode === mode;
              const label  = mode === "product" ? t("branding.mode.product.label") : t("branding.mode.logo.label");
              const desc   = mode === "product"
                ? t("branding.mode.product.desc")
                : t("branding.mode.logo.desc");
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBubbleMode(mode)}
                  style={{
                    background: active ? "#f8fafc" : "#fff",
                    border: active ? "2px solid #111827" : "1px solid #d7d7d7",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "block",
                    padding: "16px",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{label}</div>
                    {active && (
                      <span style={{ background: "#111827", borderRadius: "999px", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "3px 8px" }}>
                        {t("branding.selected")}
                      </span>
                    )}
                  </div>
                  <div style={{ ...mutedText, marginTop: "6px", fontSize: "12px" }}>{desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Logo */}
        <section style={{ ...cardPadding, marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitle}>{t("branding.step2.title")}</h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {t("branding.step2.desc")}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {/* Circle preview */}
            <div style={bubblePreviewStyle} />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!logoUrl && !isUploading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={secondaryButton}
                >
                  {t("branding.chooseImage")}
                </button>
              )}


              {isUploading && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "18px", height: "18px",
                    border: "2px solid #e5e7eb", borderTopColor: "#111827",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }} />
                  <span style={{ fontSize: "13px", color: "#374151" }}>{t("branding.uploading", { name: logoFileName })}</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {logoUrl && !isUploading && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "#dcfce7", border: "1px solid #86efac",
                    borderRadius: "8px", padding: "8px 12px",
                    fontSize: "13px", color: "#166534", fontWeight: 600,
                  }}>
                    <span>✓</span>
                    <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {logoFileName || t("branding.logoUploaded")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ ...secondaryButton, fontSize: "13px" }}
                  >
                    {t("branding.replace")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(""); setLogoFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    style={{ ...secondaryButton, color: "#b42318", borderColor: "#f1b7b0", fontSize: "13px" }}
                  >
                    {t("branding.remove")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Background color */}
        <section style={{ ...cardPadding, marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitle}>{t("branding.step3.title")}</h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {t("branding.step3.desc")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px",
                background: bgColor, border: "2px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                overflow: "hidden", cursor: "pointer", position: "relative",
              }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ position: "absolute", inset: 0, width: "150%", height: "150%", opacity: 0, cursor: "pointer" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                  {bgColor.toUpperCase()}
                </div>
                <div style={{ ...mutedText, fontSize: "12px" }}>{t("branding.clickSwatch")}</div>
              </div>
            </label>

            {/* Preset swatches */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["#111827","#6366F1","#F59E0B","#10B981","#EF4444","#8B5CF6","#EC4899","#ffffff"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBgColor(c)}
                  title={c}
                  style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: c,
                    border: bgColor === c ? "3px solid #111827" : "2px solid #e5e7eb",
                    cursor: "pointer",
                    boxShadow: bgColor === c ? "0 0 0 2px #fff, 0 0 0 4px #111827" : "none",
                    transition: "box-shadow 0.15s",
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Step 4: Preview + Save */}
        <section style={cardPadding}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitle}>{t("branding.step4.title")}</h2>
            <p style={{ ...mutedText, margin: 0 }}>
              {t("branding.step4.desc")}
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "20px",
            alignItems: "stretch",
          }}>
            {/* Visual preview */}
            <div style={{
              ...card,
              background: "#f8fafc",
              padding: "18px",
              minHeight: "200px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}>
              <div style={{
                width: "100%", height: "160px",
                background: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
                border: "1px solid #e3e3e3", borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.8)",
              }}>
                {/* Bubble preview */}
                <div style={{ ...bubblePreviewStyle, width: "64px", height: "64px" }} />
                {/* Cart icon */}
                <div style={{
                  position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)",
                  width: "52px", height: "52px", borderRadius: "14px",
                  background: "#111827", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px",
                }}>
                  🛒
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                {t("branding.preview.label")}
              </div>
            </div>

            {/* Summary + save */}
            <div style={{
              ...card,
              padding: "20px",
              minHeight: "200px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ ...mutedText, fontWeight: 800, marginBottom: "12px", textTransform: "uppercase" }}>
                  {t("branding.current")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      backgroundColor: bgColor,
                      backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      border: "2px solid #e5e7eb", flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                        {logoUrl ? (logoFileName || t("branding.logoUploaded")) : t("branding.noLogo")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {t("branding.background", { color: bgColor.toUpperCase() })}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: "1.5" }}>
                  {t("branding.applyNote")}
                </p>
              </div>

              {bubbleMode === "logo" && !logoUrl && (
                <div style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  background: "#fef3c7",
                  border: "1px solid #fcd34d",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#92400e",
                  fontWeight: 600,
                }}>
                  {t("branding.logoModeWarning")}
                </div>
              )}

              <Form method="POST" style={{ marginTop: "14px" }}>
                <input type="hidden" name="logoImageUrl" value={logoUrl} />
                <input type="hidden" name="bubbleBgColor"  value={bgColor} />
                <input type="hidden" name="bubbleMode"        value={bubbleMode} />
                <button
                  type="submit"
                  disabled={isSaving || (bubbleMode === "logo" && !logoUrl)}
                  style={{
                    ...primaryButton,
                    minHeight: "40px",
                    background: isSaving || (bubbleMode === "logo" && !logoUrl) ? "#8a8a8a" : "#111827",
                    cursor: isSaving || (bubbleMode === "logo" && !logoUrl) ? "not-allowed" : "pointer",
                    opacity: bubbleMode === "logo" && !logoUrl ? 0.6 : 1,
                  }}
                >
                  {isSaving ? t("branding.saving") : t("branding.save")}
                </button>
              </Form>
            </div>
          </div>
        </section>

      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
