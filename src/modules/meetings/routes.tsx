/**
 * Meetings Module Routes
 *
 * Meeting management with create, detail, and edit views.
 * Gated by the "meetings" module / "enableMeetings" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import Meetings from "@/pages/Meetings";
import MeetingForm from "@/pages/MeetingForm";
import MeetingDetail from "@/pages/MeetingDetail";

export const meetingsRoutes = (
  <Route element={<ModuleRoute module="meetings" requiresFeatureFlag="enableMeetings" />}>
    <Route path="/meetings" element={<Meetings />} />
    <Route path="/meetings/new" element={<MeetingForm />} />
    <Route path="/meetings/:id" element={<MeetingDetail />} />
    <Route path="/meetings/:id/edit" element={<MeetingForm />} />
  </Route>
);
