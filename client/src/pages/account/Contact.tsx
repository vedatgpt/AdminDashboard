import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Phone, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const contactSchema = z.object({
  mobilePhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  businessPhone: z.string().optional(),
});

type ContactData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { user, refreshUser, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const contactForm = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      mobilePhone: user?.mobilePhone || "",
      whatsappNumber: user?.whatsappNumber || "",
      businessPhone: user?.businessPhone || "",
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactData) => {
      const response = await fetch("/api/user/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "İletişim bilgileri güncellenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "İletişim bilgileriniz güncellendi",
      });
      contactForm.reset({
        mobilePhone: data.mobilePhone || "",
        whatsappNumber: data.whatsappNumber || "",
        businessPhone: data.businessPhone || "",
      });
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İletişim bilgileri güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleContactUpdate = (data: ContactData) => {
    updateContactMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">İletişim Bilgilerim</h1>
          <p className="text-gray-600 mt-2">İletişim bilgilerinizi güncelleyin</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              İletişim Bilgileri
            </h2>
            <p className="text-gray-600 mt-1">
              Telefon numaralarınızı buradan güncelleyebilirsiniz
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={contactForm.handleSubmit(handleContactUpdate)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700">
                    Cep Telefonu
                  </label>
                  <input
                    id="mobilePhone"
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0555 123 4567"
                    {...contactForm.register("mobilePhone")}
                  />
                  {contactForm.formState.errors.mobilePhone && (
                    <p className="text-sm text-red-500">
                      {contactForm.formState.errors.mobilePhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">
                    WhatsApp Numarası
                  </label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0555 123 4567"
                    {...contactForm.register("whatsappNumber")}
                  />
                  {contactForm.formState.errors.whatsappNumber && (
                    <p className="text-sm text-red-500">
                      {contactForm.formState.errors.whatsappNumber.message}
                    </p>
                  )}
                </div>

                {user.role === "corporate" && (
                  <div className="space-y-2">
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">
                      İş Telefonu
                    </label>
                    <input
                      id="businessPhone"
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0212 345 6789"
                      {...contactForm.register("businessPhone")}
                    />
                    {contactForm.formState.errors.businessPhone && (
                      <p className="text-sm text-red-500">
                        {contactForm.formState.errors.businessPhone.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={updateContactMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {updateContactMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}