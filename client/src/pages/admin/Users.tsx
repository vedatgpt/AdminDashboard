import { Plus, Users as UsersIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";

const columns = [
  { key: "name", label: "Kullanıcı" },
  { key: "email", label: "E-posta" },
  { key: "role", label: "Rol" },
  { key: "status", label: "Durum" },
  { key: "createdAt", label: "Kayıt Tarihi" },
  { key: "actions", label: "İşlemler" },
];

const filterOptions = [
  { value: "all", label: "Tüm Roller" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "Kullanıcı" },
];

export default function Users() {
  return (
    <div>
      <PageHeader
        title="Kullanıcı Listesi"
        subtitle="Toplam 0 kullanıcı"
        actions={
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <Plus className="w-4 h-4 mr-2" />
            Kullanıcı Ekle
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        searchPlaceholder="Kullanıcı ara..."
        filterOptions={filterOptions}
        emptyState={
          <EmptyState
            icon={UsersIcon}
            title="Henüz kullanıcı yok"
            description="İlk kullanıcıyı eklemek için 'Kullanıcı Ekle' butonuna tıklayın."
          />
        }
      />
    </div>
  );
}
