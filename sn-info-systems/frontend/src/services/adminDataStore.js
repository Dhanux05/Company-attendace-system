import { userService } from "./api";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = {
  users: null,
  teams: null,
  usersFetchedAt: 0,
  teamsFetchedAt: 0,
  usersPromise: null,
  teamsPromise: null,
};


const isFresh = (fetchedAt) => Date.now() - fetchedAt < CACHE_TTL_MS;

export const getUsers = async ({ force = false } = {}) => {
  if (!force && Array.isArray(cache.users) && isFresh(cache.usersFetchedAt)) {
    return cache.users;
  }

  if (cache.usersPromise) return cache.usersPromise;

  cache.usersPromise = userService
    .getAll()
    .then(({ data }) => {
      cache.users = Array.isArray(data) ? data : [];
      cache.usersFetchedAt = Date.now();
      return cache.users;
    })
    .finally(() => {
      cache.usersPromise = null;
    });

  return cache.usersPromise;
};

export const getActiveUsers = async (options) => {
  const users = await getUsers(options);
  return users.filter((user) => user.isActive);
};

export const getTeams = async ({ force = false } = {}) => {
  if (!force && Array.isArray(cache.teams) && isFresh(cache.teamsFetchedAt)) {
    return cache.teams;
  }

  if (cache.teamsPromise) return cache.teamsPromise;

  cache.teamsPromise = userService
    .getTeams()
    .then(({ data }) => {
      cache.teams = Array.isArray(data) ? data : [];
      cache.teamsFetchedAt = Date.now();
      return cache.teams;
    })
    .finally(() => {
      cache.teamsPromise = null;
    });

  return cache.teamsPromise;
};

export const updateCachedUser = (updatedUser) => {
  if (!updatedUser || !Array.isArray(cache.users)) return;
  cache.users = cache.users.map((user) => (user._id === updatedUser._id ? updatedUser : user));
  cache.usersFetchedAt = Date.now();
};

export const invalidateAdminReferenceData = ({ users = true, teams = true } = {}) => {
  if (users) {
    cache.users = null;
    cache.usersFetchedAt = 0;
    cache.usersPromise = null;
  }
  if (teams) {
    cache.teams = null;
    cache.teamsFetchedAt = 0;
    cache.teamsPromise = null;
  }
};
