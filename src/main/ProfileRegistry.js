import Profile from "./Profile";

/** Keeps one Profile per partition and finds profiles by session */
class ProfileRegistry {
  /**
   * The profile of each partition
   * @type {Map<string, Profile>}
   */
  profiles = new Map();

  /**
   * The profile of each session
   * @type {WeakMap<Electron.Session, Profile>}
   */
  sessions = new WeakMap();

  /**
   * Gets the profile of a partition, creating it on first use
   * @param {string} partition
   */
  get(partition) {
    let profile = this.profiles.get(partition);

    if (!profile) {
      profile = new Profile(partition);
      this.profiles.set(partition, profile);
      this.sessions.set(profile.session, profile);
    }

    return profile;
  }

  /**
   * Finds the profile of a session
   * @param {Electron.Session | undefined} session
   * @returns {Profile | undefined}
   */
  find(session) {
    return session ? this.sessions.get(session) : undefined;
  }

  /**
   * Destroys and forgets the profile of a partition
   * @param {string} partition
   */
  async remove(partition) {
    const profile = this.profiles.get(partition);

    if (!profile) return;

    this.profiles.delete(partition);
    this.sessions.delete(profile.session);

    await profile.destroy();
  }
}

export default ProfileRegistry;
