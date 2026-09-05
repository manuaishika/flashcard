import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main className="mx-auto flex min-h-screen max-w-reading flex-col justify-center px-6 py-16">
      <p className="font-serif text-sm italic text-ink-faint">Lemma</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
        The words you meet while reading, kept with your own understanding.
      </h1>
      <p className="mt-6 max-w-md text-ink-soft">
        Capture a word in context. Get a short explanation of how it&rsquo;s used here — then write
        what it means to you. That note is the thing you keep; spaced review brings it back.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-paper-raised transition hover:bg-accent-soft"
        >
          Get started
        </Link>
        <Link href="/login" className="text-sm text-ink-soft underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </main>
  );
}
