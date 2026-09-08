import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/menuSlice";
import identityReducer from "./slices/identitySlice";
import opsReducer from "./slices/opsSlice";
import stationReducer from "./slices/stationSlice";
import { api } from "./services";
import "./services/authApi";
import "./services/shiftsApi";
import "./services/floorApi";
import "./services/ordersApi";
import "./services/stationsApi";
import "./services/billingApi";
import "./services/cashApi";
import "./services/reconciliationApi";
import "./services/dailyCloseApi";
import "./services/menuApi";
import "./services/staffApi";

export const store = configureStore({
    reducer: {
        menu: menuReducer,
        identity: identityReducer,
        ops: opsReducer,
        station: stationReducer,
        [api.reducerPath]: api.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
