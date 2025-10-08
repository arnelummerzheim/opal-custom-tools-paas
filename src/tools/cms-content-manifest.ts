import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface CmsContentManifestParameters {
  cmsUrl: string;
  authToken?: string;
  includeSystemTypes?: boolean;
}

async function cmsContentManifest(parameters: CmsContentManifestParameters) {
  const { cmsUrl, authToken, includeSystemTypes } = parameters;

  // Build the API endpoint URL
  const baseUrl = cmsUrl.endsWith('/') ? cmsUrl.slice(0, -1) : cmsUrl;
  let apiPath = '/api/episerver/v3.0/contentmanifest';

  // Add query parameter if includeSystemTypes is specified
  if (includeSystemTypes !== undefined) {
    apiPath += `?includeSystemTypes=${includeSystemTypes}`;
  }

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
      `CMS Content Manifest API call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

tool({
  name: "cms_content_manifest",
  description: "Exports a complete manifest containing all content definitions from Optimizely CMS12 including content types, property groups, and editor definitions. Use this for environment comparison, backup/restore workflows, documentation generation, or migration planning.",
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
      name: "includeSystemTypes",
      type: ParameterType.Boolean,
      description: "Defines whether system types should be included in the export (default: false)",
      required: false,
    },
  ],
})(cmsContentManifest);
