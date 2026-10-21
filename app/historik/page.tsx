import { historyView } from "@/lib/imported/server";
import { requestProfileId } from "@/lib/demoProfileServer";
import HistoryPage from "@/components/imported/HistoryPage";

// "Er EU-historik": the municipality's own EU-funded projects, read on the
// server from the imported data (<profile>-history.json, <profile>-peers.json)
// for the active demo profile and the comparison group in ?grupp=, so only
// the finished view goes to the browser.
export default function Page({ searchParams }: { searchParams: { grupp?: string | string[] } }) {
  const group = typeof searchParams.grupp === "string" ? searchParams.grupp : null;
  return <HistoryPage history={historyView(requestProfileId(), group)} />;
}
