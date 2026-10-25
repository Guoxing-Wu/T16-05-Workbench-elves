import { afterEach, beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { act, cleanup, renderHook, } from "@testing-library/react";
import { writeChanges } from "./db";
import type { StoreName } from "./db";
import { useCollectionSync } from "./useCollectionSync";

// Control database responses without writing real browser data.
jest.mock("./db", () => ({
    writeChanges: jest.fn(),
}));

const writeChangesMock = jest.mocked(writeChanges);

interface TestItem {
    id: string;
    value: string;
}

function renderSync(
    items: TestItem[] = [],
    enabled = true,
    storeName: StoreName = "projects"
) {
    return renderHook(
        ({ items, enabled }) =>
            useCollectionSync(storeName, items, enabled),
        {
            initialProps: { items, enabled },
        }
    );
}

async function advanceTime(milliseconds = 400) {
    await act(async () => {
        await jest.advanceTimersByTimeAsync(milliseconds);
    });
}

// Let a test decide when a database write finishes.
function pendingWrite() {
    let resolve!: () => void;

    const promise = new Promise<void>((finish) => {
        resolve = finish;
    });

    return { promise, resolve };
}

beforeEach(() => {
    jest.useFakeTimers();
    writeChangesMock.mockReset();
    writeChangesMock.mockResolvedValue(undefined);
});

afterEach(async () => {
    await act(async () => {
        cleanup();
    });

    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe("useCollectionSync", () => {
    it("shows loading and prevents writes before initial loading completes", async () => {
        const { result } = renderSync([], false);

        expect(result.current.status).toBe("loading");

        await advanceTime(1000);

        await act(async () => {
            await result.current.retry();
        });

        expect(writeChangesMock).not.toHaveBeenCalled();
        expect(result.current.status).toBe("loading");
    });

    it("uses loaded data as the baseline without writing it back", async () => {
        const { result, rerender } = renderSync([], false);

        const loadedItems = [
            { id: "1", value: "Previously saved data" },
        ];

        rerender({
            items: loadedItems,
            enabled: true,
        });

        await advanceTime(1000);

        expect(result.current.status).toBe("saved");
        expect(writeChangesMock).not.toHaveBeenCalled();
    });

    it("keeps the status saving until the database write succeeds", async () => {
        const pending = pendingWrite();
        writeChangesMock.mockReturnValueOnce(pending.promise);

        const { result, rerender } = renderSync();
        const updatedItems = [
            { id: "1", value: "Updated data" },
        ];

        rerender({
            items: updatedItems,
            enabled: true,
        });

        expect(result.current.status).toBe("saving");

        await advanceTime();

        expect(writeChangesMock).toHaveBeenCalledWith(
            "projects",
            updatedItems,
            []
        );
        expect(result.current.status).toBe("saving");

        await act(async () => {
            pending.resolve();
        });

        expect(result.current.status).toBe("saved");
    });

    it("saves only the latest data after rapid consecutive edits", async () => {
        const { result, rerender } = renderSync();

        rerender({
            items: [{ id: "1", value: "First edit" }],
            enabled: true,
        });

        await advanceTime(200);

        const latestItems = [
            { id: "1", value: "Latest edit" },
        ];

        rerender({
            items: latestItems,
            enabled: true,
        });

        await advanceTime(399);
        expect(writeChangesMock).not.toHaveBeenCalled();

        await advanceTime(1);

        expect(writeChangesMock).toHaveBeenCalledTimes(1);
        expect(writeChangesMock).toHaveBeenCalledWith(
            "projects",
            latestItems,
            []
        );
        expect(result.current.status).toBe("saved");
    });

    it.each<[StoreName]>([
        ["projects"],
        ["customStructures"],
    ])(
        "saves added and updated records and deletes removed records in %s",
        async (storeName) => {
            const original = { id: "1", value: "Original" };
            const removed = { id: "2", value: "To delete" };
            const unchanged = {
                id: "3",
                value: "Keep unchanged",
            };

            const { result, rerender } = renderSync(
                [original, removed, unchanged],
                true,
                storeName
            );

            const updated = { id: "1", value: "Updated" };
            const added = { id: "4", value: "New record" };

            rerender({
                items: [updated, unchanged, added],
                enabled: true,
            });

            await advanceTime();

            expect(writeChangesMock).toHaveBeenCalledTimes(1);
            expect(writeChangesMock).toHaveBeenCalledWith(
                storeName,
                [updated, added],
                ["2"]
            );
            expect(result.current.status).toBe("saved");
        }
    );

    it("retains failed changes and retries without requiring further edits", async () => {
        jest.spyOn(console, "error").mockImplementation(() => { });

        const error = new Error("Database write failed");

        writeChangesMock
            .mockRejectedValueOnce(error)
            .mockRejectedValueOnce(error);

        const { result, rerender } = renderSync();
        const latestItems = [
            { id: "1", value: "Changes awaiting save" },
        ];

        rerender({
            items: latestItems,
            enabled: true,
        });

        await advanceTime();

        expect(result.current.status).toBe("error");
        expect(writeChangesMock).toHaveBeenCalledTimes(1);

        // Retry while writes are still failing.
        await act(async () => {
            await result.current.retry();
        });

        expect(result.current.status).toBe("error");
        expect(writeChangesMock).toHaveBeenCalledTimes(2);

        // Retry again after normal writes become available.
        // No further edits or rerenders are performed.
        await act(async () => {
            await result.current.retry();
        });

        expect(writeChangesMock).toHaveBeenCalledTimes(3);
        expect(writeChangesMock).toHaveBeenLastCalledWith(
            "projects",
            latestItems,
            []
        );
        expect(result.current.status).toBe("saved");
    });

    it("does not report newer edits as saved when an older write finishes", async () => {
        const firstWrite = pendingWrite();
        const secondWrite = pendingWrite();

        writeChangesMock
            .mockReturnValueOnce(firstWrite.promise)
            .mockReturnValueOnce(secondWrite.promise);

        const { result, rerender } = renderSync();

        rerender({
            items: [{ id: "1", value: "First version" }],
            enabled: true,
        });

        await advanceTime();

        expect(writeChangesMock).toHaveBeenCalledTimes(1);

        const latestItems = [
            { id: "1", value: "Latest version" },
        ];

        rerender({
            items: latestItems,
            enabled: true,
        });

        await advanceTime();

        // The newer write must wait for the older write.
        expect(writeChangesMock).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe("saving");

        await act(async () => {
            firstWrite.resolve();
        });

        expect(writeChangesMock).toHaveBeenCalledTimes(2);
        expect(writeChangesMock).toHaveBeenLastCalledWith(
            "projects",
            latestItems,
            []
        );
        expect(result.current.status).toBe("saving");

        await act(async () => {
            secondWrite.resolve();
        });

        expect(result.current.status).toBe("saved");
    });
});