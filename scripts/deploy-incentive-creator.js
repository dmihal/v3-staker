const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise((resolve) => rl.question(question + ' ', resolve))
}

const wait = (sec) => new Promise(resolve => setTimeout(resolve, sec * 1000))

async function main() {
  const staker = await hre.deployments.get('UniswapV3Staker').catch(() => null)

  let stakerAddress
  if (staker) {
    stakerAddress = staker.address
    // await hre.deployments.read(name: string, methodName: string, ...args: any[])
  } else {
    stakerAddress = (await prompt("What's the Uniswap staker contract address?")).trim()
  }

  const delay = parseFloat(await prompt('How long from now would you like to start the distribution (min)'))
  const length = parseFloat(await prompt('How long from now would you like it to last (min)'))

  const reward = (await prompt("What's the reward token?")).trim()
  const refundee = (await prompt("Who should receive refunds?")).trim()

  const pools = []
  const minTickWidths = []
  const weights = []

  const numPools = parseInt(await prompt('How many pools would you like to incentivize?'))

  for (let i = 0; i < numPools; i++) {
    const pool = (await prompt(`[Pool ${i + 1}] What's the address of the incentivized pool?`)).trim()
    const minTickWidth = (await prompt(`[Pool ${i + 1}] What's the minimum tick width?`)).trim()
    const weight = (await prompt(`[Pool ${i + 1}] What's weight?`)).trim()

    pools.push(pool)
    minTickWidths.push(minTickWidth)
    weights.push(weight)
  }

  const now = Math.floor(Date.now() / 1000)
  const startTime = now + (delay * 60)
  const endTime = startTime + (length * 60)

  const bulkIncentiveCreatorFactory = await ethers.getContractFactory('BulkIncentiveCreator')
  const params = [
    stakerAddress,
    reward,
    startTime,
    endTime,
    refundee,
    pools,
    minTickWidths,
    weights,
  ]
  const creator = (await bulkIncentiveCreatorFactory.deploy(...params))

  console.log(`Deployed creator to ${creator.address}`)

  console.log('Waiting for etherscan to index...')
  await wait(15)

  await hre.run("verify:verify", {
    address: creator.address,
    constructorArguments: params,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
