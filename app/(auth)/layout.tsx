import { getLoggedInUser } from "@/lib/actions/user.action";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();

  if (loggedIn) redirect("/");
  return (
    <main className="flex min-h-screen w-full justify-between font-inter">
      {children}
      <div className="auth-asset">
        <Image
          src="/icons/auth-image.svg"
          width={500}
          height={500}
          alt="auth"
        />
      </div>
    </main>
  );
}
