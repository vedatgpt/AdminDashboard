import { useState, useEffect } from "react";
import { Phone, Plus, Trash2, Edit } from "lucide-react";
import { POPULAR_COUNTRIES } from "@/lib/phoneUtils";

interface CountryFormData {
  code: string;
  country: string;
  name: string;
}

export default function PhoneCountries() {
  const [countries, setCountries] = useState(POPULAR_COUNTRIES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<CountryFormData>({
    code: '',
    country: '',
    name: ''
  });

  const resetForm = () => {
    setFormData({ code: '', country: '', name: '' });
    setEditingIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingIndex !== null) {
      // Edit existing country
      const updatedCountries = [...countries];
      updatedCountries[editingIndex] = formData;
      setCountries(updatedCountries);
    } else {
      // Add new country
      setCountries([...countries, formData]);
    }
    
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEdit = (index: number) => {
    setFormData(countries[index]);
    setEditingIndex(index);
    setIsAddModalOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Bu ülke kodunu silmek istediğinizden emin misiniz?')) {
      const updatedCountries = countries.filter((_, i) => i !== index);
      setCountries(updatedCountries);
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Telefon Ülke Kodları</h1>
        <p className="text-gray-600 mt-2">
          Telefon girişlerinde kullanılan ülke kodlarını yönetin
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Aktif Ülke Kodları
            </h2>
            <p className="text-gray-600 mt-1">
              Toplam {countries.length} ülke kodu tanımlı
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{country.name}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Kod: <span className="font-mono">{country.code}</span>
                </div>
                <div className="text-sm text-gray-600">
                  ISO: <span className="font-mono">{country.country}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Ülke Kodunu Düzenle' : 'Yeni Ülke Kodu Ekle'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Türkiye"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Kodu
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="+90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISO Kodu
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="TR"
                  maxLength={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingIndex !== null ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">⚠️ Önemli Not</h3>
        <p className="text-sm text-yellow-700">
          Bu sayfa şu anda sadece önizleme amaçlıdır. Değişiklikler kaybolacaktır. 
          Kalıcı değişiklik için <code>client/src/lib/phoneUtils.ts</code> dosyasını düzenleyin.
        </p>
      </div>
    </div>
  );
}