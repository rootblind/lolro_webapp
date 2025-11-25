import {
    dataHasher,
    arraysEqual,
    encryptor,
    decryptor
} from "../utility_modules/utility_methods.js";

import { describe, expect, test} from "@jest/globals";

describe("utility_methods library tests", () => {
    // dataHasher
    test("dataHasher hashing the input to sha256", () => {
        const hash = dataHasher("random text");
        expect(hash).toEqual("a4e082f56a58e0855a6abbf2f4ebd08895ff85ea80e634e02b210def84b557dd");
    });

    //arrayEqual
    test("arraysEqual comparing two equal arrays", () => {
        const array1 = ["one", "two", "three", "four"];
        const array2 = ["one", "two", "three", "four"];

        expect(arraysEqual(array1, array2)).toBeTruthy();
    });

    test("arraysEqual comparing two different arrays", () => {
        const array1 = ["one", "two", "three", "four"];
        const array2 = ["one", "two", "three", "four", 1];

        expect(arraysEqual(array1, array2)).toBeFalsy();
    });

    // encrypt decrypt
    test("encryptor decryptor restoring a string", () => {
        const text = "this is a test";
        const text_encrypted = encryptor(text);

        expect(decryptor(text_encrypted)).toEqual(text);
    })
});