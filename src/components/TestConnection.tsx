import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export function TestConnection() {
  const [result, setResult] = useState<string | null>(null);
  const testConnection = useMutation(api.backend.users.testConnection);
  const createUser = useMutation(api.backend.users.createUser);

  const handleTest = async () => {
    try {
      const res = await testConnection({});
      setResult(res.message);
    } catch (err: any) {
      setResult("Error: " + err.message);
    }
  };

  const handleCreateTestUser = async () => {
    try {
      const res = await createUser({
        email: `test_${Date.now()}@test.com`,
        name: "Test User",
      });
      setResult("User created: " + JSON.stringify(res));
    } catch (err: any) {
      setResult("Create Error: " + err.message);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-xl space-y-2">
      <Button onClick={handleTest} className="bg-green-600 mr-2">
        Test Connection
      </Button>
      <Button onClick={handleCreateTestUser} className="bg-amber-500">
        Test Create User
      </Button>
      {result && <p className="mt-2 text-white text-sm">{result}</p>}
    </div>
  );
}
