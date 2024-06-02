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
