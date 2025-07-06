# Guide d'utilisation du système de fractionnalisation de NFT

Ce système permet de créer des NFTs et de les fractionner automatiquement en parts (tokens ERC20) que les utilisateurs peuvent acheter.

## Architecture

Le système comprend 3 contrats principaux :

1. **NFTFractionalizationFactory** : Le contrat principal qui gère tout
2. **FractionalizedNFT** : Le contrat ERC721 qui contient les NFTs
3. **FractionalToken** : Un contrat ERC20 pour chaque NFT, représentant ses parts

## Déploiement

```solidity
// Déployer le factory (seul le owner peut créer des NFTs)
NFTFractionalizationFactory factory = new NFTFractionalizationFactory(
    "Mes NFTs Fractionnés", // Nom de la collection NFT
    "MNFT"                  // Symbole de la collection NFT
);
```

## Création d'un NFT fractionné

Seul le propriétaire du factory peut créer des NFTs :

```solidity
// Créer un NFT avec 1000 parts à 0.001 ETH chacune
(uint256 tokenId, address fractionalToken) = factory.createFractionalizedNFT(
    1000,              // Nombre total de parts
    0.001 ether,       // Prix par part en wei
    "Art NFT #1",      // Nom du token ERC20
    "ART1"             // Symbole du token ERC20
);
```

## Achat de parts

N'importe qui peut acheter des parts d'un NFT :

```solidity
// Acheter 100 parts du NFT tokenId=1
uint256 tokenId = 1;
uint256 sharesToBuy = 100;
uint256 totalCost = sharesToBuy * 0.001 ether; // 0.1 ETH

factory.purchaseShares{value: totalCost}(tokenId, sharesToBuy);
```

## Vente de parts

Pour vendre des parts, l'utilisateur doit interagir directement avec le contrat de token fractionné :

```solidity
// Obtenir le contrat de token fractionné
FractionalToken fractionalToken = factory.getFractionalTokenContract(tokenId);

// Vendre 50 parts
fractionalToken.sellShares(50);
```

## Informations

```solidity
// Obtenir des informations sur un NFT
(
    address fractionalTokenAddress,
    address nftOwner,
    uint256 totalShares,
    uint256 sharesSold,
    uint256 sharePrice,
    bool tradingEnabled,
    uint256 availableShares
) = factory.getNFTInfo(tokenId);

// Obtenir les informations d'un utilisateur pour un NFT spécifique
(
    uint256 shareBalance,
    uint256 sharesPurchased,
    uint256 shareValue
) = factory.getUserNFTInfo(tokenId, userAddress);

// Obtenir tous les NFTs créés
uint256[] memory allNFTs = factory.getAllNFTs();
```

## Gestion (Owner seulement)

```solidity
// Mettre à jour le prix des parts
factory.updateSharePrice(tokenId, 0.002 ether);

// Activer/désactiver le trading
factory.setTradingEnabled(tokenId, false);

// Retirer les ETH accumulés d'un token fractionné
factory.withdrawFromFractionalToken(tokenId);
```

## Exemple complet d'utilisation

```solidity
contract ExampleUsage {
    NFTFractionalizationFactory public factory;
    
    constructor() {
        // 1. Déployer le factory
        factory = new NFTFractionalizationFactory("Art Collection", "ART");
        
        // 2. Créer un NFT fractionné
        (uint256 tokenId,) = factory.createFractionalizedNFT(
            1000,           // 1000 parts
            0.01 ether,     // 0.01 ETH par part
            "Masterpiece #1",
            "MP1"
        );
    }
    
    // Fonction pour acheter des parts
    function buyShares(uint256 tokenId, uint256 shares) external payable {
        factory.purchaseShares{value: msg.value}(tokenId, shares);
    }
    
    // Fonction pour vendre des parts
    function sellShares(uint256 tokenId, uint256 shares) external {
        FractionalToken fractionalToken = factory.getFractionalTokenContract(tokenId);
        fractionalToken.sellShares(shares);
    }
}
```

## Événements

Le système émet plusieurs événements utiles :

- `NFTCreatedAndFractionalized` : Quand un NFT est créé et fractionné
- `SharesPurchased` : Quand des parts sont achetées
- `SharesSold` : Quand des parts sont vendues
- `SharePriceUpdated` : Quand le prix des parts est mis à jour
- `TradingStatusChanged` : Quand le trading est activé/désactivé

## Avantages

1. **Contrôle d'accès** : Seul le owner peut créer des NFTs
2. **Fractionnalisation automatique** : Chaque NFT est automatiquement fractionné lors de la création
3. **Trading flexible** : Les utilisateurs peuvent acheter et vendre des parts facilement
4. **Gestion centralisée** : Toutes les opérations passent par le factory
5. **Transparence** : Toutes les informations sont accessibles publiquement 