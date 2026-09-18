import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PreparationStation } from "@/domains/fulfillment/domain/station";

export const STATIONS_STORAGE_KEY = "fanaye.demo.stations.v1";

export interface StationState {
    stations: PreparationStation[];
    isSheetOpen: boolean;
    editingStation: PreparationStation | null;
    hydrated: boolean;
}

const initialState: StationState = {
    stations: [],
    isSheetOpen: false,
    editingStation: null,
    hydrated: false,
};

export const stationSlice = createSlice({
    name: "station",
    initialState,
    reducers: {
        hydrateStations: (
            state,
            action: PayloadAction<PreparationStation[] | null>,
        ) => {
            state.stations = Array.isArray(action.payload)
                ? action.payload
                : [];
            state.hydrated = true;
        },
        openAddStation: state => {
            state.editingStation = null;
            state.isSheetOpen = true;
        },
        openEditStation: (state, action: PayloadAction<PreparationStation>) => {
            state.editingStation = action.payload;
            state.isSheetOpen = true;
        },
        closeStationSheet: state => {
            state.isSheetOpen = false;
            state.editingStation = null;
        },
        addStation: (state, action: PayloadAction<PreparationStation>) => {
            state.stations.push(action.payload);
        },
        updateStation: (state, action: PayloadAction<PreparationStation>) => {
            const index = state.stations.findIndex(
                s => s.id === action.payload.id,
            );
            if (index !== -1) {
                state.stations[index] = action.payload;
            }
        },
        toggleStationEnabled: (state, action: PayloadAction<string>) => {
            const station = state.stations.find(s => s.id === action.payload);
            if (station) {
                station.enabled = !station.enabled;
            }
        },
        deleteStation: (state, action: PayloadAction<string>) => {
            state.stations = state.stations.filter(
                s => s.id !== action.payload,
            );
        },
        resetStations: state => {
            state.stations = [];
        },
    },
});

export const {
    hydrateStations,
    openAddStation,
    openEditStation,
    closeStationSheet,
    addStation,
    updateStation,
    toggleStationEnabled,
    deleteStation,
    resetStations,
} = stationSlice.actions;

export default stationSlice.reducer;
