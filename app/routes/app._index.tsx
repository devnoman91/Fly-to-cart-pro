import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Dashboard } from "../components/Dashboard";
import {
  fetchAnimationPresets,
  fetchSoundPresets,
} from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const animations = await fetchAnimationPresets(admin);
    const sounds = await fetchSoundPresets(admin);

    return { animations, sounds };
  } catch (error) {
    console.error("Failed to fetch presets:", error);
    return { animations: [], sounds: [] };
  }
};

export default function Index() {
  const { animations = [], sounds = [] } = useLoaderData<typeof loader>();

  const handleAddAnimation = () => {
    // TODO: Navigate to create animation page
  };

  const handleAddSound = () => {
    // TODO: Navigate to create sound page
  };

  return (
    <Dashboard
      animations={animations}
      sounds={sounds}
      isLoading={false}
      onAddAnimation={handleAddAnimation}
      onAddSound={handleAddSound}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
