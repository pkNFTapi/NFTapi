// App.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LitJsSdk from 'lit-js-sdk';
import { ChainSafeStorage } from '@chainsafe/files-api-js';
import pkNFT1155ABI from './pkNFT1155ABI';

const CONTRACT_ADDRESS = "0xYourContractAddress"; // Replace with your contract address

const App = () => {
    const [apiKey, setApiKey] = useState('');
    const [apiKeyName, setApiKeyName] = useState('');
    const [fileURL, setFileURL] = useState('');
    const [contract, setContract] = useState(null);
    const [signer, setSigner] = useState(null);

    useEffect(() => {
        connectMetaMask();
    }, []);

    const connectMetaMask = async () => {
        if (window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            setSigner(signer);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, pkNFT1155ABI, signer);
            setContract(contract);
        } else {
            console.log('MetaMask is not installed');
        }
    };

    const encryptAndStoreAPIKey = async () => {
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

        setFileURL(result.fileURL);
        console.log('API Key encrypted and stored:', result.fileURL);

        await contract.storeEncryptedAPIKey(signer.getAddress(), apiKeyName, result.fileURL);
    };

    const retrieveAndDecryptAPIKey = async () => {
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

        console.log('Decrypted API Key:', decryptedString);
    };

    return (
        <div>
            <h1>Encrypt and Store API Key</h1>
            <input
                type="text"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="API Key Name"
            />
            <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
            />
            <button onClick={encryptAndStoreAPIKey}>Encrypt and Store API Key</button>

            <h1>Retrieve and Decrypt API Key</h1>
            <input
                type="text"
                value={fileURL}
                onChange={(e) => setFileURL(e.target.value)}
                placeholder="File URL"
            />
            <button onClick={retrieveAndDecryptAPIKey}>Retrieve and Decrypt API Key</button>
        </div>
    );
};

export default App;
