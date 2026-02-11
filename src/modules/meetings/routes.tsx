/**
 * Meetings Module Routes
 *
 * Meeting management with schedule, detail (tabbed), series, transcripts,
 * AI match results, pending assignments, and knowledge base views.
 * Gated by the "meetings" module / "enableMeetings" feature flag.
 */
import { Route, Navigate } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

// V2 module-owned pages
import MeetingsSchedulePage from "./pages/MeetingsSchedulePage";
import MeetingDetailV2Page from "./pages/MeetingDetailV2Page";
import MeetingSeriesPage from "./pages/MeetingSeriesPage";
import MeetingTranscriptsPage from "./pages/MeetingTranscriptsPage";
import TranscriptDetailPage from "./pages/TranscriptDetailPage";
import MeetingAiMatchResultsPage from "./pages/MeetingAiMatchResultsPage";
import MeetingPendingAssignmentsPage from "./pages/MeetingPendingAssignmentsPage";
import MeetingIdRedirectPage from "./pages/MeetingIdRedirectPage";
import KnowledgeMeetingsPage from "./pages/KnowledgeMeetingsPage";

// Legacy pages (still used for create/edit forms)
import MeetingForm from "@/pages/MeetingForm";

export const meetingsRoutes = (
  <Route element={<ModuleRoute module="meetings" requiresFeatureFlag="enableMeetings" />}>
    {/* Schedule & detail */}
    <Route path="/meetings" element={<MeetingsSchedulePage />} />
    <Route path="/meetings/schedule" element={<MeetingsSchedulePage />} />
    <Route path="/meetings/schedule/:idOrSlug" element={<MeetingDetailV2Page />} />
    <Route path="/meetings/series" element={<MeetingSeriesPage />} />

    {/* Transcripts & AI features */}
    <Route path="/meetings/transcripts" element={<MeetingTranscriptsPage />} />
    <Route path="/meetings/transcripts/ai-match" element={<MeetingAiMatchResultsPage />} />
    <Route path="/meetings/transcripts/:id" element={<TranscriptDetailPage />} />
    <Route path="/meetings/pending-assignments" element={<MeetingPendingAssignmentsPage />} />

    {/* Knowledge base integration */}
    <Route path="/knowledge/meetings" element={<KnowledgeMeetingsPage />} />

    {/* Detail & redirect */}
    <Route path="/meetings/:id" element={<MeetingDetailV2Page />} />

    {/* Legacy create/edit forms */}
    <Route path="/meetings/new" element={<MeetingForm />} />
    <Route path="/meetings/:id/edit" element={<MeetingForm />} />

    {/* Legacy redirects */}
    <Route path="/meetings-v2" element={<Navigate to="/meetings/schedule" replace />} />
    <Route path="/meetings-v2/:id" element={<MeetingIdRedirectPage />} />
  </Route>
);

