
const currentTimestamp = () => Date.now();

class MemoryCacheStorageDriver {
    constructor({ lifeTime } = {}) {
        this.lifeTime = lifeTime || 0;
        this.storage = {};
    }

    static create(...args) {
        return new this(...args);
    }

    clearAllData() {
        this.storage = {};
    }

    checkLifeTime(item) {
        if (this.lifeTime) {
            const secondsPassed = currentTimestamp() - item.savedAt;

            return (secondsPassed < this.lifeTime);
        }

        return true;
    }

    clearOldData() {
        for (let key in this.storage) {
            if (!this.check(key)) {
                delete this.storage[key];
            }
        }
    }

    check(key) {
        const savedItem = this.storage[key];
        if (savedItem && this.checkLifeTime(savedItem)) {
            return true;
        }

        return false;
    }

    get(key) {
        const savedItem = this.storage[key];
        if (savedItem && this.checkLifeTime(savedItem)) {
            return JSON.parse(savedItem.value);
        }

        return null;
    }

    set(key, value) {
        this.storage[key] = {
            value: JSON.stringify(value),
            createdAt: currentTimestamp(),
        };
    }
}


module.exports = MemoryCacheStorageDriver;
