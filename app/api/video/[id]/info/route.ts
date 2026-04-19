import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");
        if (!sessionToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(`${process.env.API_URL}/download/video/info?id=${encodeURIComponent(id)}`, {
            headers: {
                Authorization: `Bearer ${sessionToken.value}`,
            },
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.error ?? "Failed to fetch video info" }, { status: res.status });
        }


        return NextResponse.json(data, { status: 200 });
    } catch {
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}