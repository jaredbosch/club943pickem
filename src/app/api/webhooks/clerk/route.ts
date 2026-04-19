import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ClerkUser = {
  id: string;
  email_addresses: {
    id: string;
    email_address: string;
  }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
};

function primaryEmail(user: ClerkUser): string | null {
  if (user.primary_email_address_id) {
    const match = user.email_addresses.find(
      (e) => e.id === user.primary_email_address_id,
    );
    if (match) return match.email_address;
  }
  return user.email_addresses[0]?.email_address ?? null;
}

function displayName(user: ClerkUser): string | null {
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return full || user.username || null;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerList = headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const user = event.data as unknown as ClerkUser;
      const email = primaryEmail(user);
      if (!email) {
        return new Response("User has no email", { status: 400 });
      }
      const { error } = await supabase.from("users").upsert(
        {
          id: user.id,
          email,
          display_name: displayName(user),
          avatar_url: user.image_url,
        },
        { onConflict: "id" },
      );
      if (error) {
        console.error("Clerk webhook user upsert failed", error);
        return new Response("DB error", { status: 500 });
      }
      break;
    }
    case "user.deleted": {
      const id = (event.data as { id?: string }).id;
      if (!id) return new Response("Missing user id", { status: 400 });
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        console.error("Clerk webhook user delete failed", error);
        return new Response("DB error", { status: 500 });
      }
      break;
    }
    default:
      // Ignore other event types silently.
      break;
  }

  return new Response(null, { status: 204 });
}
