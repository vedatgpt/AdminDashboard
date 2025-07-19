import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuthorizedPersonnelSchema, type InsertAuthorizedPersonnel, type AuthorizedPersonnel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff, X } from "lucide-react";

interface AuthorizedPersonnelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertAuthorizedPersonnel | Partial<InsertAuthorizedPersonnel>) => Promise<void>;
  personnel?: AuthorizedPersonnel;
  isSubmitting: boolean;
  title: string;
}

export default function AuthorizedPersonnelForm({
  isOpen,
  onClose,
  onSubmit,
  personnel,
  isSubmitting,
  title
}: AuthorizedPersonnelFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<InsertAuthorizedPersonnel>({
    resolver: zodResolver(insertAuthorizedPersonnelSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      mobilePhone: "",
      whatsappNumber: "",
    },
  });

  // Update form values when personnel data changes
  useEffect(() => {
    if (personnel) {
      form.reset({
        firstName: personnel.firstName || "",
        lastName: personnel.lastName || "",
        email: personnel.email || "",
        password: "",
        mobilePhone: personnel.mobilePhone || "",
        whatsappNumber: personnel.whatsappNumber || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        mobilePhone: "",
        whatsappNumber: "",
      });
    }
  }, [personnel, form]);

  const handleSubmit = async (data: InsertAuthorizedPersonnel) => {
    try {
      // For updates, don't send password if it's empty
      const submitData = personnel && !data.password 
        ? { ...data, password: undefined } 
        : data;
      
      await onSubmit(submitData);
      form.reset();
      onClose();
      toast({
        title: "Başarılı",
        description: personnel ? "Yetkili kişi güncellendi" : "Yetkili kişi eklendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || (personnel ? "Güncelleme başarısız" : "Ekleme başarısız"),
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad *
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ad"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad *
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Soyad"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta *
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="E-posta adresi"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {personnel ? "Şifre (Boş bırakılırsa değişmez)" : "Şifre *"}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={personnel ? "Yeni şifre (isteğe bağlı)" : "Şifre"}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Cep Telefonu
                </label>
                <input
                  id="mobilePhone"
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0555 123 45 67"
                  {...form.register("mobilePhone")}
                />
              </div>
              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Numarası
                </label>
                <input
                  id="whatsappNumber"
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0555 123 45 67"
                  {...form.register("whatsappNumber")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? (personnel ? "Güncelleniyor..." : "Ekleniyor...") 
                  : (personnel ? "Güncelle" : "Ekle")
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}