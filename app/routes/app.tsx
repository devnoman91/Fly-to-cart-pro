import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { getRequestLocale } from "../i18n";
import { I18nProvider, useT } from "../i18n/context";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale: getRequestLocale(request),
  };
};

function AppNav() {
  const t = useT();
  return (
    <s-app-nav>
      <s-link href="/app">{t("nav.home")}</s-link>
      <s-link href="/app/configure">{t("nav.configure")}</s-link>
      <s-link href="/app/animations">{t("nav.animations")}</s-link>
      <s-link href="/app/branding">{t("nav.branding")}</s-link>
      <s-link href="/app/billing">{t("nav.billing")}</s-link>
      <s-link href="/app/help">{t("nav.help")}</s-link>
    </s-app-nav>
  );
}

export default function App() {
  const { apiKey, locale } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <I18nProvider locale={locale}>
        <AppNav />
        <Outlet />
      </I18nProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
