interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function executeGraphQL<T>(
  admin: any,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const response = await admin.graphql(query, { variables });
  const json = await response.json();

  if (json.errors) {
    throw new Error(
      `GraphQL Error: ${json.errors.map((e: any) => e.message).join(', ')}`
    );
  }

  return json.data as T;
}

export async function fetchAnimationPresets(admin: any) {
  const query = `
    query {
      metaobjects(type: "ftc_animation_preset", first: 100) {
        nodes {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    metaobjects: { nodes: any[] };
  }>(admin, query);

  return result.metaobjects.nodes.map(parseMetaobject);
}

export async function fetchSoundPresets(admin: any) {
  const query = `
    query {
      metaobjects(type: "ftc_sound_preset", first: 100) {
        nodes {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    metaobjects: { nodes: any[] };
  }>(admin, query);

  return result.metaobjects.nodes.map(parseMetaobject);
}

export async function fetchProductWithAnimation(admin: any, productId: string) {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        metafield(namespace: "app", key: "ftc_cart_config") {
          id
          value
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    product: any;
  }>(admin, query, { id: productId });

  return result.product;
}

export async function fetchProductsWithAnimations(admin: any, first: number = 50) {
  const query = `
    query {
      products(first: ${first}) {
        nodes {
          id
          title
          metafield(namespace: "app", key: "ftc_cart_config") {
            id
            value
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    products: any;
  }>(admin, query);

  return result.products;
}

export async function updateProductAnimation(
  admin: any,
  productId: string,
  config: any
) {
  const query = `
    mutation updateProductMetafield($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          metafield(namespace: "app", key: "ftc_cart_config") {
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await executeGraphQL<any>(admin, query, {
    input: {
      id: productId,
      metafields: [
        {
          namespace: 'app',
          key: 'ftc_cart_config',
          type: 'json',
          value: JSON.stringify(config),
        },
      ],
    },
  });

  return result.productUpdate;
}

export async function createAnimationPreset(admin: any, data: any) {
  const query = `
    mutation createAnimationPreset($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          fields {
            key
            value
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const result = await executeGraphQL<any>(admin, query, {
    metaobject: {
      type: 'ftc_animation_preset',
      fields: [
        { key: 'animation_name', value: data.name },
        { key: 'animation_key', value: data.key },
        { key: 'duration_ms', value: String(data.duration) },
        { key: 'preview_json', value: data.previewJson },
        { key: 'enabled', value: String(data.enabled) },
      ],
    },
  });

  if (result.metaobjectCreate?.userErrors?.length > 0) {
    throw new Error(result.metaobjectCreate.userErrors.map((e: any) => e.message).join(', '));
  }

  return result.metaobjectCreate;
}

export async function createSoundPreset(admin: any, data: any) {
  const query = `
    mutation createSoundPreset($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          fields {
            key
            value
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const result = await executeGraphQL<any>(admin, query, {
    metaobject: {
      type: 'ftc_sound_preset',
      fields: [
        { key: 'sound_name', value: data.name },
        { key: 'sound_key', value: data.key },
        { key: 'file_url', value: data.fileUrl || '' },
        { key: 'duration_ms', value: String(data.duration) },
        { key: 'volume', value: String(data.volume) },
        { key: 'enabled', value: String(data.enabled) },
      ],
    },
  });

  if (result.metaobjectCreate?.userErrors?.length > 0) {
    throw new Error(result.metaobjectCreate.userErrors.map((e: any) => e.message).join(', '));
  }

  return result.metaobjectCreate;
}

export type FtcConfig = {
  id: string;
  animationKey: string;
  soundKey: string;
  live: boolean;
};

async function getAppInstallationId(admin: any): Promise<string> {
  const result = await executeGraphQL<{ currentAppInstallation: { id: string } }>(
    admin,
    `query { currentAppInstallation { id } }`
  );
  return result.currentAppInstallation.id;
}

export async function fetchConfigurations(admin: any): Promise<FtcConfig[]> {
  const query = `
    query {
      currentAppInstallation {
        metafield(namespace: "fly_to_cart", key: "configurations") { value }
      }
    }
  `;
  const result = await executeGraphQL<{ currentAppInstallation: any }>(admin, query);
  const raw = result.currentAppInstallation?.metafield?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FtcConfig[];
  } catch {
    return [];
  }
}

export async function saveConfigurations(admin: any, configs: FtcConfig[]): Promise<void> {
  const appInstallationId = await getAppInstallationId(admin);

  const query = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value namespace }
        userErrors { field message code }
      }
    }
  `;

  const result = await executeGraphQL<any>(admin, query, {
    metafields: [{
      ownerId: appInstallationId,
      namespace: "fly_to_cart",
      key: "configurations",
      type: "json",
      value: JSON.stringify(configs),
    }],
  });

  const { userErrors } = result.metafieldsSet ?? {};
  if (userErrors?.length > 0) {
    throw new Error(userErrors.map((e: any) => e.message).join(', '));
  }
}

export async function fetchGlobalConfig(admin: any) {
  const configs = await fetchConfigurations(admin);
  const live = configs.find((c) => c.live);
  return live ? { animationKey: live.animationKey, soundKey: live.soundKey } : null;
}

export async function saveGlobalConfig(admin: any, config: any) {
  const configs = await fetchConfigurations(admin);
  const id = Date.now().toString();
  const updated: FtcConfig[] = [
    ...configs.map((c) => ({ ...c, live: false })),
    { id, animationKey: config.animationKey, soundKey: config.soundKey, live: true },
  ];
  await saveConfigurations(admin, updated);
  return updated;
}

export async function fetchGlobalSettings(admin: any) {
  const query = `
    query {
      shop {
        metafield(namespace: "app", key: "ftc_global_settings") {
          id
          value
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    shop: any;
  }>(admin, query);

  const metafield = result.shop.metafield;
  return metafield ? JSON.parse(metafield.value) : null;
}

export async function updateGlobalSettings(admin: any, settings: any) {
  const query = `
    mutation updateShop($input: ShopInput!) {
      shopUpdate(input: $input) {
        shop {
          metafield(namespace: "app", key: "ftc_global_settings") {
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await executeGraphQL<any>(admin, query, {
    input: {
      metafields: [
        {
          namespace: 'app',
          key: 'ftc_global_settings',
          type: 'json',
          value: JSON.stringify(settings),
        },
      ],
    },
  });

  return result.shopUpdate;
}

function parseMetaobject(metaobject: any) {
  const parsed: any = {
    id: metaobject.id,
    handle: metaobject.handle,
  };

  metaobject.fields.forEach((field: any) => {
    parsed[field.key] = field.value;
  });

  return parsed;
}
