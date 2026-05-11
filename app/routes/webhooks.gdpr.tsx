import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // This app does not store any customer personal data.
      // Animation configs are stored as shop metafields only.
      return new Response(null, { status: 200 });

    case "CUSTOMERS_REDACT":
      // No customer personal data stored — nothing to delete.
      return new Response(null, { status: 200 });

    case "SHOP_REDACT":
      // App uninstalled — delete all merchant data.
      await prisma.session.deleteMany({ where: { shop } });
      await prisma.subscription.deleteMany({ where: { shop } });
      return new Response(null, { status: 200 });

    default:
      return new Response("Unhandled webhook topic", { status: 404 });
  }
};
