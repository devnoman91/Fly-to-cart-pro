import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const hasShopParam = url.searchParams.has("shop");

  try {
    await authenticate.admin(request);
    return { apiKey: process.env.SHOPIFY_API_KEY || "" };
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      if (!hasShopParam) {
        try {
          const sessions = await prisma.session.findMany({
            take: 1,
            orderBy: { id: "desc" },
          });

          if (sessions.length > 0 && sessions[0].shop) {
            return { apiKey: process.env.SHOPIFY_API_KEY || "" };
          }
        } catch (dbError) {
          console.warn("[FlyToCart] Fallback session lookup failed:", dbError);
        }
      }
      throw error;
    }
    throw error;
  }
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/configure">Configure</s-link>
        <s-link href="/app/animations">My Animations</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
