import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MenuItem } from "@/domains/catalog/domain/menu";

export const MENU_STORAGE_KEY = "fanaye.demo.menu.v1";

export interface MenuState {
    items: MenuItem[];
    isOpen: boolean;
    hydrated: boolean;
}

const initialState: MenuState = {
    items: [],
    isOpen: false,
    hydrated: false,
};

export const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        hydrateMenu: (state, action: PayloadAction<MenuItem[] | null>) => {
            state.items = Array.isArray(action.payload) ? action.payload : [];
            state.hydrated = true;
        },
        toggleMenu: state => {
            state.isOpen = !state.isOpen;
        },
        closeMenu: state => {
            state.isOpen = false;
        },
        openMenu: state => {
            state.isOpen = true;
        },
        addMenuItem: (state, action: PayloadAction<MenuItem>) => {
            state.items.unshift(action.payload);
        },
        updateMenuItem: (state, action: PayloadAction<MenuItem>) => {
            const index = state.items.findIndex(
                item => item.id === action.payload.id,
            );
            if (index !== -1) {
                state.items[index] = action.payload;
            }
        },
        toggleItemAvailability: (state, action: PayloadAction<string>) => {
            const item = state.items.find(entry => entry.id === action.payload);
            if (item) {
                item.available = !item.available;
            }
        },
        deleteMenuItem: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(
                entry => entry.id !== action.payload,
            );
        },
        resetMenu: state => {
            state.items = [];
        },
    },
});

export const {
    hydrateMenu,
    toggleMenu,
    closeMenu,
    openMenu,
    addMenuItem,
    updateMenuItem,
    toggleItemAvailability,
    deleteMenuItem,
    resetMenu,
} = menuSlice.actions;

export default menuSlice.reducer;
