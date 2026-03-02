import Landing from "@/components/Landing";
import { JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <div className="flex justify-center p-4 md:p-12 lg:p-36">
      <Landing />
    </div>
  );
}
