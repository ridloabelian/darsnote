/// <reference types="@cloudflare/workers-types" />

import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { requireCloudflareEnv } from "./cloudflare";

export function createPrismaForD1(database: D1Database) {
  const adapter = new PrismaD1(database);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });
}

type PrismaMethod = (...args: unknown[]) => unknown;

function wrapMethod(client: PrismaClient, receiver: unknown, method: PrismaMethod) {
  return async (...args: unknown[]) => {
    try {
      return await method.apply(receiver, args);
    } finally {
      await client.$disconnect();
    }
  };
}

function createDelegateProxy(client: PrismaClient, delegate: object) {
  return new Proxy(delegate, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function"
        ? wrapMethod(client, target, value as PrismaMethod)
        : value;
    },
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createPrismaForD1(requireCloudflareEnv("DB"));
    const value = Reflect.get(client, prop, client);

    if (typeof value === "function") {
      return wrapMethod(client, client, value as PrismaMethod);
    }

    if (value && typeof value === "object") {
      return createDelegateProxy(client, value);
    }

    return value;
  },
});
