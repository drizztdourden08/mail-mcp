import { ToolRegistry } from "../services/tool-registry.js";

// Auth
import { authLogin } from "./auth/login.js";
import { authLogout } from "./auth/logout.js";

// Email
import { emailList } from "./email/list.js";
import { emailRead } from "./email/read.js";
import { emailDelete } from "./email/delete.js";
import { emailMove } from "./email/move.js";
import { emailSearch } from "./email/search.js";

// Folder
import { folderList } from "./folder/list.js";
import { folderTree } from "./folder/tree.js";

// Cache
import { cacheSync } from "./cache/sync.js";
import { cacheStats } from "./cache/stats.js";
import { cacheSearch } from "./cache/search.js";
import { cacheFilter } from "./cache/filter.js";
import { cacheGet } from "./cache/get.js";
import { cacheClear } from "./cache/clear.js";

// Review
import { reviewCreate } from "./review/create.js";
import { reviewAddItems } from "./review/add-items.js";
import { reviewRemoveItems } from "./review/remove-items.js";
import { reviewUpdate } from "./review/update.js";
import { reviewList } from "./review/list.js";
import { reviewAwait } from "./review/await.js";
import { reviewClose } from "./review/close.js";

// Unsubscribe
import { unsubscribeCheck } from "./unsubscribe/check.js";
import { unsubscribeExecute } from "./unsubscribe/execute.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.registerAll([
    authLogin,
    authLogout,
    emailList,
    emailRead,
    emailDelete,
    emailMove,
    emailSearch,
    folderList,
    folderTree,
    cacheSync,
    cacheStats,
    cacheSearch,
    cacheFilter,
    cacheGet,
    cacheClear,
    reviewCreate,
    reviewAddItems,
    reviewRemoveItems,
    reviewUpdate,
    reviewList,
    reviewAwait,
    reviewClose,
    unsubscribeCheck,
    unsubscribeExecute,
  ]);
  return registry;
}
