import type { AppDispatch } from "@/context/store";
import { authApi } from "@/context/services/authApi";
import { clearSession } from "@/context/slices/identitySlice";
import { clearLegacyAuthStorage } from "@/domains/identity/infrastructure/authSession";

export async function performSignOut(dispatch: AppDispatch) {
    try {
        await dispatch(authApi.endpoints.logout.initiate()).unwrap();
    } catch {
        // Token or cookie may already be invalid.
    }
    clearLegacyAuthStorage();
    dispatch(clearSession());
}
