import type { AppDispatch } from "@/context/store";
import { api } from "@/context/services";
import { authApi } from "@/context/services/authApi";
import { clearSession } from "@/context/slices/identitySlice";
import { clearInbox } from "@/context/slices/notificationsSlice";
import {
    clearAuthFlagCookie,
    clearLegacyAuthStorage,
} from "@/domains/identity/infrastructure/authSession";

export async function performSignOut(dispatch: AppDispatch) {
    try {
        await dispatch(authApi.endpoints.logout.initiate()).unwrap();
    } catch {
        // Token or cookie may already be invalid.
    }
    clearLegacyAuthStorage();
    clearAuthFlagCookie();
    dispatch(clearInbox());
    dispatch(clearSession());
    dispatch(api.util.resetApiState());
}
