import React, { useCallback, useEffect, useState } from "react";
import { Users as UsersIcon, Mail, Phone, Shield } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiRequest } from "@/api/apiClient";

const roleLabels = {
  comum: "Comum",
  supervisor: "Supervisor",
  supervisor_geral: "Supervisor Geral",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error("Falha ao carregar usuários:", error);
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId, newRole) => {
    const previousUsers = users;
    setUpdatingId(userId);
    try {
      await apiRequest(`/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast({ title: "Hierarquia atualizada" });
      await load();
    } catch (error) {
      setUsers(previousUsers);
      console.error("Falha ao atualizar hierarquia:", error);
      toast({ title: "Erro ao atualizar hierarquia", description: error.message, variant: "destructive" });
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-lg text-muted-foreground mt-1">Gerencie a hierarquia dos usuários do sistema.</p>
      </div>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent text-left"><tr>
              <th className="px-4 py-3 font-semibold text-sm">Nome</th><th className="px-4 py-3 font-semibold text-sm">E-mail</th><th className="px-4 py-3 font-semibold text-sm">Telefone</th><th className="px-4 py-3 font-semibold text-sm">Hierarquia</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => <tr key={u.id} className="hover:bg-accent/50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</div><span className="text-base font-medium">{u.full_name || "—"}</span></div></td>
                <td className="px-4 py-3 text-base"><div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-4 h-4" /> {u.email}</div></td>
                <td className="px-4 py-3 text-base">{u.telefone ? <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-4 h-4" /> {u.telefone}</div> : "—"}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-700" /><select aria-label={`Hierarquia de ${u.full_name || u.email}`} className="flex h-10 rounded-md border border-input bg-background px-2 text-sm" value={u.role || "comum"} disabled={updatingId === u.id} onChange={(e) => changeRole(u.id, e.target.value)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {users.length === 0 && <div className="bg-card rounded-2xl border border-border p-12 text-center"><UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-lg text-muted-foreground">Nenhum usuário cadastrado.</p></div>}
    </div>
  );
}
