import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface CmsContentDeliveryParameters {
  cmsUrl: string;
  authToken: string;
  operation: string;
  contentReference?: string;
  contentGuid?: string;
  siteId?: string;
  contentUrl?: string;
  language?: string;
  expand?: string;
  select?: string;
  top?: number;
}

async function cmsContentDelivery(parameters: CmsContentDeliveryParameters) {
  const {
    cmsUrl,
    authToken,
    operation,
    contentReference,
    contentGuid,
    siteId,
    contentUrl,
    language,
    expand,
    select,
    top,
  } = parameters;

  // Build the API endpoint URL based on operation
  const baseUrl = cmsUrl.endsWith('/') ? cmsUrl.slice(0, -1) : cmsUrl;
  let apiPath = '';
  const queryParams: string[] = [];

  switch (operation) {
    case 'get-all-sites':
      apiPath = '/api/episerver/v3.0/site';
      break;

    case 'get-site-by-id':
      if (!siteId) {
        throw new Error('siteId is required for get-site-by-id operation');
      }
      apiPath = `/api/episerver/v3.0/site/${siteId}`;
      break;

    case 'get-content-by-reference':
      if (!contentReference) {
        throw new Error('contentReference is required for get-content-by-reference operation');
      }
      apiPath = `/api/episerver/v3.0/content/${contentReference}`;
      break;

    case 'get-content-by-guid':
      if (!contentGuid) {
        throw new Error('contentGuid is required for get-content-by-guid operation');
      }
      apiPath = `/api/episerver/v3.0/content/${contentGuid}`;
      break;

    case 'get-content-by-url':
      if (!contentUrl) {
        throw new Error('contentUrl is required for get-content-by-url operation');
      }
      apiPath = '/api/episerver/v3.0/content';
      queryParams.push(`contentUrl=${encodeURIComponent(contentUrl)}`);
      break;

    case 'get-children':
      if (!contentReference && !contentGuid) {
        throw new Error('Either contentReference or contentGuid is required for get-children operation');
      }
      if (contentReference) {
        apiPath = `/api/episerver/v3.0/content/${contentReference}/children`;
      } else {
        apiPath = `/api/episerver/v3.0/content/${contentGuid}/children`;
      }
      if (top) {
        queryParams.push(`top=${top}`);
      }
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  // Add common query parameters
  if (expand) {
    queryParams.push(`expand=${encodeURIComponent(expand)}`);
  }
  if (select) {
    queryParams.push(`select=${encodeURIComponent(select)}`);
  }

  const fullUrl = `${baseUrl}${apiPath}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    };

    // Add Accept-Language header if language is specified
    if (language) {
      headers["Accept-Language"] = language;
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
      `CMS Content Delivery API call failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

tool({
  name: "paas_cms_content_delivery",
  description: "Retrieves content and site information from Optimizely CMS12 Content Delivery API. Supports operations: get-all-sites (list all sites), get-site-by-id (get specific site), get-content-by-reference (get content by reference ID), get-content-by-guid (get content by GUID), get-content-by-url (get content by URL), get-children (get child pages/content). Use this to retrieve published content, site structures, and page hierarchies.",
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
      description: "Bearer token for authentication with the CMS API (required for Content Delivery API)",
      required: true,
    },
    {
      name: "operation",
      type: ParameterType.String,
      description: "Operation to perform: 'get-all-sites', 'get-site-by-id', 'get-content-by-reference', 'get-content-by-guid', 'get-content-by-url', 'get-children'",
      required: true,
    },
    {
      name: "contentReference",
      type: ParameterType.String,
      description: "Content reference ID (e.g., '5' or '5_123') - required for get-content-by-reference and optional for get-children",
      required: false,
    },
    {
      name: "contentGuid",
      type: ParameterType.String,
      description: "Content GUID - required for get-content-by-guid and optional for get-children",
      required: false,
    },
    {
      name: "siteId",
      type: ParameterType.String,
      description: "Site GUID - required for get-site-by-id operation",
      required: false,
    },
    {
      name: "contentUrl",
      type: ParameterType.String,
      description: "Absolute URL to the content - required for get-content-by-url operation",
      required: false,
    },
    {
      name: "language",
      type: ParameterType.String,
      description: "Language code (e.g., 'en', 'sv') to retrieve content in specific language",
      required: false,
    },
    {
      name: "expand",
      type: ParameterType.String,
      description: "Comma-separated list of properties to expand (e.g., 'contentArea,blocks'). Use '*' to expand all",
      required: false,
    },
    {
      name: "select",
      type: ParameterType.String,
      description: "Comma-separated list of properties to return (e.g., 'name,url,contentType')",
      required: false,
    },
    {
      name: "top",
      type: ParameterType.Number,
      description: "Maximum number of children to return (only applicable for get-children operation, max 100)",
      required: false,
    },
  ],
})(cmsContentDelivery);
