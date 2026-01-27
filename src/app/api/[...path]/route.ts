const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

type Params = {
  params: {
    path: string[];
  };
};

export async function GET(request: Request, context: Params) {
  return proxyRequest(request, context.params.path, "GET");
}

export async function POST(request: Request, context: Params) {
  return proxyRequest(request, context.params.path, "POST");
}

export async function PUT(request: Request, context: Params) {
  return proxyRequest(request, context.params.path, "PUT");
}

export async function DELETE(request: Request, context: Params) {
  return proxyRequest(request, context.params.path, "DELETE");
}

async function proxyRequest(request: Request, path: string[], method: string) {
  const targetUrl = buildTargetUrl(request, path);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const body = shouldSendBody(method) ? await request.arrayBuffer() : undefined;
  const response = await fetch(targetUrl, {
    method,
    headers,
    body
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}

function buildTargetUrl(request: Request, path: string[]) {
  const url = new URL(request.url);
  const pathSuffix = path.join("/");
  return `${API_BASE_URL}/${pathSuffix}${url.search}`;
}

function shouldSendBody(method: string) {
  return !["GET", "HEAD"].includes(method);
}
