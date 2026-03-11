# GuíaTV Auctorio Publisher Contract

## Summary

GuíaTV is connected to Auctorio through the existing editorial blog API.

Route notes:

- Application route: `/blog`
- Public production route exposed by nginx: `/v2/blog`

## Authentication

- Header: `x-admin-key`
- Environment key on GuíaTV: `ANALYTICS_ADMIN_KEY`
- Environment reference on Auctorio: `GUIATV_AUCTORIO_ADMIN_KEY`

## Supported operations

- `POST /blog`
- `PUT /blog/:id`
- `DELETE /blog/:id`

## Editorial mapping

Auctorio sends:

- `title`
- `slug`
- `status`
- `excerpt`
- `content`
- `categories`
- `contentType`
- `featured`
- `primaryIntent`
- `targetQuery`
- `relatedPlatformKeys`
- `relatedRouteKeys`
- `faqItems`
- `featuredImage`
- `coverImage`
- `metaTitle`
- `metaDescription`
- `keywords`
- `ogImage`
- `canonicalUrl`

## Workflow

- `draft` syncs unpublished editorial entries
- `publish` makes the entry public
- `unpublish` deletes the remote entry and clears Auctorio publication state

## Validation

Validated on March 11, 2026:

- `POST /v2/blog` with the integration key returns `201`
- `DELETE /v2/blog/:id` with the integration key returns `200`
