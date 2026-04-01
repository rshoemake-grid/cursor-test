import { isOwner } from "../../utils/ownershipUtils";
import { nullishCoalesceToNull } from "./nullishCoalescing";
import {
  isOwner as isOwner2,
  filterOwnedItems,
  separateOfficialItems,
  filterUserOwnedDeletableItems
} from "../../utils/ownershipUtils";
function canUserDelete(item, user) {
  if (!item || item.is_official) {
    return false;
  }
  return isOwner(item, nullishCoalesceToNull(user));
}
export {
  canUserDelete,
  filterOwnedItems as filterUserOwned,
  filterUserOwnedDeletableItems,
  isOwner2 as isUserOwned,
  separateOfficialItems
};
