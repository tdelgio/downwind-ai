import { NextResponse } from "next/server";

import { liveCams } from "@/data/liveCams";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const cam = liveCams.find((item) => item.id === id);

  if (!cam?.verified || !cam.snapshotUrl) {
    return NextResponse.json(
      { error: "No verified public snapshot endpoint for this camera." },
      { status: 404 },
    );
  }

  try {
    const response = await fetch(cam.snapshotUrl, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: cam.refreshSeconds },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera source returned ${response.status}.` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const image = await response.arrayBuffer();

    return new Response(image, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": `public, s-maxage=${cam.refreshSeconds}, stale-while-revalidate=120`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load camera snapshot." },
      { status: 502 },
    );
  }
}
