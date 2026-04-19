import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
    email: z.email(),
    username: z.string().min(3).max(20),
    password: z.string().min(8),
    accept: z.literal(true),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parse = registerSchema.safeParse(body);
        if (!parse.success) {
            return NextResponse.json({ error: parse.error.issues }, { status: 400 });
        }

        const { email, username, password, accept } = parse.data;
        const res = await fetch(`${process.env.API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, username, password, accept }),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.error ?? data }, { status: res.status });
        }
        return NextResponse.json({ msg: "ok" }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}