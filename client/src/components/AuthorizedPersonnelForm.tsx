import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { insertAuthorizedPersonnelSchema, type InsertAuthorizedPersonnel, type AuthorizedPersonnel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
      firstName: personnel?.firstName || "",
      lastName: personnel?.lastName || "",
      email: personnel?.email || "",
      password: "",
      mobilePhone: personnel?.mobilePhone || "",
      whatsappNumber: personnel?.whatsappNumber || "",
    },
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Ad *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Ad"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Soyad *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Soyad"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="E-posta adresi"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">
              {personnel ? "Şifre (Boş bırakılırsa değişmez)" : "Şifre *"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
                placeholder={personnel ? "Yeni şifre (isteğe bağlı)" : "Şifre"}
                className="pr-10"
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
              <Label htmlFor="mobilePhone">Cep Telefonu</Label>
              <Input
                id="mobilePhone"
                {...form.register("mobilePhone")}
                placeholder="0555 123 45 67"
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Numarası</Label>
              <Input
                id="whatsappNumber"
                {...form.register("whatsappNumber")}
                placeholder="0555 123 45 67"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (personnel ? "Güncelleniyor..." : "Ekleniyor...") 
                : (personnel ? "Güncelle" : "Ekle")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}