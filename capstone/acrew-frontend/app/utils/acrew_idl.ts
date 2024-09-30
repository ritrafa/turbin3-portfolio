// app/utils/acrew_idl.ts
import { Idl } from "@coral-xyz/anchor";

export const IDL: Idl = {
  version: "0.1.0",
  name: "acrew",
  instructions: [
    {
      name: "createSavingsPlan",
      accounts: [
        { name: "admin", isMut: true, isSigner: true },
        { name: "savingsPlan", isMut: true, isSigner: false },
        { name: "savingsPlanVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "start", type: "i64" },
        { name: "duration", type: "i64" },
        { name: "amount", type: "u64" },
      ],
    },
    {
      name: "deposit",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "savingsPlan", isMut: true, isSigner: false },
        { name: "userVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "savingsPlan", type: "publicKey" },
        { name: "amount", type: "u64" },
      ],
    },
    {
      name: "earlyWithdraw",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "savingsPlan", isMut: true, isSigner: false },
        { name: "savingsPlanVault", isMut: true, isSigner: false },
        { name: "userVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "savingsPlan", type: "publicKey" }],
    },
    {
      name: "withdraw",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "savingsPlan", isMut: true, isSigner: false },
        { name: "savingsPlanVault", isMut: true, isSigner: false },
        { name: "userVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "savingsPlan", type: "publicKey" }],
    },
  ],
  accounts: [
    {
      name: "SavingsPlanVault",
      type: {
        kind: "struct",
        fields: [
          { name: "savingsPlan", type: "publicKey" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "SavingsPlan",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "name", type: "string" },
          { name: "start", type: "i64" },
          { name: "duration", type: "i64" },
          { name: "amount", type: "u64" },
          { name: "bump", type: "u8" },
          { name: "participants", type: "u64" },
        ],
      },
    },
    {
      name: "UserVault",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "savingsPlan", type: "publicKey" },
          { name: "active", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "NameTooLong",
      msg: "The provided name is too long. Maximum length is 28 bytes.",
    },
    {
      code: 6001,
      name: "DurationTooShort",
      msg: "The duration is too short. Minimum duration is 30 seconds.",
    },
    {
      code: 6002,
      name: "StartTimeInPast",
      msg: "The start time must be in the future.",
    },
    {
      code: 6003,
      name: "SavingsPlanEnded",
      msg: "The savings plan has ended.",
    },
    {
      code: 6004,
      name: "DepositAmountTooLow",
      msg: "The deposit amount is lower than the savings plan target amount.",
    },
    {
      code: 6005,
      name: "UserVaultInactive",
      msg: "The user vault is not active.",
    },
    {
      code: 6006,
      name: "SavingsPlanStillActive",
      msg: "The savings plan is still active.",
    },
    { code: 6007, name: "ArithmeticOverflow", msg: "Arithmetic Overflow" },
  ],
};
