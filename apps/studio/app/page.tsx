import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { Sidebar } from "../components/Sidebar";
import ActionSearchBar from "../components/ActionSearchBar";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="flex">
      <Sidebar />
      <ActionSearchBar />
    </div>
  );
}
