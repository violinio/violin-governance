# Violin governance
Violin governance project contains the governance related contracts. Initially this is just the MultisigTimelock.

## Timelock design
The multisig timelock is a timelock with the added security feature that two of the three Violin signers must endorce a transaction before it can be executed. It is based upon the honorary Compound Timelock which deserves much credit for its simplicity. We are sorry for making it slightly more complex.

## Deploy
```
yarn deploy avax
```

### Testing
```
yarn test hardhat 
```


### Environment variables
- PRIVATE_KEY
- ETHERSCAN_APIKEY

## Contracts
The contracts have been deployed as-is on a variety of chains.

### Staging

| Chain   | Short timelock                             | Long timelock                              |
| ------- | ------------------------------------------ | ------------------------------------------ |
| Avax    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| BSC    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| Fantom    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| Polygon    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| XDai    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| Harmony    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |
| Moonriver    | 0x98f020A2418D97bB9d4CC495fD17A8FD64afBAAd | 0xb0Ac62B9E1C4Db2067a834d94A778711D85A1154 |