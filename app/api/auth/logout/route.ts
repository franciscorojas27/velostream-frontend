import { cookies } from "next/headers";
import { NextResponse } from "next/server";

    export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("session_token");

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}