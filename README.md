# NFTapi
store ChainSafe api as encrypted credential using LIT protocol
NFTapi API as an exchangable asset stored accessiable from a wallet signature

npm install lit-js-sdk @chainsafe/files-api-js ethers

# metamask connect

import { ethers } from 'ethers';

async function connectMetaMask() {
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return signer;
  } else {
    console.log('MetaMask is not installed');
  }
}

# Encrypt and Store ChainSafe API Key using Lit Protocol

import LitJsSdk from 'lit-js-sdk';
import { ChainSafeStorage } from '@chainsafe/files-api-js';

async function encryptAndStoreAPIKey(apiKey, apiKeyName) {
  const litNodeClient = new LitJsSdk.LitNodeClient();
  await litNodeClient.connect();

  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'ethereum' });

  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(apiKey);

  const accessControlConditions = [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'ethereum',
      method: 'eth_getBalance',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '>=',
        value: '0',
      },
    },
  ];

  const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain: 'ethereum',
  });

  const encryptedKey = {
    encryptedString: LitJsSdk.uint8arrayToString(new Uint8Array(await encryptedString.arrayBuffer()), 'base64'),
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
  };

  const storage = new ChainSafeStorage({
    token: 'YOUR_CHAINSAFE_TOKEN', // Replace with your ChainSafe API token
  });

  const result = await storage.upload({
    fileName: `${apiKeyName}.json`,
    fileBuffer: Buffer.from(JSON.stringify(encryptedKey)),
  });

  return result.fileURL;
}

# retrieve and decrypt chainsafe API key

async function retrieveAndDecryptAPIKey(fileURL) {
  const storage = new ChainSafeStorage({
    token: 'YOUR_CHAINSAFE_TOKEN', // Replace with your ChainSafe API token
  });

  const file = await storage.get(fileURL);
  const encryptedKey = JSON.parse(file);

  const litNodeClient = new LitJsSdk.LitNodeClient();
  await litNodeClient.connect();

  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'ethereum' });

  const { symmetricKey } = await litNodeClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt: encryptedKey.encryptedSymmetricKey,
    chain: 'ethereum',
    authSig,
  });

  const decryptedString = await LitJsSdk.decryptString(
    LitJsSdk.uint8arrayFromString(encryptedKey.encryptedString, 'base64'),
    symmetricKey
  );

  return decryptedString;
}
