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
