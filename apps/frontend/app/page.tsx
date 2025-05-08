"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loginSchema, LoginFormValues } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
	const { login } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginFormValues) => {
		await login.execute(data);
	};

	return (
		<div className="flex min-h-screen w-full bg-background">
			{/* Left side - Image/Brand section */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden border-r border-border">
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
						applications. Login to continue your journey.
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

			{/* Right side - Login form section */}
			<div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-4 sm:p-8">
				<div className="w-full max-w-md space-y-8">
					<div className="flex flex-col items-center mb-8">
						<div className="lg:hidden bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
							<div className="bg-primary w-8 h-8 rounded-lg"></div>
						</div>
						<h2 className="text-2xl font-bold text-foreground">
							Welcome back
						</h2>
						<p className="text-muted-foreground mt-2 text-center">
							Enter your credentials to access your account
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
										<div className="flex items-center justify-between">
											<label
												htmlFor="password"
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												Password
											</label>
											<Link
												href="/forgot-password"
												className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
											>
												Forgot password?
											</Link>
										</div>
										<Input
											id="password"
											placeholder="••••••••"
											type="password"
											autoCapitalize="none"
											autoComplete="current-password"
											disabled={isSubmitting}
											{...register("password")}
											aria-invalid={errors.password ? "true" : "false"}
											className={
												errors.password
													? "border-destructive focus-visible:ring-destructive/50"
													: ""
											}
										/>
										{errors.password && (
											<p className="text-sm text-destructive mt-1">
												{errors.password.message}
											</p>
										)}
									</div>

									<Button
										className="w-full"
										type="submit"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Signing in..." : "Sign in"}
									</Button>
								</div>
							</form>
						</CardContent>
						<CardFooter className="flex flex-col items-center justify-center p-6 bg-muted/10">
							<p className="text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link
									href="/register"
									className="font-medium text-primary hover:text-primary/80 transition-colors"
								>
									Create an account
								</Link>
							</p>
						</CardFooter>
					</Card>
				</div>
			</div>
		</div>
	);
}
