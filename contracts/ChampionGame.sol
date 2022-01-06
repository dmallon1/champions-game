//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./ChampionCoin.sol";

contract ChampionGame is ERC721URIStorage, Ownable {
    // number of tokens have been minted so far
    uint16 public minted;
    uint256 public constant DAILY_CCOIN_RATE = 10000 ether;
    uint256 public constant MINIMUM_TO_EXIT = 2 days;

    // not used anywhere
    uint256 public totalSupply = 1000000;
    // never set
    mapping(address => bool) public auth;

    enum Rank {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY
    }
    enum Location {
        DUNGEON,
        SPARRING_PITS
    }

    // keyed by champion ids
    mapping(uint256 => Champion) public champions;
    mapping(uint256 => Stake) public stakes;

    // used to ensure there are no duplicates
    mapping(uint256 => uint256) public existingCombinations;

    struct Champion {
        uint8 helmet;
        uint8 ears;
        uint8 body;
        uint8 chest;
        uint8 mainhand;
        uint8 offhand;
        uint8 legs;
        uint8 feet;
        Rank rank;
    }

    struct Stake {
        address owner;
        uint80 timestamp;
        Location location;
    }

    bytes32 internal entropySauce;

    ChampionCoin championCoin;

    // list of probabilities for each trait type
    uint8[][9] public rarities;
    // list of aliases for Walker's Alias algorithm
    uint8[][9] public aliases;

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

    function mint(address recipient)
        external
        noCheaters
        returns (uint256 newItemId)
    {
        // validation
        // does it cost anything? -> do you have enough?
        // make sure there is still supply

        newItemId = minted++;
        uint256 seed = random(minted);
        generate(minted, seed);
        _mint(recipient, newItemId);
    }

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

    function stakeChampion(uint256 championId, Location location) external {
        require(_msgSender() == ownerOf(championId), "not yo champion");

        stakes[championId] = Stake({
            owner: _msgSender(),
            timestamp: uint80(block.timestamp),
            location: location
        });

        transferFrom(_msgSender(), address(this), championId);
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

        uint256 owed = ((block.timestamp - stake.timestamp) *
            DAILY_CCOIN_RATE) / 1 days;

        if (unstake) {
            delete stakes[championId];
            _transfer(address(this), _msgSender(), championId);
        } else {
            stakes[championId].timestamp = uint80(block.timestamp);
        }

        championCoin.mint(_msgSender(), owed);
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
        t.helmet = selectTrait(uint16(seed & 0xFFFF), 0);
        seed >>= 16;
        t.ears = selectTrait(uint16(seed & 0xFFFF), 1);
        seed >>= 16;
        t.body = selectTrait(uint16(seed & 0xFFFF), 2);
        seed >>= 16;
        t.chest = selectTrait(uint16(seed & 0xFFFF), 3);
        seed >>= 16;
        t.mainhand = selectTrait(uint16(seed & 0xFFFF), 4);
        seed >>= 16;
        t.offhand = selectTrait(uint16(seed & 0xFFFF), 5);
        seed >>= 16;
        t.legs = selectTrait(uint16(seed & 0xFFFF), 6);
        seed >>= 16;
        t.feet = selectTrait(uint16(seed & 0xFFFF), 7);
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
                        s.helmet,
                        s.ears,
                        s.body,
                        s.chest,
                        s.mainhand,
                        s.offhand,
                        s.legs,
                        s.feet,
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
                        tx.origin,
                        blockhash(block.number - 1),
                        block.timestamp,
                        seed
                    )
                )
            );
    }

    /**
    MODIFIERS
    */
    // TODO: should investigate whether we actually need this
    modifier noCheaters() {
        uint256 size = 0;
        address acc = _msgSender();
        assembly {
            size := extcodesize(acc)
        }

        require(
            auth[_msgSender()] || (_msgSender() == tx.origin && size == 0),
            "you're trying to cheat!"
        );
        _;

        // We'll use the last caller hash to add entropy to next caller
        entropySauce = keccak256(abi.encodePacked(acc, block.coinbase));
    }

    function getChampions(uint256 tokenId)
        external
        view
        returns (Champion memory)
    {
        return champions[tokenId];
    }
}
