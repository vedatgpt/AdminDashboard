import { ArrowUpDown, Plus, Tags } from "lucide-react";
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
            <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
              <ArrowUpDown className="w-4 h-4" />
              Sırala
            </button>
            <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none">
              <Plus className="w-4 h-4" />
              Kategori Ekle
            </button>
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
