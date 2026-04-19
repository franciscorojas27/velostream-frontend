import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parse = loginSchema.safeParse(body);
        if (!parse.success) {
            return NextResponse.json({ error: parse.error.issues }, { status: 400 });
        }

        const { email, password } = parse.data;
        const apiUrl = process.env.API_URL;
        if (!apiUrl) {
            return NextResponse.json({ error: "Missing API_URL" }, { status: 500 });
        }

        const res = await fetch(`${apiUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.error ?? data }, { status: res.status });
        }

        const cookieStore = await cookies();
        cookieStore.set("session_token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        });
        return NextResponse.json({ msg: "ok" }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}