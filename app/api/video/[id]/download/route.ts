import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const qualitySchema = z.enum(["1080", "720", "480", "360", "mp3"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const qualityParam = request.nextUrl.searchParams.get("quality") || "720";
        const quality = qualitySchema.safeParse(qualityParam);

        if (!quality.success) {
            return NextResponse.json({ error: "Invalid quality" }, { status: 400 });
        }

        const upstream = await fetch(
            `${process.env.API_URL}/download?id=${encodeURIComponent(id)}&quality=${encodeURIComponent(quality.data)}`);

        if (!upstream.ok) {
            const contentType = upstream.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const data = await upstream.json();
                return NextResponse.json({ error: data.error ?? "Download failed" }, { status: upstream.status });
            }
            const text = await upstream.text();
            return NextResponse.json({ error: text || "Download failed" }, { status: upstream.status });
        }

        const headers = new Headers();
        const contentType = upstream.headers.get("content-type");
        const contentDisposition = upstream.headers.get("content-disposition");
        const contentLength = upstream.headers.get("content-length");
        const acceptRanges = upstream.headers.get("accept-ranges");
        const lastModified = upstream.headers.get("last-modified");

        if (contentType) headers.set("content-type", contentType);
        if (contentDisposition) headers.set("content-disposition", contentDisposition);
        if (contentLength) headers.set("content-length", contentLength);
        if (acceptRanges) headers.set("accept-ranges", acceptRanges);
        if (lastModified) headers.set("last-modified", lastModified);
        if (contentLength) headers.set("x-upstream-content-length", contentLength);
        headers.set("cache-control", "no-store");

        return new NextResponse(upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch {
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
