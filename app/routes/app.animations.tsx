import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Dashboard } from "../components/Dashboard";
import { fetchAnimationPresets } from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const animations = await fetchAnimationPresets(admin);
    return { animations, sounds: [] };
  } catch (error) {
    console.error("Failed to fetch animations:", error);
    return { animations: [], sounds: [] };
  }
};

export default function AnimationsPage() {
  const { animations } = useLoaderData<typeof loader>();

  const handleAddAnimation = () => {
    window.location.href = '/app/animations/new';
  };

  return (
    <Dashboard
      animations={animations}
      sounds={[]}
      isLoading={false}
      onAddAnimation={handleAddAnimation}
    />
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
