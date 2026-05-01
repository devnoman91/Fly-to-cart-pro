import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchSoundPresets, createSoundPreset } from "../utils/shopify-graphql";

const PREDEFINED_SOUNDS = [
  {
    name: "Chime",
    key: "chime",
    duration: 500,
    fileUrl: "/sounds/chime.mp3",
    description: "Pleasant notification chime",
  },
  {
    name: "Whoosh",
    key: "whoosh",
    duration: 400,
    fileUrl: "/sounds/whoosh.mp3",
    description: "Smooth swoosh/transition sound",
  },
  {
    name: "Pop",
    key: "pop",
    duration: 300,
    fileUrl: "/sounds/pop.mp3",
    description: "Playful bubble pop sound",
  },
  {
    name: "Bell",
    key: "bell",
    duration: 700,
    fileUrl: "/sounds/bell.mp3",
    description: "Ringing bell notification",
  },
  {
    name: "Sparkle",
    key: "sparkle",
    duration: 600,
    fileUrl: "/sounds/sparkle.mp3",
    description: "Magical tinkling sound effect",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const sounds = await fetchSoundPresets(admin);
    return { sounds, predefined: PREDEFINED_SOUNDS };
  } catch (error) {
    return { sounds: [], predefined: PREDEFINED_SOUNDS };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return null;
  }

  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const soundKey = formData.get("soundKey") as string;

    const sound = PREDEFINED_SOUNDS.find((s) => s.key === soundKey);

    if (!sound) return null;

    await createSoundPreset(admin, {
      name: sound.name,
      key: sound.key,
      fileUrl: sound.fileUrl,
      duration: sound.duration,
      volume: 0.8,
      enabled: true,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create sound:", error);
    return null;
  }
};

export default function SoundsPage() {
  const { predefined } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Pick Sound Effect">
      <s-button slot="primary-action" onClick={() => window.history.back()}>
        Back
      </s-button>

      <s-section heading="Available Sounds">
        <s-stack direction="block" gap="base">
          {predefined.map((sound) => (
            <form key={sound.key} method="POST">
              <input type="hidden" name="soundKey" value={sound.key} />
              <s-box
                padding="loose"
                borderWidth="base"
                style={{ cursor: "pointer", marginBottom: "16px" }}
              >
                <s-stack direction="block" gap="base">
                  <div>
                    <s-text variant="headingSm">{sound.name}</s-text>
                    <s-text tone="subdued" style={{ fontSize: "14px" }}>
                      {sound.description}
                    </s-text>
                    <s-text tone="subdued" style={{ fontSize: "12px", marginTop: "8px" }}>
                      Duration: {sound.duration}ms
                    </s-text>
                  </div>
                  <s-button type="submit">Select</s-button>
                </s-stack>
              </s-box>
            </form>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
