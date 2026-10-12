import { leadershipView } from "@/lib/imported/server";
import LeadershipReport from "@/components/leadership/LeadershipReport";

// Ledningsrapport: the organisation's own portfolio (from the browser's
// data) and the municipality comparison, read on the server from the
// imported peers.json so only the finished figures go to the browser.
export default function Page() {
  return <LeadershipReport view={leadershipView()} />;
}
