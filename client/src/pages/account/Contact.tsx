import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Phone, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
      // Update form with new data
      contactForm.reset({
        mobilePhone: data.mobilePhone || "",
        whatsappNumber: data.whatsappNumber || "",
        businessPhone: data.businessPhone || "",
      });
      // Update the cached user data immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      // Force a refetch to ensure sync
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
    return null; // Will redirect to login via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">İletişim Bilgilerim</h1>
          <p className="text-gray-600 mt-2">İletişim bilgilerinizi güncelleyin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              İletişim Bilgileri
            </CardTitle>
            <CardDescription>
              Telefon numaralarınızı buradan güncelleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={contactForm.handleSubmit(handleContactUpdate)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Phone - for all users */}
                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Cep Telefonu</Label>
                  <Input
                    id="mobilePhone"
                    type="tel"
                    {...contactForm.register("mobilePhone")}
                    placeholder="0555 123 4567"
                  />
                  {contactForm.formState.errors.mobilePhone && (
                    <p className="text-sm text-red-500">
                      {contactForm.formState.errors.mobilePhone.message}
                    </p>
                  )}
                </div>

                {/* WhatsApp Number - for all users */}
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Numarası</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    {...contactForm.register("whatsappNumber")}
                    placeholder="0555 123 4567"
                  />
                  {contactForm.formState.errors.whatsappNumber && (
                    <p className="text-sm text-red-500">
                      {contactForm.formState.errors.whatsappNumber.message}
                    </p>
                  )}
                </div>

                {/* Business Phone - only for corporate users */}
                {user.role === "corporate" && (
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">İş Telefonu</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      {...contactForm.register("businessPhone")}
                      placeholder="0212 345 6789"
                    />
                    {contactForm.formState.errors.businessPhone && (
                      <p className="text-sm text-red-500">
                        {contactForm.formState.errors.businessPhone.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateContactMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateContactMutation.isPending ? "Güncelleniyor..." : "İletişim Bilgilerini Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}