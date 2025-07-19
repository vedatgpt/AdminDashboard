import ModernNavbar from "@/components/ModernNavbar";

export default function Landing() {
  const handleSearch = (searchTerm: string) => {
    // İleride API search entegrasyonu
    console.log('Arama yapılıyor:', searchTerm);
  };

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            İlan Platformu
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Bireysel ve kurumsal kullanıcılar için güvenli ve kullanıcı dostu ilan platformu. 
            Aradığınız her şeyi bulun veya satın.
          </p>
        </div>
      </main>
    </div>
  );
}