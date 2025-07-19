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
            <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
            <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none">
              <Plus className="w-4 h-4" />
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
