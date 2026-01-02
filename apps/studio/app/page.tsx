import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import Dashboard from "../components/dashboard/Dashboard";

export default async function Home() {
  return (
    <div className="flex">
      <div className="py-4">
        <Sidebar />
      </div>

      <div className="w-full p-4">
        <Header /> 
        <Dashboard />
      </div>
      
    </div>
  );
}
