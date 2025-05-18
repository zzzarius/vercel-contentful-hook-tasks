import type { VercelRequest, VercelResponse } from "@vercel/node";
import { type Asset, createClient } from 'contentful-management';

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_API_KEY!,
});


async function getEnvironment() {
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID!);
  const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT_ID!);
  return environment;
}

function isAsset(obj: any): obj is Asset {
  return (
    obj &&
    typeof obj === 'object' &&
    'sys' in obj &&
    'fields' in obj &&
    'metadata' in obj &&
    'type' in obj.sys &&
    obj.sys.type === 'Asset'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { body, query = {} } = req;
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
    idSuffix = '-media',
  }: {
    contentTypeToCreate?: string,
    locale?: string,
    referenceField?: string
    titleField?: string,
    descriptionField?: string,
    fileField?: string,
    idSuffix?: string,
  } = query;

  if (!contentTypeToCreate) {
    return res.status(400).send("No contentTypeToCreate param provided. Please add query param for contentTypeToCreate");
  }

  if (!referenceField) {
    return res.status(400).send("No referenceField param provided. Please add query param for referenceField");
  }

  if (!isAsset(body)) {
    return res.status(400).send("Invalid asset object");
  }
  const env = await getEnvironment();

  env.createEntryWithId(contentTypeToCreate, body.sys.id + idSuffix, {
    fields: {
      ...(referenceField ? { [referenceField]: { [locale]: { sys: { id: body.sys.id, type: 'Link', linkType: 'Asset' } } } } : {}),
      ...((titleField && body.fields?.title?.[locale]) ? { [titleField]: { [locale]: body.fields.title[locale] } } : {}),
      ...((descriptionField && body.fields?.description?.[locale]) ? { [descriptionField]: { [locale]: body.fields?.description?.[locale] } } : {}),
      ...(fileField ? { [fileField]: { [locale]: body.fields?.file[locale] } } : {}),
    }
  });
  return res.status(200).send(JSON.stringify(body, null, 2));
}