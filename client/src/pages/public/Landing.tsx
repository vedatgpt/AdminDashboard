import DaisyNavbar from "@/components/DaisyNavbar";

export default function Landing() {
  const handleSearch = (searchTerm: string) => {
    // İleride API search entegrasyonu
    console.log('Arama yapılıyor:', searchTerm);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <DaisyNavbar onSearch={handleSearch} />
      
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-base-content">İlan Platformu</h1>
            <p className="py-6 text-base-content/70">
              Bireysel ve kurumsal kullanıcılar için güvenli ve kullanıcı dostu ilan platformu. 
              Aradığınız her şeyi bulun veya satın alın.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-primary">İlan Ver</button>
              <button className="btn btn-outline">Keşfet</button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-base-content mb-4">Neden Bizi Seçmelisiniz?</h2>
            <p className="text-base-content/70">İlan verme ve alışverişte size en iyi deneyimi sunuyoruz</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="avatar mb-4">
                  <div className="w-16 rounded-full bg-primary text-primary-content flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="card-title justify-center">Güvenli İşlemler</h3>
                <p className="text-base-content/70">Tüm işlemleriniz güvenli ve şifrelenmiş altyapı ile korunur</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="avatar mb-4">
                  <div className="w-16 rounded-full bg-secondary text-secondary-content flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="card-title justify-center">Hızlı İşlem</h3>
                <p className="text-base-content/70">İlanlarınız anında yayına alınır ve hızla alıcıya ulaşır</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="avatar mb-4">
                  <div className="w-16 rounded-full bg-accent text-accent-content flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="card-title justify-center">Geniş Kitle</h3>
                <p className="text-base-content/70">Binlerce aktif kullanıcı ile geniş bir pazara ulaşın</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}