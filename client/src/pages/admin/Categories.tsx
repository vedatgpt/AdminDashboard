import { ArrowUpDown, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";

const columns = [
  { key: "name", label: "Kategori" },
  { key: "parent", label: "Üst Kategori" },
  { key: "adsCount", label: "İlan Sayısı" },
  { key: "status", label: "Durum" },
  { key: "createdAt", label: "Oluşturulma Tarihi" },
  { key: "actions", label: "İşlemler" },
];

const filterOptions = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "parent", label: "Ana Kategori" },
  { value: "child", label: "Alt Kategori" },
];

export default function Categories() {
  return (
    <div>
      <PageHeader
        title="Kategori Listesi"
        subtitle="Toplam 0 kategori"
        actions={
          <>
            <Button variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sırala
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Kategori Ekle
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        searchPlaceholder="Kategori ara..."
        filterOptions={filterOptions}
        emptyState={
          <EmptyState
            icon={Tags}
            title="Henüz kategori yok"
            description="İlk kategoriyi eklemek için 'Kategori Ekle' butonuna tıklayın."
          />
        }
      />
    </div>
  );
}
