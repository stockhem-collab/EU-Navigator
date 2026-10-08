import { historyView } from "@/lib/imported/server";
import HistoryPage from "@/components/imported/HistoryPage";

// "Er EU-historik": the municipality's own EU-funded projects, read on the
// server from the imported data (uppsala-history.json, peers.json) so only
// the finished view goes to the browser.
export default function Page() {
  return <HistoryPage history={historyView()} />;
}
