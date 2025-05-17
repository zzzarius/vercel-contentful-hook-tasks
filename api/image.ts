import { VercelRequest, VercelResponse } from "@vercel/node";
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
  const { body } = req;
  if (!body) {
    return res.status(400).send("No body provided");
  }
  if (!isAsset(body)) {
    return res.status(400).send("Invalid asset object");
  }
  const isImage = body.fields?.file?.fields?.contentType.startsWith('image/');
  if (!isImage) {
    return res.status(400).send("Not an image");
  }
  const env = await getEnvironment();
  env.createEntryWithId('mediaImage', body.sys.id + '-media', {
    fields: {
      internalName: {
        'en-US': body.fields?.title['en-US'] ?? body.fields?.file?.fields?.fileName ?? 'No name'
      },
      image: {
        'en-US': {
          sys: {
            id: body.sys.id,  
            type: 'Link',
            linkType: 'Asset'
          }
        }
      }
    }
  });
}