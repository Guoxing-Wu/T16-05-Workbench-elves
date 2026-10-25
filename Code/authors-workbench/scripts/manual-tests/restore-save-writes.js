(() => {
    const key = "__awbSaveFailureTest";
    const state = window[key];

    if (!state) {
        console.log("No active save failure simulation.");
        return;
    }

    IDBDatabase.prototype.transaction = state.originalTransaction;
    delete window[key];

    console.log("Normal writes restored. Click Retry in the application.");
})();
