/*
This code is based on three lessons on Simply Explained for creating a blockchain coin in javascript:

Create a block chain - https://www.youtube.com/watch?v=zVqczFZr124
Proof of work implementation - https://www.youtube.com/watch?v=HneatE69814
Implement transactions - https://www.youtube.com/watch?v=fRV6cGXVQ4I

This code has all the basic elements required for a crypto currency, but it is not secure enough
to be used as-is.

A block is a javascript object:

timestamp    - unix time, ie 1639918141
transactions - an array of transactions
               - to address
               - from address
               - amount
nonce        - an integer that is incremented until the hash meets the "proof of work" requirement.
previousHash - the value of the hash of the previous block in the chain
hash         - the SHA256 hash of the timestamp, nonce, previous hash and transactions

A chain is an array of blocks

The proof of work requires that the hash begin with a number of zeros determined by the difficulty. The
block's payload is modified by incrementing a nonce until the proof of work is required.

difficulty  time
----------  ---------
1            0.2 msec
2            1.7 msec
3           26.5 msec
4          336.8 msec
5            5.1 sec
6           87.0 sec

The time it takes to calculate the hash increases by a factor of 16 for each difficulty level. This means
generating a hash that begins with 10 zeros would take my m1 macbook air 87*16^4 => 65 days to accomplish.

*/

const SHA256 = require('crypto-js/sha256')
const DIFFICULTY = 6 // Number of initial zeros required in the hash
const MINING_REWARD = 5

class Transaction {
    constructor({toAddress, fromAddress, amount}) {
        this.toAddress = toAddress
        this.fromAddress = fromAddress
        this.amount = amount
    }

    toString() {
        return `From ${this.fromAddress} to ${this.toAddress} amt: ${this.amount}`
    }
}

class Block {
    constructor({transactions, previousHash = '0'.repeat(DIFFICULTY)}) {
        this.timestamp = Date.now()
        this.transactions = transactions
        this.previousHash = previousHash
        this.hash = this.calculateHash()
        this.nonce = 0
        this.workTime = 0
    }

    calculateHash() {
        const hash = SHA256(this.timestamp +
            this.nonce +
            this.previousHash +
            JSON.stringify(this.transactions)).toString()
        return hash
    }

    mineBlock({difficulty}) {
        const startTime = Date.now()
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash()
        }
        const endTime = Date.now()
        return endTime - startTime
    }
}

class Blockchain {
    constructor() {
        this.difficulty = DIFFICULTY
        this.chain = [this.createGenesisBlock()]
        this.pendingTransactions = []
        this.miningReward = MINING_REWARD
    }

    createGenesisBlock() {
        const genesisBlock = new Block({transactions: []})
        genesisBlock.workTime = genesisBlock.mineBlock({difficulty: this.difficulty})
        return genesisBlock
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1]
    }

    minePendingTransactions({miningRewardAddress}) {
        const block = new Block({transactions: this.pendingTransactions, previousHash: this.getLatestBlock().hash})
        block.workTime = block.mineBlock({difficulty: this.difficulty})

        this.chain.push(block)

        this.pendingTransactions = [
            new Transaction({fromAddress: null, toAddress: miningRewardAddress, amount: this.miningReward})
        ]
    }

    createTransaction(transaction) {
        this.pendingTransactions.push(transaction)
    }

    getBalanceOfAddress(address) {

        let balance = 0

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount
                }
                if (trans.toAddress === address) {
                    balance += trans.amount
                }
            }
        }

        return balance
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i]
            const previousBlock = this.chain[i - 1]

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false
            }
        }
        return true
    }

    getAverageWorkTime() {
        let sum = 0
        this.chain.forEach(block => {
            sum += block.workTime
        })
        return sum / this.chain.length
    }

    formatDate(date) {

        let hours = date.getHours()
        const ampm = hours > 11 ? 'pm' : 'am'
        hours = hours > 12 ? hours - 12 : hours
        const time = `${hours.toString().padStart(2, ' ')}:${date.getMinutes().toString().padStart(2, '0')} ${ampm}`
        const day = `${date.getMonth() + 1}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
        return `${day} ${time}`
    }

    toString() {
        let ret = ''
        for (const block of this.chain) {
            const date = new Date(block.timestamp);
            ret += `${this.formatDate(date)} - ${block.hash.substring(0, 6)}|${block.previousHash.substring(0, 6)} - `
            const tranStrs = []
            for (const transaction of block.transactions) {
                tranStrs.push(transaction.toString())
            }
            ret += tranStrs.join('; ') + "\n"
        }
        return ret
    }
}

const addresses = ['george', 'alex', 'anne', 'kelly', 'zach']
const georgeCoin = new Blockchain()

georgeCoin.minePendingTransactions({miningRewardAddress: 'geocolumbus@gmail.com'})

// create coins
for (let i = 0; i < 2; i++) {
    georgeCoin.minePendingTransactions({miningRewardAddress: 'george'})
}

for (let i = 0; i < 2; i++) {
    const transaction = new Transaction({
        fromAddress: addresses[Math.floor(Math.random() * addresses.length)],
        toAddress: addresses[Math.floor(Math.random() * addresses.length)],
        amount: Math.floor(Math.random() * 10)
    })
    if (transaction.fromAddress !== transaction.toAddress) {
        if (georgeCoin.getBalanceOfAddress(transaction.fromAddress) > transaction.amount) {
            georgeCoin.createTransaction(transaction)
            georgeCoin.minePendingTransactions({miningRewardAddress: 'george'})
        }
    }
}
georgeCoin.minePendingTransactions({miningRewardAddress: 'geocolumbus@gmail.com'})

console.log(`${georgeCoin.toString()}`)

addresses.forEach(address => {
    console.log(`${address}: ${georgeCoin.getBalanceOfAddress(address)}`)
})

console.log(`\nChain validity check = ${georgeCoin.isChainValid()}`)
console.log(`Average work time = ${georgeCoin.getAverageWorkTime()} msec`)
