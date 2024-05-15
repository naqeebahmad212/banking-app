import HeaderBox from "@/components/HeaderBox";
import PaymentTransferForm from "@/components/PaymentTransferForm";
import { getAccounts } from "@/lib/actions/bank.action";
import { getLoggedInUser } from "@/lib/actions/user.action";
import React from "react";

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return;
  const accounts = await getAccounts({ userId: loggedIn.$id });
  if (!accounts) return;
  const accountsData = accounts?.data;
  return (
    <section className="payment-transfer">
      <HeaderBox
        title="Payment Transfer"
        subtext="Write a note related to this transaction and Transfer funds to your bank account"
      />
      <section className="size-full pt-5">
        {accountsData && accountsData !== undefined && (
          <PaymentTransferForm accounts={accountsData} />
        )}
      </section>
    </section>
  );
};

export default Transfer;
