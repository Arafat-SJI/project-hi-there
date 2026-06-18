import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, FlaskConical } from "lucide-react";
import KnowledgePermissions from "@/pages/admin/KnowledgePermissions";
import KnowledgePlayground from "@/pages/admin/KnowledgePlayground";

export default function KnowledgeAccess() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "playground" ? "playground" : "permissions";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access & Testing</h1>
        <p className="text-muted-foreground mt-1">
          Configure source permissions and test RAG retrieval
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="playground" className="gap-2">
            <FlaskConical className="h-4 w-4" /> Playground
          </TabsTrigger>
        </TabsList>
        <TabsContent value="permissions" className="mt-6">
          <KnowledgePermissions />
        </TabsContent>
        <TabsContent value="playground" className="mt-6">
          <KnowledgePlayground />
        </TabsContent>
      </Tabs>
    </div>
  );
}
