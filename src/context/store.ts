import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./slices/menuSlice";
import identityReducer from "./slices/identitySlice";
import opsReducer from "./slices/opsSlice";
import stationReducer from "./slices/stationSlice";
import { api } from "./services";

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
