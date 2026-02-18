import { NextResponse } from "next/server";

const resolveApiBaseUrl = () => {
  const raw = process.env.API_BASE_URL ?? "http://backend:8000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

const buildTargetUrl = (pathSegments: string[], searchParams: string) => {
  const baseUrl = resolveApiBaseUrl();
  const path = pathSegments.join("/");
  const search = searchParams ? `?${searchParams}` : "";
  return `${baseUrl}/${path}${search}`;
};

const buildForwardHeaders = (request: Request) => {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  return headers;
};

const forwardRequest = async (
  request: Request,
  params: { path: string[] },
  method: string,
) => {
  const sourceUrl = new URL(request.url);
  const targetUrl = buildTargetUrl(params.path ?? [], sourceUrl.searchParams.toString());
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method,
      headers: buildForwardHeaders(request),
      body,
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro de comunicação com backend";
    return NextResponse.json(
      {
        detail: message,
      },
      {
        status: 502,
      },
    );
  }
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "POST");
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "PUT");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "DELETE");
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, await context.params, "OPTIONS");
}
