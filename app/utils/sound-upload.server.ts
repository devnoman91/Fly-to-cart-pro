const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/x-wav",
  "audio/x-m4a",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateSoundFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File must be under 5 MB";
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return "File must be an audio file (MP3, WAV, OGG, AAC)";
  }
  return null;
}

export async function uploadSoundToShopify(
  admin: any,
  file: File,
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || "audio/mpeg";

  // 1. Create staged upload target
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
        input: [
          {
            filename: file.name,
            mimeType,
            resource: "FILE",
            httpMethod: "POST",
          },
        ],
      },
    },
  );

  const stageJson = await stageRes.json();
  const stageErrors = stageJson.data?.stagedUploadsCreate?.userErrors;
  if (stageErrors?.length) {
    throw new Error(stageErrors.map((e: any) => e.message).join(", "));
  }

  const target = stageJson.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) throw new Error("Failed to create staged upload target");

  // 2. Upload file bytes to the staged target (S3 / GCS multipart POST)
  const uploadForm = new FormData();
  for (const { name, value } of target.parameters as { name: string; value: string }[]) {
    uploadForm.append(name, value);
  }
  uploadForm.append("file", new Blob([buffer], { type: mimeType }), file.name);

  const uploadRes = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadRes.ok) {
    const body = await uploadRes.text().catch(() => "");
    throw new Error(
      `Staging upload failed (${uploadRes.status}): ${body.slice(0, 300)}`,
    );
  }

  // 3. Register file in Shopify Files
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
        files: [
          {
            alt: "Custom cart sound",
            contentType: "FILE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    },
  );

  const fileJson = await fileRes.json();
  const fileErrors = fileJson.data?.fileCreate?.userErrors;
  if (fileErrors?.length) {
    throw new Error(fileErrors.map((e: any) => e.message).join(", "));
  }

  const created = fileJson.data?.fileCreate?.files?.[0];
  if (!created?.id) throw new Error("File creation returned no record");
  if (created.url) return created.url as string;

  // 4. Poll until Shopify CDN URL is available (up to 10 s)
  const fileId: string = created.id;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));

    const pollRes = await admin.graphql(
      `#graphql
      query getFile($id: ID!) {
        node(id: $id) {
          ... on GenericFile {
            fileStatus
            url
          }
        }
      }`,
      { variables: { id: fileId } },
    );

    const pollJson = await pollRes.json();
    const node = pollJson.data?.node as
      | { fileStatus: string; url?: string }
      | undefined;

    if (node?.url) return node.url;
    if (node?.fileStatus === "FAILED") throw new Error("Shopify file processing failed");
  }

  throw new Error("Timed out waiting for file to be ready on Shopify CDN");
}
