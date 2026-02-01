/**
 * Business Development Module Routes
 *
 * Client management (current). Deal pipeline, contacts, leads will be added later.
 * Gated by the "business-dev" module / "enableClients" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import Clients from "@/pages/Clients";
import ClientForm from "@/pages/ClientForm";
import ClientDetail from "@/pages/ClientDetail";

export const businessDevRoutes = (
  <Route element={<ModuleRoute module="business-dev" requiresFeatureFlag="enableClients" />}>
    <Route path="/clients" element={<Clients />} />
    <Route path="/clients/new" element={<ClientForm />} />
    <Route path="/clients/:id" element={<ClientDetail />} />
    <Route path="/clients/:id/edit" element={<ClientForm />} />
  </Route>
);
