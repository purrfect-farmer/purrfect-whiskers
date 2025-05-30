import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  return uuidv4();
}

export function* chunkArrayGenerator(arr, size) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

export function mutexify(fn) {
  let lock = Promise.resolve();

  return async function (...args) {
    const unlock = lock;
    let resolveNext;
    lock = new Promise((resolve) => (resolveNext = resolve));

    try {
      await unlock;
      return await fn.apply(this, args);
    } finally {
      resolveNext();
    }
  };
}

export function getTelegramUserFullName(user) {
  return [user["first_name"], user["last_name"]].filter(Boolean).join(" ");
}

export function searchIncludes(value, search) {
  return value.toString().toLowerCase().includes(search.toLowerCase());
}

/** Extract InitDataUnsafe */
export function extractInitDataUnsafe(initData) {
  const parsedInitData = Object.fromEntries(
    new URLSearchParams(initData).entries()
  );

  return {
    ...parsedInitData,
    user: JSON.parse(parsedInitData.user),
  };
}
