/*
Create a block chain - https://www.youtube.com/watch?v=zVqczFZr124
Proof of work implementation - https://www.youtube.com/watch?v=HneatE69814
Implement transactions - https://www.youtube.com/watch?v=fRV6cGXVQ4I

 */

console.clear()

const SHA256 = require('crypto-js/sha256')
const DIFFICULTY = 4 // Number of initial zeros required in the hash
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
    }

    calculateHash() {
        return SHA256(this.index +
            this.previousHash +
            this.timestamp +
            this.nonce +
            JSON.stringify(this.transactions)).toString()
    }

    mineBlock({difficulty}) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash()
        }
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
        genesisBlock.mineBlock({difficulty: this.difficulty})
        return genesisBlock
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1]
    }

    minePendingTransactions({miningRewardAddress}) {
        const block = new Block({transactions: this.pendingTransactions,previousHash:this.getLatestBlock().hash})
        block.mineBlock({difficulty: this.difficulty})

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
            ret += `${this.formatDate(date)} - ${block.hash.substring(0,6)}|${block.previousHash.substring(0,6)} - `
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
for (let i=0; i<10; i++) {
    georgeCoin.minePendingTransactions({miningRewardAddress: 'george'})
}

for (let i = 0; i < 10; i++) {
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

console.log(`\nisChainValid = ${georgeCoin.isChainValid()}`)
