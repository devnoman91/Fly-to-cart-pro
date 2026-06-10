const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File must be under 2 MB";
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return "File must be an image (PNG, JPG, GIF, WebP, SVG)";
  }
  return null;
}

export async function uploadImageToShopify(admin: any, file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || "image/png";

  const stageRes = await admin.graphql(
    `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: [{ filename: file.name, mimeType, resource: "FILE", httpMethod: "POST" }],
      },
    },
  );

  const stageJson = await stageRes.json();
  const stageErrors = stageJson.data?.stagedUploadsCreate?.userErrors;
  if (stageErrors?.length) throw new Error(stageErrors.map((e: any) => e.message).join(", "));

  const target = stageJson.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) throw new Error("Failed to create staged upload target");

  const uploadForm = new FormData();
  for (const { name, value } of target.parameters as { name: string; value: string }[]) {
    uploadForm.append(name, value);
  }
  uploadForm.append("file", new Blob([buffer], { type: mimeType }), file.name);

  const uploadRes = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadRes.ok) {
    const body = await uploadRes.text().catch(() => "");
    throw new Error(`Staging upload failed (${uploadRes.status}): ${body.slice(0, 300)}`);
  }

  const fileRes = await admin.graphql(
    `#graphql
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          ... on GenericFile { url }
        }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        files: [{
          alt: "Brand logo for Fly-to-Cart fallback bubble",
          contentType: "FILE",
          originalSource: target.resourceUrl,
        }],
      },
    },
  );

  const fileJson = await fileRes.json();
  const fileErrors = fileJson.data?.fileCreate?.userErrors;
  if (fileErrors?.length) throw new Error(fileErrors.map((e: any) => e.message).join(", "));

  const created = fileJson.data?.fileCreate?.files?.[0];
  if (!created?.id) throw new Error("File creation returned no record");
  if (created.url) return created.url as string;

  const fileId: string = created.id;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const pollRes = await admin.graphql(
      `#graphql
      query getFile($id: ID!) {
        node(id: $id) {
          ... on GenericFile { fileStatus url }
        }
      }`,
      { variables: { id: fileId } },
    );
    const pollJson = await pollRes.json();
    const node = pollJson.data?.node as { fileStatus: string; url?: string } | undefined;
    if (node?.url) return node.url;
    if (node?.fileStatus === "FAILED") throw new Error("Shopify file processing failed");
  }

  throw new Error("Timed out waiting for image to be ready on Shopify CDN");
}
