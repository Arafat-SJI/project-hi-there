/**
 * Business Development Module Routes
 *
 * Client management, deals pipeline, and contacts.
 * Gated by the "business-dev" module / "enableClients" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import Clients from "@/pages/Clients";
import ClientForm from "@/pages/ClientForm";
import ClientDetail from "@/pages/ClientDetail";
import DealsPage from "./pages/DealsPage";
import DealDetailPage from "./pages/DealDetailPage";
import DealFormPage from "./pages/DealFormPage";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";

export const businessDevRoutes = (
  <Route element={<ModuleRoute module="business-dev" requiresFeatureFlag="enableClients" />}>
    <Route path="/clients" element={<Clients />} />
    <Route path="/clients/new" element={<ClientForm />} />
    <Route path="/clients/:id" element={<ClientDetail />} />
    <Route path="/clients/:id/edit" element={<ClientForm />} />
    <Route path="/deals" element={<DealsPage />} />
    <Route path="/deals/new" element={<DealFormPage />} />
    <Route path="/deals/:slug" element={<DealDetailPage />} />
    <Route path="/deals/:slug/edit" element={<DealFormPage />} />
    <Route path="/contacts" element={<ContactsPage />} />
    <Route path="/contacts/:id" element={<ContactDetailPage />} />
  </Route>
);
