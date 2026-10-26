import { memo, useContext } from "react";

import { LiaUser } from "react-icons/lia";
import { ListScrollingContext } from "./ScrollAwareVirtuoso";

/** The photo URLs that have finished loading */
const loadedPhotos = new Set();

/** The placeholder shown instead of a photo */
const AVATAR_PLACEHOLDER = (
  <div className="size-8 shrink-0 flex items-center justify-center">
    <LiaUser className="size-5" />
  </div>
);

/** An account's Telegram photo, or a placeholder while it can't load */
export default memo(function AccountAvatar({ user }) {
  const isScrolling = useContext(ListScrollingContext);
  const photoUrl = user?.["photo_url"];

  if (!photoUrl || (isScrolling && !loadedPhotos.has(photoUrl))) {
    return AVATAR_PLACEHOLDER;
  }

  return (
    <img
      src={photoUrl}
      className="size-8 shrink-0 rounded-full"
      loading="lazy"
      onLoad={() => loadedPhotos.add(photoUrl)}
    />
  );
});
