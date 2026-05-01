import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Home } from "../components/Home";
import {
  fetchAnimationPresets,
  fetchSoundPresets,
  fetchProductsWithAnimations,
} from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const animations = await fetchAnimationPresets(admin);
    const sounds = await fetchSoundPresets(admin);
    const productsData = await fetchProductsWithAnimations(admin, 100);

    return {
      totalAnimations: animations.length,
      totalSounds: sounds.length,
      totalProducts: productsData.nodes?.length || 0,
    };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return {
      totalAnimations: 0,
      totalSounds: 0,
      totalProducts: 0,
    };
  }
};

export default function Index() {
  const { totalAnimations, totalSounds, totalProducts } = useLoaderData<typeof loader>();

  return (
    <Home
      totalAnimations={totalAnimations}
      totalSounds={totalSounds}
      totalProducts={totalProducts}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
