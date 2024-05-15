"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, createSessionClient } from "../appwrite"
import { cookies } from "next/headers"
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils"
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid"
import { plaidClient } from "../plaid"
import { revalidatePath } from "next/cache"
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions"

const {APPWRITE_DATABASE_ID : DATABASE_ID , 
  APPWRITE_USER_COLLECTION_ID : USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID : BANK_COLLECTION_ID
}=process.env



export const getUserInfo = async ({userId} : getUserInfoProps) => {
    try {
        const { database } = await createAdminClient();
        const user = await database.listDocuments(DATABASE_ID!, USER_COLLECTION_ID!,
          [Query.equal("userId", [userId])])
        return parseStringify(user.documents[0])
    } catch (error) {
        console.log(error)
        
    }
}
export const signIn = async ({email , password} : signInProps) => {
    try {
        const { account } = await createAdminClient();
        const session = await account.createEmailPasswordSession(email, password);
      
        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });
        const user = await getUserInfo({userId:session.userId}) 
        return parseStringify(user)
    } catch (error) {
        console.log(error)
        
    }
    
}


export const signUp = async ({password , ...userData}: SignUpParams) => {
    // use appwrite to create user account
    let newUserAccount;
    try {
        const { account, database } = await createAdminClient();
        const { email , firstName , lastName } = userData

        newUserAccount = await account.create(ID.unique(), email, password,`${firstName } ${lastName}`);

        if(!newUserAccount) throw new Error('Error creating user')
          const dwollaCustomerUrl=await createDwollaCustomer({
        ...userData,
        type:'personal',

        })
        if(!dwollaCustomerUrl) throw new Error('Error creating dwolla customer')

          const dwollaCustomerId=extractCustomerIdFromUrl(dwollaCustomerUrl)

          const newUser=await database.createDocument(DATABASE_ID!,USER_COLLECTION_ID!,ID.unique(),{
            ...userData,
            userId:newUserAccount.$id,
            dwollaCustomerId,
            dwollaCustomerUrl
          })
        const session = await account.createEmailPasswordSession(email, password);
      
        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });
        
        return parseStringify(newUser)
    } catch (error) {
        console.log(error)
        
    }
    
}


// ... your initilization functions

export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      const result = await account.get();
      const user= await getUserInfo({userId:result.$id})
      return parseStringify(user);
    } catch (error) {
      return null;
    }
  }



  export async function logoutAccount() {
      try {
        const {account} = await createSessionClient();
        cookies().delete('appwrite-session')
        await account.deleteSession("current");
        return true

        
      } catch (error) {
        console.log(error)
      }
  }


  export async function createLinkToken(user:User) {
    try {
      const tokenParams={
        user:{
          client_user_id: user.$id
        },
        client_name: `${user.firstName} ${user.lastName}`,
        products: ["auth"] as Products[],
        language:'en',
        country_codes:['US'] as CountryCode[],
      }

      const response = await plaidClient.linkTokenCreate(tokenParams);

      return parseStringify({linkToken:response.data.link_token})
      
    } catch (error) {
      console.log(error)
      
    }
    
  }

  export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    shareableId

  }:createBankAccountProps) => {
    try {
      const {database}=await createAdminClient()
      const bankAccount= await database.createDocument(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        ID.unique(),{      
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    shareableId
        }
      )

      return parseStringify(bankAccount)
      
    } catch (error) {
      console.log(error)
    }
  }


  export const exchangePublicToken = async ({ publicToken, user }:exchangePublicTokenProps) => {

    try {
      // exchange public token for access token and item_id
      const response = await plaidClient.itemPublicTokenExchange({public_token:publicToken});
      const accessToken=response.data.access_token
      const itemId=response.data.item_id
      // get account info from plaid using access token
      const accountsResponse=await plaidClient.accountsGet({access_token:accessToken});
      const accountData=accountsResponse.data.accounts[0]
      // create a processor token for dwolla using access token and account id
      const request:ProcessorTokenCreateRequest={
        access_token:accessToken,
        account_id:accountData.account_id,
        processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
      }

      const processorTokenResponse=await plaidClient.processorTokenCreate(request);
      const processorToken=processorTokenResponse.data.processor_token
      // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

       // If the funding source URL is not created, throw an error

       if (!fundingSourceUrl) throw new Error('Error creating funding source url on page user.action line 184');

       // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
          await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            shareableId: encryptId(accountData.account_id),
    });
      // Revalidate the path to reflect the changes
      revalidatePath("/");

      // Return a success message
      return parseStringify({
        publicTokenExchange: "complete",
      });
    } catch (error) {
      console.log('error accourd while create exchangePublicToken',error)
    }
    
  }


  export const getBanks = async ({ userId }: getBanksProps) => {
    try {
      const { database } = await createAdminClient();
      const banks = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal("userId", [userId])]
      )
      return parseStringify(banks.documents)
    } catch (error) {
      console.log(error, 'error accourd while getBanks')
    }
  }


  export const getBank=async({documentId}:getBankProps)=>{
    try {
      
      const { database } = await createAdminClient();
      const bank = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal("$id", [documentId])]
      )

      return parseStringify(bank.documents[0])
      
    } catch (error) {
      console.log(error, 'error accourd while getBank')  
      
    }
  }


  export const getBankByAccountId=async({accountId}:getBankByAccountIdProps)=>{
    try {
      
      const { database } = await createAdminClient();
      const bank = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal("accountId", [accountId])]

        
      )
      if(bank.total !== 1) return null

      return parseStringify(bank.documents[0])
      
    } catch (error) {
      console.log(error, 'error accourd while getBank')  
      
    }
  }
  