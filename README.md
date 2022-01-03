# champions-game
where champions are born

## thoughts
Would be great to have time based and level based things to unlock more characters and armor and stuff, and have some
of that built into the v1 game. Yeah like only 10k every 24 hours or something
- a combination of time and frequency
    - 10k total supply
    - 1k or 24 hours
        ex: someone can't mint them all faster than 1 day, basically a cooldown period
    - staking can begin right away
- literally easier to just charge a small amount than rate limit, like .01 or .02 eth

## Story
In a dark corner of the metaverse, Champions Game is born. A 100% on chain nft game where players can mint their own
unique champion, stake it in the dungeon to earn $CCOIN (maybe find a better name here), and battle other players to level up and earn rewards.

[need some leveling system]
Phase 1
Minting
Dungeon
Leveling Up (pay coins to level up)

Phase 2
Battles

Phase 3
Weapon drops

Champions Game is inspired by other games like it (wolf.game, ether orcs) but we wanted to make a game with a different
flavor.

Champions game will launch with the dungeon but we will be building out a pvp bounty system where players can

We also plan on building a dao and treasury around the CCOIN. Users will be able to purchase $CCOIN in exchange for
eth or usdc. That money will go into the treasury and help regulate the price of the coin. Users will also be able to
earn even more $ccoin by providing liquitidy and staking those liquidity tokens in exchange for more $CCOIN.

## Steps for running locally
1. Start local ethereum node with `npx hardhat node`
2. in a separate window, run deploy script for champions game `npx hardhat run --network localhost scripts/deploy.js`
2. in a another window, start frontend with `npm start`
3. add wallet address from metamask to src/app.js
4. go to localhost:3000

## Troubleshooting
If you run into the issue with metamask where it says the nonce is the wrong number.
https://medium.com/@thelasthash/solved-nonce-too-high-error-with-metamask-and-hardhat-adc66f092cd

latest ropsten
coin contract deployed to address: 0xa13a5692FCcC06A7E2b4f380d7BF3aeF96aaDEa2
game contract deployed to address: 0xCa115285a7647b876E5973Ffd82D8B2775dd2Abc

later ropsten - 2021/12/30
coin contract deployed to address: 0x7675d8598F64F2A593AAFaaF9aF4F79104e9DEE2
game contract deployed to address: 0x27789d83E05eA96F6B3c44B1F4f094C2a72F938b
traits contract deployed to address: 0x84B42ae67ccb215bAE6e98985f51479b00a02F06

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
