# Vercel Contentful hook tasks

## Description

It's a simple vercel function which creates Content entries based on Asset data.

Fully configurable through query parameters.

## Deployment to Vercel

1. Run `vercel` [cli](https://vercel.com/docs/cli) and answer the questions.
2. Set environment variables.

## Environment variables

| Variable | Description |
| --- | --- |
| CONTENTFUL_SPACE_ID | https://www.contentful.com/help/spaces/find-space-id/ |
| CONTENTFUL_ENVIRONMENT_ID | `Optional` Next to search in the menu. `master` will be used if not defined |
| CONTENTFUL_MANAGEMENT_API_KEY | https://app.contentful.com/account/profile/cma_tokens |
| CONTENTFUL_HOOK_SECRET | `Optional` Your custom text to secure the endpoint |

## Query parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `contentTypeToCreate` | `required` | Content type api id which will be used for entry creation |
| `referenceField` | `required` | Field which will reference created Asset. Can be a list of fields separated by `,` |
| `titleField` | `optional` | Asset field `title` data will be put into this field for `contentTypeToCreate`. Can be a list of fields separated by `,` |
| `descriptionField` | `optional` | Asset field `description` data will be put into this field for `contentTypeToCreate`. Can be a list of fields separated by `,` |
| `fileField` | `optional` | Asset`filename` will be put into this field for `contentTypeToCreate`. Can be a list of fields separated by `,` |
| `locale` | `en-US` | Which locale to use when filling out the fields |
| `idSuffix` | `-media` | Same asset id will be used for entry. Only difference is `idSuffix` |

## How to configure Contentful hook

1. Go to you `master` environment
2. Click cog icon next to your profile avatar
3. Select Webhooks menu entry
4. Click `+ Add Webhook` button
5. Fill in descriptive name
6. Use POST method for URL. Use your vercel deployment URL as the root suffixed with `/api/createAsset` and add parameters.
   For example:
   `https://vercel-contentful-hook-tasks.vercel.app/api/createAsset?contentTypeToCreate=mediaImage&referenceField=image&titleField=alt,internalName&descriptionField=figcaption`
7. For trigger - check `Publish` on `Asset` row in Content Events.
8. (Optional) If you have `CONTENTFUL_HOOK_SECRET` configured
   1. In `Headers` click `+ Add secret headers` button
   2. For key use `authorization` and for value - same value configured in `CONTENTFUL_HOOK_SECRET` environment variable.
9. Ensure that for __Payload__ `Use default payload` is selected.
10. Click save

If this project is deployed and everything is configured correctly - your content entry will be created once Asset is published.