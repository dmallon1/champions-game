//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./ChampionCoin.sol";
import "hardhat/console.sol";

contract ChampionGame is ERC721URIStorage, Ownable {
    uint256 public constant LEVEL_COST = 10;
    uint256 public constant MINT_COST = .02 ether;
    uint256 public constant MINIMUM_TO_EXIT = 1 days;
    uint16 public constant MAX_SUPPLY = 10000;

    // number of tokens have been minted so far
    uint16 public minted;

    ChampionCoin public championCoin;

    // list of probabilities for each trait type
    uint8[][4] public rarities;
    // list of aliases for Alias algorithm
    uint8[][4] public aliases;

    // keyed by champion ids
    mapping(uint256 => Champion) public champions;
    mapping(uint256 => Stake) public stakes;
    mapping(uint256 => uint256) public existingCombinations;

    enum Rank {
        COMMON,
        RARE,
        EPIC,
        LEGENDARY
    }

    enum Location {
        DUNGEON,
        SPARRING_PITS
    }

    struct Champion {
        uint8 head;
        uint8 body;
        uint8 mainhand;
        uint8 offhand;
        uint8 level;
        Rank rank;
    }

    struct Stake {
        address owner;
        uint80 timestamp;
        Location location;
    }

    constructor(address _ccoin) ERC721("Champions Game", "CGAME") {
        championCoin = ChampionCoin(_ccoin);

        // TODO: fill in rest of attributes
        // A.J. Walker's Alias Algorithm
        // head
        rarities[0] = [15, 50, 200, 250, 255];
        aliases[0] = [4, 4, 4, 4, 4];
        // body
        rarities[1] = [
            190,
            215,
            240,
            100,
            110,
            135,
            160,
            185,
            80,
            210,
            235,
            240,
            80,
            80,
            100,
            100,
            100,
            245,
            250,
            255
        ];
        aliases[1] = [
            1,
            2,
            4,
            0,
            5,
            6,
            7,
            9,
            0,
            10,
            11,
            17,
            0,
            0,
            0,
            0,
            4,
            18,
            19,
            19
        ];
        // mainhand
        rarities[2] = [255, 30, 60, 60, 150, 156];
        aliases[2] = [0, 0, 0, 0, 0, 0];
        // offhand
        rarities[3] = [
            221,
            100,
            181,
            140,
            224,
            147,
            84,
            228,
            140,
            224,
            250,
            160,
            241,
            207,
            173,
            84,
            254,
            220,
            196,
            140,
            168,
            252,
            140,
            183,
            236,
            252,
            224,
            255
        ];
        aliases[3] = [
            1,
            2,
            5,
            0,
            1,
            7,
            1,
            10,
            5,
            10,
            11,
            12,
            13,
            14,
            16,
            11,
            17,
            23,
            13,
            14,
            17,
            23,
            23,
            24,
            27,
            27,
            27,
            27
        ];
    }

    /*
               _                        _    __                  _   _
      _____  _| |_ ___ _ __ _ __   __ _| |  / _|_   _ _ __   ___| |_(_) ___  _ __  ___
     / _ \ \/ / __/ _ \ '__| '_ \ / _` | | | |_| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    |  __/>  <| ||  __/ |  | | | | (_| | | |  _| |_| | | | | (__| |_| | (_) | | | \__ \
     \___/_/\_\\__\___|_|  |_| |_|\__,_|_| |_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
    */

    // TODO: add bool stake
    function mint(uint256 amount) external payable returns (uint256 newItemId) {
        require(tx.origin == _msgSender(), "Only EOA");
        require(
            amount > 0 && amount < 11,
            "Invalid mint amount, must be between 1 and 10"
        );
        require(
            amount * MINT_COST == msg.value,
            "not enough ether, mint costs .02 eth per champ"
        );
        require(
            minted + amount <= MAX_SUPPLY,
            "all champions have been minted"
        );

        uint256 seed;
        for (uint256 i = 0; i < amount; i++) {
            newItemId = minted++;
            seed = random(newItemId);
            generate(newItemId, seed);
            _mint(_msgSender(), newItemId);
        }
    }

    function stakeChampion(uint256[] calldata championIds, Location location)
        external
    {
        uint256 i;
        for (i = 0; i < championIds.length; i++) {
            require(_msgSender() == ownerOf(championIds[i]), "not yo champion");
        }

        for (i = 0; i < championIds.length; i++) {
            stakes[championIds[i]] = Stake({
                owner: _msgSender(),
                timestamp: uint80(block.timestamp),
                location: location
            });
        }

        for (i = 0; i < championIds.length; i++) {
            transferFrom(_msgSender(), address(this), championIds[i]);
        }
    }

    function claimRewards(uint256 championId, bool unstake) external {
        Stake memory stake = stakes[championId];

        require(
            stake.owner != address(0),
            "this champion isn't in the dungeon"
        );
        require(
            stake.owner == _msgSender(),
            "you are not the owner of this champion"
        );
        require(
            block.timestamp - stake.timestamp > MINIMUM_TO_EXIT,
            "not enough time has passed to claim rewards"
        );

        uint256 daysAtLocation = (block.timestamp - stake.timestamp) / 1 days;
        Champion storage champ = champions[championId]; // TODO: figure out optimal memory/storage
        uint16 randomNumber = uint16(random(championId));

        console.log(
            "time passed %s min time %s",
            block.timestamp - stake.timestamp,
            MINIMUM_TO_EXIT
        );
        console.log("days %s rand %s", daysAtLocation, randomNumber);

        // if champion is in one loca
        uint256 coinsToPay;
        if (stake.location == Location.DUNGEON) {
            // Rewards 1-15 $CCOIN per run
            if (champ.rank == Rank.COMMON) {
                coinsToPay = (randomNumber % 7) + 1;
            } else {
                coinsToPay = (randomNumber % 15) + 1;
            }

            coinsToPay *= daysAtLocation;

            // Small chance for attribute upgrade
            if (randomNumber < 5000) {
                // max is 65k
                uint256 randomStatNumber = randomNumber % 4;
                if (randomStatNumber == 0) champ.head += 1;
                if (randomStatNumber == 1) champ.body += 1;
                if (randomStatNumber == 2) champ.mainhand += 1;
                if (randomStatNumber == 3) champ.offhand += 1;
            }
        } else {
            uint256 coinBalance = championCoin.balanceOf(_msgSender()); // technically an external call
            uint256 numberLevelsCanAfford = coinBalance / LEVEL_COST;
            console.log(
                "balance %s, cost %s, levels can afford: %s",
                coinBalance,
                LEVEL_COST,
                numberLevelsCanAfford
            );
            // min(number of levels earned for all days, number of levels you can afford)
            uint256 levelsToUpgrade;
            if (daysAtLocation > numberLevelsCanAfford) {
                levelsToUpgrade = numberLevelsCanAfford;
            } else {
                levelsToUpgrade = daysAtLocation;
            }

            console.log("levels to upgrade: %s", levelsToUpgrade);

            champ.level += uint8(levelsToUpgrade); // could definitely overflow // probably should do this better than a cast

            // burn it, could change things
            championCoin.burn(_msgSender(), levelsToUpgrade * LEVEL_COST);

            if (randomNumber < 50) {
                // TODO: you get epic nft
            }
        }

        if (unstake) {
            delete stakes[championId];
            _transfer(address(this), _msgSender(), championId);
        } else {
            stakes[championId].timestamp = uint80(block.timestamp);
        }

        if (coinsToPay > 0) {
            championCoin.mint(_msgSender(), coinsToPay);
        }
    }

    function getChampions(uint256 tokenId)
        external
        view
        returns (Champion memory)
    {
        return champions[tokenId];
    }

    /**
     * allows owner to withdraw funds from minting
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /*
         _       _                        _    __                  _   _
    (_)_ __ | |_ ___ _ __ _ __   __ _| |  / _|_   _ _ __   ___| |_(_) ___  _ __  ___
    | | '_ \| __/ _ \ '__| '_ \ / _` | | | |_| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    | | | | | ||  __/ |  | | | | (_| | | |  _| |_| | | | | (__| |_| | (_) | | | \__ \
    |_|_| |_|\__\___|_|  |_| |_|\__,_|_| |_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
    */

    /**
     * generates traits for a specific token, checking to make sure it's unique
     * @param tokenId the id of the token to generate traits for
     * @param seed a pseudorandom 256 bit number to derive traits from
     * @return t - a struct of traits for the given token ID
     */
    function generate(uint256 tokenId, uint256 seed)
        internal
        returns (Champion memory t)
    {
        t = selectTraits(seed);
        if (existingCombinations[structToHash(t)] == 0) {
            champions[tokenId] = t;
            existingCombinations[structToHash(t)] = tokenId;
            return t;
        }
        return generate(tokenId, random(seed));
    }

    /**
     * selects the species and all of its traits based on the seed value
     * @param seed a pseudorandom 256 bit number to derive traits from
     * @return t -  a struct of randomly selected traits
     */
    function selectTraits(uint256 seed)
        internal
        view
        returns (Champion memory t)
    {
        seed >>= 16;
        t.head = selectTrait(uint16(seed & 0xFFFF), 0);
        seed >>= 16;
        t.body = selectTrait(uint16(seed & 0xFFFF), 1);
        seed >>= 16;
        t.mainhand = selectTrait(uint16(seed & 0xFFFF), 2);
        seed >>= 16;
        t.offhand = selectTrait(uint16(seed & 0xFFFF), 3);
        seed >>= 16;
        t.level = 1;
        t.rank = Rank.COMMON;
    }

    /**
     * uses A.J. Walker's Alias algorithm for O(1) rarity table lookup
     * ensuring O(1) instead of O(n) reduces mint cost by more than 50%
     * probability & alias tables are generated off-chain beforehand
     * @param seed portion of the 256 bit seed to remove trait correlation
     * @param traitType the trait type to select a trait for
     * @return the ID of the randomly selected trait
     */
    function selectTrait(uint16 seed, uint8 traitType)
        internal
        view
        returns (uint8)
    {
        uint8 trait = uint8(seed) % uint8(rarities[traitType].length);
        if (seed >> 8 < rarities[traitType][trait]) return trait;
        return aliases[traitType][trait];
    }

    /**
     * converts a struct to a 256 bit hash to check for uniqueness
     * @param s the struct to pack into a hash
     * @return the 256 bit hash of the struct
     */
    function structToHash(Champion memory s) internal pure returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        s.head,
                        s.body,
                        s.mainhand,
                        s.offhand,
                        s.level,
                        s.rank
                    )
                )
            );
    }

    /**
     * generates a pseudorandom number
     * @param seed a value ensure different outcomes for different sources in the same block
     * @return a pseudorandom value
     */
    function random(uint256 seed) internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        _msgSender(),
                        blockhash(block.number - 1),
                        block.timestamp,
                        seed
                    )
                )
            );
    }
}
