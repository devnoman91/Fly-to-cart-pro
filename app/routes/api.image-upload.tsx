import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { validateImageFile, uploadImageToShopify } from "../utils/image-upload.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin } = await authenticate.admin(request);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 422 });
  }

  try {
    const url = await uploadImageToShopify(admin, file);
    return Response.json({ url });
  } catch (err: any) {
    console.error("[FlyToCart] Image upload failed:", err?.message);
    return Response.json(
      { error: err?.message || "Upload failed. Please try again." },
      { status: 500 },
    );
  }
};
