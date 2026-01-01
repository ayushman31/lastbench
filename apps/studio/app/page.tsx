import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="flex">
      <div className="py-4">
        <Sidebar />
      </div>

      <div className="w-full p-4">
        <Header />  
      </div>
      
    </div>
  );
}
