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
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrele
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              İlan Ekle
            </Button>
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
