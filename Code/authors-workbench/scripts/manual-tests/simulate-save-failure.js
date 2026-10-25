(() => {
    const key = "__awbSaveFailureTest";

    if (window[key]) {
        console.log("Save failure simulation is already active.");
        return;
    }

    const originalTransaction = IDBDatabase.prototype.transaction;

    IDBDatabase.prototype.transaction = function (...args) {
        if (
            this.name === "authors-workbench" &&
            args[1] === "readwrite"
        ) {
            throw new DOMException(
                "Simulated save failure for manual testing.",
                "UnknownError"
            );
        }

        return Reflect.apply(originalTransaction, this, args);
    };

    window[key] = { originalTransaction };

    console.log("Save failure simulation enabled.");
})();