import { Plus, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";

const columns = [
  { key: "name", label: "Lokasyon" },
  { key: "city", label: "Şehir" },
  { key: "district", label: "İlçe" },
  { key: "adsCount", label: "İlan Sayısı" },
  { key: "status", label: "Durum" },
  { key: "actions", label: "İşlemler" },
];

const filterOptions = [
  { value: "all", label: "Tüm Şehirler" },
  { value: "istanbul", label: "İstanbul" },
  { value: "ankara", label: "Ankara" },
  { value: "izmir", label: "İzmir" },
];

export default function Locations() {
  return (
    <div>
      <PageHeader
        title="Lokasyon Listesi"
        subtitle="Toplam 0 lokasyon"
        actions={
          <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none">
            <Plus className="w-4 h-4" />
            Lokasyon Ekle
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={[]}
        searchPlaceholder="Lokasyon ara..."
        filterOptions={filterOptions}
        emptyState={
          <EmptyState
            icon={MapPin}
            title="Henüz lokasyon yok"
            description="İlk lokasyonu eklemek için 'Lokasyon Ekle' butonuna tıklayın."
          />
        }
      />
    </div>
  );
}
