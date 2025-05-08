"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { registerFormSchema, RegisterFormValues } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/useAuth";
import { InfoIcon } from "lucide-react";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    await registerUser.execute(data);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tl from-primary/10 via-primary/5 to-background relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-12">
          <div className="bg-primary/10 w-20 h-20 rounded-xl flex items-center justify-center mb-8">
            <div className="bg-primary w-12 h-12 rounded-lg"></div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-center">
            Halogen Platform
          </h1>
          <p className="text-center text-muted-foreground max-w-md mb-8">
            The complete solution for building, managing, and scaling your web
            applications. Create an account to start your journey.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-lg">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm shadow-sm"
              ></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Halogen. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Register form section */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center mb-8">
            <div className="lg:hidden bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <div className="bg-primary w-8 h-8 rounded-lg"></div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Create an account
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              Sign up to get started with Halogen
            </p>
          </div>

          <Card className="border-border/40">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isSubmitting}
                      {...register("email")}
                      aria-invalid={errors.email ? "true" : "false"}
                      className={
                        errors.email
                          ? "border-destructive focus-visible:ring-destructive/50"
                          : ""
                      }
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Password
                      </label>
                    </div>
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...register("password")}
                      aria-invalid={errors.password ? "true" : "false"}
                      className={
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive/50"
                          : ""
                      }
                    />
                    {errors.password ? (
                      <p className="text-sm text-destructive mt-1">
                        {errors.password.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <InfoIcon className="h-3 w-3" />
                        Password must contain at least 8 characters, including uppercase, lowercase, number, and special character
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      placeholder="••••••••"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...register("confirmPassword")}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      className={
                        errors.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive/50"
                          : ""
                      }
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-center p-6 bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}