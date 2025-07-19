import { Filter, Plus, Megaphone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";

const columns = [
  { key: "title", label: "İlan" },
  { key: "category", label: "Kategori" },
  { key: "location", label: "Lokasyon" },
  { key: "status", label: "Durum" },
  { key: "publishedAt", label: "Yayın Tarihi" },
  { key: "actions", label: "İşlemler" },
];

const filterOptions = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Pasif" },
  { value: "pending", label: "Beklemede" },
];

export default function Ads() {
  return (
    <div>
      <PageHeader
        title="İlan Listesi"
        subtitle="Toplam 0 ilan"
        actions={
          <>
            <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <Filter className="w-4 h-4 mr-2" />
              Filtrele
            </button>
            <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <Plus className="w-4 h-4 mr-2" />
              İlan Ekle
            </button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        searchPlaceholder="İlan ara..."
        filterOptions={filterOptions}
        emptyState={
          <EmptyState
            icon={Megaphone}
            title="Henüz ilan yok"
            description="İlk ilanı eklemek için 'İlan Ekle' butonuna tıklayın."
          />
        }
      />
    </div>
  );
}
