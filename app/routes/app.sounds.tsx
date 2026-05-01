import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Dashboard } from "../components/Dashboard";
import { fetchSoundPresets } from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const sounds = await fetchSoundPresets(admin);
    return { animations: [], sounds };
  } catch (error) {
    console.error("Failed to fetch sounds:", error);
    return { animations: [], sounds: [] };
  }
};

export default function SoundsPage() {
  const { sounds } = useLoaderData<typeof loader>();

  const handleAddSound = () => {
    window.location.href = '/app/sounds/new';
  };

  return (
    <Dashboard
      animations={[]}
      sounds={sounds}
      isLoading={false}
      onAddSound={handleAddSound}
    />
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
