import { leadershipView } from "@/lib/imported/server";
import { requestProfileId } from "@/lib/demoProfileServer";
import LeadershipReport from "@/components/leadership/LeadershipReport";

// Ledningsrapport: the organisation's own portfolio (from the browser's
// data) and the municipality comparison for the active demo profile and the
// comparison group in ?grupp=, read on the server from the imported
// <profile>-peers.json so only the finished figures go to the browser.
export default function Page({ searchParams }: { searchParams: { grupp?: string | string[] } }) {
  const group = typeof searchParams.grupp === "string" ? searchParams.grupp : null;
  return <LeadershipReport view={leadershipView(requestProfileId(), group)} />;
}
