import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { fetchProductsWithAnimations } from "../utils/shopify-graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const productsData = await fetchProductsWithAnimations(admin, 50);
    return { products: productsData.nodes || [] };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { products: [] };
  }
};

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Configure Products">
      <s-button
        slot="primary-action"
        onClick={() => window.location.href = '/app'}
      >
        Back to Home
      </s-button>

      <s-section heading="Products with Animations">
        {products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>
                    Product Name
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>
                    Has Configuration
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: '1px solid #e0e0e0' }}
                  >
                    <td style={{ padding: '10px' }}>{product.title}</td>
                    <td style={{ padding: '10px' }}>
                      {product.metafield ? (
                        <s-badge tone="success">Configured</s-badge>
                      ) : (
                        <s-badge>Not Configured</s-badge>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <s-button
                        onClick={() => {
                          window.location.href = `/app/products/${product.id.split('/').pop()}`;
                        }}
                      >
                        Configure
                      </s-button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <s-paragraph>No products found. Create products first!</s-paragraph>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};
