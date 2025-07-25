import logoPath from "@assets/landing_logo_1753445708713.png";

export default function LogoLoader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <img 
        src={logoPath} 
        alt="Logo" 
        className="w-16 h-16 object-contain animate-fade-in"
      />
    </div>
  );
}