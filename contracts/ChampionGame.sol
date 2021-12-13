//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./ChampionCoin.sol";

contract ChampionGame is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    // number of tokens have been minted so far
    uint16 public minted;
    uint256 public constant DAILY_CCOIN_RATE = 10000 ether;
    uint256 public constant MINIMUM_TO_EXIT = 2 days;

    uint256 public totalSupply = 1000000;
    address public admin;
    enum Level {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY
    }
    mapping(uint256 => Champion) public champions; // id to champion stats
    mapping(uint256 => DungeonStake) public dungeon; // keeping track of tokens in dungeon

    mapping(address => bool) public auth;
    struct Champion {
        uint8 head;
        uint8 body;
        uint8 mainhand;
        uint8 offhand;
        Level level;
    }

    struct DungeonStake {
        address owner;
        uint16 tokenId;
        uint80 value;
    }

    bytes32 internal entropySauce;

    ChampionCoin championCoin;

    constructor(address _ccoin) ERC721("Champions Game", "CGAME") {
        championCoin = ChampionCoin(_ccoin);
    }

    function mint(address recipient) external noCheaters returns (uint256) {
        // validation
        // does it cost anything? -> do you have enough?
        // make sure there is still supply

        uint256 newItemId = minted++;
        // generate champion
        // creating character specs and level

        _mint(recipient, newItemId);

        champions[newItemId] = Champion({
            head: 1,
            body: 2,
            mainhand: 3,
            offhand: 4,
            level: Level.COMMON
        });

        return newItemId;
    }

    function goToDungeon(uint256 championId) external {
        require(msg.sender == ownerOf(championId));

        transferFrom(msg.sender, address(this), championId);

        dungeon[championId] = DungeonStake({
            owner: msg.sender,
            tokenId: uint16(championId),
            value: uint80(block.timestamp)
        });
    }

    function claimRewards(uint256 championId, bool unstake) external {
        DungeonStake memory dungeonStake = dungeon[championId];

        require(dungeonStake.owner == msg.sender);
        require(
            block.timestamp - dungeonStake.value < MINIMUM_TO_EXIT,
            "not enough time has passed to claim rewards"
        );

        uint256 owed = (block.timestamp - dungeonStake.value) *
            DAILY_CCOIN_RATE;

        championCoin.mint(msg.sender, owed);

        if (unstake) {
            transferFrom(address(this), msg.sender, championId);
            delete dungeon[championId];
        } else {
            dungeon[championId].value = uint80(block.timestamp);
        }
    }

    function _rand() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        msg.sender,
                        block.timestamp,
                        // block.basefee,
                        block.timestamp,
                        entropySauce
                    )
                )
            );
    }

    /**
    MODIFIERS
    */
    modifier noCheaters() {
        uint256 size = 0;
        address acc = msg.sender;
        assembly {
            size := extcodesize(acc)
        }

        require(
            auth[msg.sender] || (msg.sender == tx.origin && size == 0),
            "you're trying to cheat!"
        );
        _;

        // We'll use the last caller hash to add entropy to next caller
        entropySauce = keccak256(abi.encodePacked(acc, block.coinbase));
    }
}
