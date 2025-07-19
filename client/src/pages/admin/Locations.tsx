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
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <Plus className="w-4 h-4 mr-2" />
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
