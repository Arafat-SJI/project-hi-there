/**
 * EOS Module Routes
 *
 * V/TO, OKRs, Issues, Scorecard, and Accountability pages.
 * Gated by the "eos" module.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

// Module-owned pages
import EOSHubPage from "./pages/EOSHubPage";
import VTOPage from "./pages/VTOPage";
import OKRsPage from "./pages/OKRsPage";
import IssuesPage from "./pages/IssuesPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import ScorecardPage from "./pages/ScorecardPage";
import AccountabilityPage from "./pages/AccountabilityPage";
import MyAccountabilityPage from "./pages/MyAccountabilityPage";

export const eosRoutes = (
  <Route element={<ModuleRoute module="eos" />}>
    <Route path="/eos" element={<EOSHubPage />} />
    <Route path="/eos/vto" element={<VTOPage />} />
    <Route path="/eos/issues" element={<IssuesPage />} />
    <Route path="/eos/issues/:issueId" element={<IssueDetailPage />} />
    <Route path="/eos/scorecard" element={<ScorecardPage />} />
    <Route path="/eos/accountability" element={<AccountabilityPage />} />
    <Route path="/eos/my-accountability" element={<MyAccountabilityPage />} />
    <Route path="/okrs" element={<OKRsPage />} />
  </Route>
);
