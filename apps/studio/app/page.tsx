import { auth } from "@repo/auth/server";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div>
      {session ? <div>Welcome, {session.user.name}!</div> : <div>Please sign in</div>}
    </div>
  );
}
