"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CustomInput from "./CustomInput";
import { authFormSchema } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/user.action";
import PlaidLink from "./PlaidLink";
import { Loader2 } from "lucide-react";

const AuthForm = ({ type }: { type: string }) => {
  const [user, setUser] = useState(null);
  const formSchema = authFormSchema(type);
  const router = useRouter();
  const [isLoading, setIsloading] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsloading(true);
      // sing up with appwrite and link plaid token

      if (type === "signup") {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };
        const newUser = await signUp(userData);
        setUser(newUser);
      } else if (type === "signin") {
        const response = await signIn({
          email: data.email,
          password: data.password,
        });
        if (response) {
          router.push("/");
        }
      }
    } catch (error) {
      setIsloading(false);
      console.log(error);
    } finally {
      setIsloading(false);
    }
  };
  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href={"/"} className=" flex cursor-pointer items-center gap-1">
          <Image src={"/icons/logo.svg"} width={34} height={34} alt="logo" />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
            Horizon
          </h1>
        </Link>
        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {user ? "Link Account" : type === "signin" ? "Sign In" : "Sign Up"}
            <p className="text-16 font-normal text-gray-600">
              {user
                ? "Link your account to get started"
                : "Please enter your details"}
            </p>
          </h1>
        </div>
      </header>
      {user ? (
        <div className="flex flex-col gap-4">
          <PlaidLink user={user} variant="primary" />
        </div>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {type === "signup" && (
                <>
                  <div className="flex gap-4">
                    <CustomInput
                      name="firstName"
                      placeholder={"Enter your first name"}
                      label="First Name"
                      control={form.control}
                    />{" "}
                    <CustomInput
                      name="lastName"
                      placeholder={"Enter your last name"}
                      label="Last Name"
                      control={form.control}
                    />
                  </div>
                  <CustomInput
                    name="address1"
                    placeholder={"Enter your address"}
                    label="Addres"
                    control={form.control}
                  />

                  <CustomInput
                    name="city"
                    placeholder={"Enter your City"}
                    label="City"
                    control={form.control}
                  />
                  <div className="flex gap-4">
                    <CustomInput
                      name="state"
                      placeholder={"Example: NY"}
                      label="State"
                      control={form.control}
                    />
                    <CustomInput
                      name="postalCode"
                      placeholder={"11101"}
                      label="Postal Code"
                      control={form.control}
                    />
                  </div>

                  <div className="flex gap-4">
                    <CustomInput
                      name="dateOfBirth"
                      placeholder={"YYYY-MM-DD"}
                      label="Date of Birth"
                      control={form.control}
                    />
                    <CustomInput
                      name="ssn"
                      placeholder={"Example:1234"}
                      label="SSN"
                      control={form.control}
                    />
                  </div>
                </>
              )}
              <CustomInput
                name="email"
                placeholder={"Enter your Email"}
                label="Email"
                control={form.control}
              />
              <CustomInput
                name="password"
                // type="password"
                placeholder={"Enter your Password"}
                label="Password"
                control={form.control}
              />

              <div className="flex flex-col gap-4">
                <Button className="form-btn" type="submit">
                  {isLoading
                    ? <Loader2 size={20} className="animate-spin" /> +
                      "Loading..."
                    : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
          <footer className="flex justify-center gap-1">
            <p className="text-14 font-normal text-gray-600">
              {type === "signin"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
            </p>
            <Link
              className="form-link"
              href={type === "signin" ? "/sign-up" : "/sign-in"}
            >
              {type === "signin" ? "Sign Up" : "Sign In"}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
