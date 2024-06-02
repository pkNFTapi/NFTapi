// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract pkNFT1155 is ERC1155, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    bool public encryptionEnabled = false; // Encryption is off by default

    struct PromptMetadata {
        string image;
        string description;
        string prompt;
    }

    struct EncryptedAPIKey {
        string name;
        string encryptedKey;
    }

    mapping(uint256 => PromptMetadata) private _tokenMetadata;
    mapping(address => EncryptedAPIKey) private _apiKeys;

    constructor(address initialOwner) ERC1155("https://storage.chainsafe.io/{id}.json") Ownable(initialOwner) {}

    function mint(
        address to,
        uint256 amount,
        string memory image,
        string memory description,
        string memory prompt,
        string memory encryptedPrompt
    ) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId, amount, "");

        // Store metadata
        _tokenMetadata[tokenId] = PromptMetadata({
            image: image,
            description: description,
            prompt: encryptionEnabled && bytes(encryptedPrompt).length > 0 ? encryptedPrompt : prompt
        });

        // Generate token URI
        string memory tokenUri = generateTokenURI(image, description, encryptionEnabled && bytes(encryptedPrompt).length > 0 ? encryptedPrompt : prompt);
        _setURI(tokenUri);
    }

    function toggleEncryption() public onlyOwner {
        encryptionEnabled = !encryptionEnabled;
    }

    function generateTokenURI(
        string memory image,
        string memory description,
        string memory prompt
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "data:application/json;base64,",
            encode(bytes(abi.encodePacked(
                '{"image":"', image, '","description":"', description, '","prompt":"', prompt, '"}'
            )))
        ));
    }

    function encode(bytes memory data) internal pure returns (string memory) {
        return string(abi.encodePacked(data));
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        PromptMetadata memory metadata = _tokenMetadata[tokenId];
        return generateTokenURI(metadata.image, metadata.description, metadata.prompt);
    }

    function tokenMetadata(uint256 tokenId) public view returns (PromptMetadata memory) {
        return _tokenMetadata[tokenId];
    }

    function storeEncryptedAPIKey(address user, string memory name, string memory encryptedKey) public onlyOwner {
        _apiKeys[user] = EncryptedAPIKey({
            name: name,
            encryptedKey: encryptedKey
        });
    }

    function getEncryptedAPIKey(address user) public view returns (string memory name, string memory encryptedKey) {
        EncryptedAPIKey memory apiKey = _apiKeys[user];
        return (apiKey.name, apiKey.encryptedKey);
    }
}

