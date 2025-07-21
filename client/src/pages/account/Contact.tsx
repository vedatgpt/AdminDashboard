import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Phone, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POPULAR_COUNTRIES, formatPhoneAsYouType, cleanPhoneInput, validatePhoneNumber } from "@/lib/phoneUtils";

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
  
  // Country code states
  const [mobileCountry, setMobileCountry] = useState('TR');
  const [whatsappCountry, setWhatsappCountry] = useState('TR');
  const [businessCountry, setBusinessCountry] = useState('TR');

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
      <div className="min-h-60 flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div className="animate-spin inline-block size-6 border-3 border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
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
                  <div className="relative">
                    <input
                      id="mobilePhone" 
                      type="tel"
                      inputMode="numeric"
                      className="py-2.5 sm:py-3 px-4 ps-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                      placeholder={formatPhoneAsYouType('5551234567', mobileCountry)}
                      value={contactForm.watch("mobilePhone") ? formatPhoneAsYouType(contactForm.watch("mobilePhone"), mobileCountry) : ''}
                      onChange={(e) => {
                        const cleaned = cleanPhoneInput(e.target.value);
                        contactForm.setValue("mobilePhone", cleaned);
                      }}
                    />
                    <div className="absolute inset-y-0 start-0 flex items-center text-gray-500 ps-2">
                      <select 
                        value={mobileCountry}
                        onChange={(e) => setMobileCountry(e.target.value)}
                        className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none pr-2"
                      >
                        {POPULAR_COUNTRIES.map((country) => (
                          <option key={country.country} value={country.country}>
                            {country.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  <div className="relative">
                    <input
                      id="whatsappNumber"
                      type="tel"
                      inputMode="numeric"
                      className="py-2.5 sm:py-3 px-4 ps-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                      placeholder={formatPhoneAsYouType('5551234567', whatsappCountry)}
                      value={contactForm.watch("whatsappNumber") ? formatPhoneAsYouType(contactForm.watch("whatsappNumber"), whatsappCountry) : ''}
                      onChange={(e) => {
                        const cleaned = cleanPhoneInput(e.target.value);
                        contactForm.setValue("whatsappNumber", cleaned);
                      }}
                    />
                    <div className="absolute inset-y-0 start-0 flex items-center text-gray-500 ps-2">
                      <select 
                        value={whatsappCountry}
                        onChange={(e) => setWhatsappCountry(e.target.value)}
                        className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none pr-2"
                      >
                        {POPULAR_COUNTRIES.map((country) => (
                          <option key={country.country} value={country.country}>
                            {country.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                    <div className="relative">
                      <input
                        id="businessPhone"
                        type="tel"
                        inputMode="numeric"
                        className="py-2.5 sm:py-3 px-4 ps-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                        placeholder={formatPhoneAsYouType('2123456789', businessCountry)}
                        value={contactForm.watch("businessPhone") ? formatPhoneAsYouType(contactForm.watch("businessPhone"), businessCountry) : ''}
                        onChange={(e) => {
                          const cleaned = cleanPhoneInput(e.target.value);
                          contactForm.setValue("businessPhone", cleaned);
                        }}
                      />
                      <div className="absolute inset-y-0 start-0 flex items-center text-gray-500 ps-2">
                        <select 
                          value={businessCountry}
                          onChange={(e) => setBusinessCountry(e.target.value)}
                          className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none pr-2"
                        >
                          {POPULAR_COUNTRIES.map((country) => (
                            <option key={country.country} value={country.country}>
                              {country.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
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