import type { VercelRequest, VercelResponse } from "@vercel/node";
import { type Asset, createClient } from "contentful-management";

const accessToken =
  process.env.CONTENTFUL_MANAGEMENT_API_KEY ||
  "please add CONTENTFUL_MANAGEMENT_API_KEY env var";
const spaceId =
  process.env.CONTENTFUL_SPACE_ID || "please add CONTENTFUL_SPACE_ID env var";
const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || "master";

const client = createClient({
  accessToken,
});

const hookSecret = process.env.CONTENTFUL_HOOK_SECRET;

async function getEnvironment() {
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);
  return environment;
}

function isAsset(obj: unknown): obj is Asset {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "fields" in obj &&
    "metadata" in obj &&
    "sys" in obj &&
    typeof (obj as { sys?: unknown }).sys === "object" &&
    (obj as { sys?: unknown }).sys !== null &&
    "type" in (obj as { sys: { type?: unknown } }).sys &&
    ((obj as { sys: { type?: unknown } }).sys as { type?: unknown }).type ===
      "Asset"
  );
}

function getFieldObject(
  locale: string,
  fieldName?: string,
  value?: unknown,
): { [key: string]: unknown } {
  if (!fieldName || !value) {
    return {};
  }
  const fieldNames = fieldName.split(",");
  return fieldNames.reduce(
    (acc, field) => {
      acc[field] = {
        [locale]: value,
      };
      return acc;
    },
    {} as { [key: string]: unknown },
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { body, query = {} } = req;
  if (hookSecret && req.headers?.authorization !== hookSecret) {
    return res.status(401).send("Unauthorized");
  }
  if (!body) {
    return res.status(400).send("No body provided");
  }

  const {
    contentTypeToCreate,
    referenceField,
    titleField,
    locale = "en-US",
    descriptionField,
    fileField,
    idSuffix = "-media",
  }: {
    contentTypeToCreate?: string;
    locale?: string;
    referenceField?: string;
    titleField?: string;
    descriptionField?: string;
    fileField?: string;
    idSuffix?: string;
  } = query;

  if (!contentTypeToCreate) {
    return res
      .status(400)
      .send(
        "No contentTypeToCreate param provided. Please add query param for contentTypeToCreate",
      );
  }

  if (!referenceField) {
    return res
      .status(400)
      .send(
        "No referenceField param provided. Please add query param for referenceField",
      );
  }

  if (!isAsset(body)) {
    return res
      .status(400)
      .send(
        "Invalid asset object. Configure Contentful hook to send default payload",
      );
  }
  const env = await getEnvironment();

  const createdEntry = await env.createEntryWithId(
    contentTypeToCreate,
    body.sys.id + idSuffix,
    {
      fields: {
        ...getFieldObject(
          locale,
          referenceField,
          body.sys?.id
            ? { sys: { id: body.sys.id, type: "Link", linkType: "Asset" } }
            : undefined,
        ),
        ...getFieldObject(locale, titleField, body.fields?.title?.[locale]),
        ...getFieldObject(
          locale,
          descriptionField,
          body.fields?.description?.[locale],
        ),
        ...getFieldObject(
          locale,
          fileField,
          body.fields?.file?.[locale]?.fileName,
        ),
      },
    },
  );
  return res
    .status(200)
    .send(
      `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${createdEntry.sys.id}`,
    );
}
