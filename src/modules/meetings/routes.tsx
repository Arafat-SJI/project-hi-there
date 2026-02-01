/**
 * Meetings Module Routes
 *
 * Meeting management with schedule, detail (tabbed), series, and legacy create/edit views.
 * Gated by the "meetings" module / "enableMeetings" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

// V2 module-owned pages
import MeetingsSchedulePage from "./pages/MeetingsSchedulePage";
import MeetingDetailV2Page from "./pages/MeetingDetailV2Page";
import MeetingSeriesPage from "./pages/MeetingSeriesPage";

// Legacy pages (still used for create/edit forms)
import MeetingForm from "@/pages/MeetingForm";

export const meetingsRoutes = (
  <Route element={<ModuleRoute module="meetings" requiresFeatureFlag="enableMeetings" />}>
    {/* V2 routes */}
    <Route path="/meetings" element={<MeetingsSchedulePage />} />
    <Route path="/meetings/series" element={<MeetingSeriesPage />} />
    <Route path="/meetings/:id" element={<MeetingDetailV2Page />} />

    {/* Legacy create/edit forms */}
    <Route path="/meetings/new" element={<MeetingForm />} />
    <Route path="/meetings/:id/edit" element={<MeetingForm />} />
  </Route>
);
