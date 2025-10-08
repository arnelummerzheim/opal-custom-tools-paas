import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface CmsContentTypesParameters {
  cmsUrl: string;
  authToken?: string;
  contentTypeId?: string;
}

async function cmsContentTypes(parameters: CmsContentTypesParameters) {
  const { cmsUrl, authToken, contentTypeId } = parameters;

  // Build the API endpoint URL
  const baseUrl = cmsUrl.endsWith('/') ? cmsUrl.slice(0, -1) : cmsUrl;
  const apiPath = contentTypeId
    ? `/api/episerver/v3.0/contenttypes/${contentTypeId}`
    : '/api/episerver/v3.0/contenttypes';
  const fullUrl = `${baseUrl}${apiPath}`;

  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    // Add authentication if token is provided
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: headers,
    });

    // Capture response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: any;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: responseBody,
        url: fullUrl,
      };
    }

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      data: responseBody,
      url: fullUrl,
      headers: responseHeaders,
    };
  } catch (error) {
    throw new Error(
      `CMS Content Types API call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

tool({
  name: "paas_cms_content_types",
  description: "Retrieves content type definitions from Optimizely CMS12. Lists all content types or fetches a specific content type by ID. Use this to understand the structure and properties of content types in your CMS instance.",
  parameters: [
    {
      name: "cmsUrl",
      type: ParameterType.String,
      description: "Base URL of your Optimizely CMS12 instance (e.g., 'https://test9.optimizely.cc')",
      required: true,
    },
    {
      name: "authToken",
      type: ParameterType.String,
      description: "Bearer token for authentication with the CMS API (optional if the API allows anonymous access)",
      required: false,
    },
    {
      name: "contentTypeId",
      type: ParameterType.String,
      description: "Optional content type ID to retrieve a specific content type. If not provided, lists all content types.",
      required: false,
    },
  ],
})(cmsContentTypes);
