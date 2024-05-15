import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import { getAccounts } from "@/lib/actions/bank.action";
import { getLoggedInUser } from "@/lib/actions/user.action";
import React from "react";

const Page = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return;
  const accounts = await getAccounts({ userId: loggedIn.$id });
  if (!accounts) return;
  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly Manage your bank accounts"
        />
        <div className="space-y-4">
          <h2 className="header-2">Your Cards</h2>
          <div className="flex flex-wrap gap-6">
            {accounts &&
              accounts.data.map((account: Account) => (
                <BankCard
                  key={account.id}
                  account={account}
                  userName={loggedIn.firstName}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Page;
