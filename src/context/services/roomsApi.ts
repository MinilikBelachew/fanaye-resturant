import { api } from "./index";

export type RoomServiceSettings = {
    roomServiceEnabled: boolean;
    breakfastEntitlementEnabled: boolean;
    breakfastValidFromLocal: string;
    breakfastValidToLocal: string;
    breakfastMenuItemId: string | null;
};

export type HotelRoom = {
    id: string;
    roomNumber: string;
    floor: string | null;
    wing: string | null;
    status: string;
    sortOrder: number;
    defaultWaiterMembershipId: string | null;
    defaultWaiterName: string | null;
    stayId: string | null;
    guestName: string | null;
    mealPlan: string | null;
};

export type RoomStay = {
    id: string;
    hotelRoomId: string;
    roomNumber: string;
    floor: string | null;
    guestName: string;
    guestPhone: string | null;
    adults: number;
    kids: number;
    mealPlan: string;
    status: string;
    checkInAt: string;
    plannedCheckOutAt: string;
    checkedOutAt: string | null;
};

export type MyRoomCard = {
    hotelRoomId: string;
    roomNumber: string;
    floor: string | null;
    status: string;
    stayId: string | null;
    guestName: string | null;
    mealPlan: string | null;
    roomSessionId: string | null;
    sessionStatus: string | null;
    sessionVersion: number | null;
    mine: boolean;
};

export type RoomFloorCoverage = {
    id: string;
    floor: string;
    waiterMembershipId: string;
    waiterName?: string | null;
    shiftDefinitionId: string | null;
};

export const roomsApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        roomSettings: builder.query<{ data: RoomServiceSettings }, void>({
            query: () => ({ url: "/rooms/settings", method: "GET" }),
            providesTags: ["Rooms"],
        }),
        updateRoomSettings: builder.mutation<
            { data: RoomServiceSettings },
            Partial<RoomServiceSettings>
        >({
            query: body => ({
                url: "/rooms/settings",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        hotelRooms: builder.query<{ data: HotelRoom[] }, void>({
            query: () => ({ url: "/rooms/hotel-rooms", method: "GET" }),
            providesTags: ["Rooms"],
        }),
        createHotelRoom: builder.mutation<
            { data: HotelRoom },
            {
                roomNumber: string;
                floor?: string;
                wing?: string;
                defaultWaiterMembershipId?: string | null;
                sortOrder?: number;
            }
        >({
            query: body => ({
                url: "/rooms/hotel-rooms",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        updateHotelRoom: builder.mutation<
            { data: HotelRoom },
            { id: string; body: Partial<HotelRoom> }
        >({
            query: ({ id, body }) => ({
                url: `/rooms/hotel-rooms/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        archiveHotelRoom: builder.mutation<{ success: boolean }, string>({
            query: id => ({
                url: `/rooms/hotel-rooms/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Rooms"],
        }),
        inHouseStays: builder.query<{ data: RoomStay[] }, void>({
            query: () => ({ url: "/rooms/stays/in-house", method: "GET" }),
            providesTags: ["Rooms"],
        }),
        checkInStay: builder.mutation<
            { data: RoomStay },
            {
                hotelRoomId: string;
                guestName: string;
                guestPhone?: string;
                adults?: number;
                kids?: number;
                mealPlan?: "NONE" | "BREAKFAST";
                plannedCheckOutAt: string;
            }
        >({
            query: body => ({
                url: "/rooms/stays/check-in",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        checkOutStay: builder.mutation<{ data: RoomStay }, string>({
            query: id => ({
                url: `/rooms/stays/${id}/check-out`,
                method: "POST",
            }),
            invalidatesTags: ["Rooms"],
        }),
        redeemBreakfast: builder.mutation<
            {
                data: {
                    id: string;
                    qtyAllowed: number;
                    qtyUsed: number;
                    qtyRemaining: number;
                };
            },
            { roomStayId: string; quantity?: number }
        >({
            query: body => ({
                url: "/rooms/breakfast/redeem",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        roomCoverages: builder.query<{ data: RoomFloorCoverage[] }, void>({
            query: () => ({ url: "/rooms/coverages", method: "GET" }),
            providesTags: ["Rooms"],
        }),
        upsertRoomCoverage: builder.mutation<
            { data: RoomFloorCoverage },
            {
                floor: string;
                waiterMembershipId: string;
                shiftDefinitionId?: string | null;
            }
        >({
            query: body => ({
                url: "/rooms/coverages",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Rooms"],
        }),
        deleteRoomCoverage: builder.mutation<{ success: boolean }, string>({
            query: id => ({
                url: `/rooms/coverages/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Rooms"],
        }),
        myRooms: builder.query<{ data: MyRoomCard[] }, void>({
            query: () => ({ url: "/rooms/my-rooms", method: "GET" }),
            providesTags: ["Rooms"],
        }),
        openRoomSession: builder.mutation<
            {
                data: {
                    roomSessionId: string;
                    hotelRoomId: string;
                    roomNumber: string;
                    roomStayId: string;
                    guestName: string;
                    status: string;
                    version: number;
                };
            },
            { roomStayId: string; guestCount?: number }
        >({
            query: body => ({
                url: "/rooms/sessions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Rooms", "Order"],
        }),
        forceCloseRoomSession: builder.mutation<
            {
                data: {
                    roomSessionId: string;
                    status: string;
                    version: number;
                };
            },
            {
                roomSessionId: string;
                expectedVersion: number;
                reason: string;
            }
        >({
            query: ({ roomSessionId, expectedVersion, reason }) => ({
                url: `/rooms/sessions/${roomSessionId}/force-close`,
                method: "POST",
                body: { expectedVersion, reason },
            }),
            invalidatesTags: ["Rooms", "Order", "DailyClose"],
        }),
    }),
});

export const useRoomSettingsQuery = roomsApi.endpoints.roomSettings.useQuery;
export const useUpdateRoomSettingsMutation =
    roomsApi.endpoints.updateRoomSettings.useMutation;
export const useHotelRoomsQuery = roomsApi.endpoints.hotelRooms.useQuery;
export const useCreateHotelRoomMutation =
    roomsApi.endpoints.createHotelRoom.useMutation;
export const useUpdateHotelRoomMutation =
    roomsApi.endpoints.updateHotelRoom.useMutation;
export const useArchiveHotelRoomMutation =
    roomsApi.endpoints.archiveHotelRoom.useMutation;
export const useInHouseStaysQuery = roomsApi.endpoints.inHouseStays.useQuery;
export const useCheckInStayMutation =
    roomsApi.endpoints.checkInStay.useMutation;
export const useCheckOutStayMutation =
    roomsApi.endpoints.checkOutStay.useMutation;
export const useRedeemBreakfastMutation =
    roomsApi.endpoints.redeemBreakfast.useMutation;
export const useRoomCoveragesQuery = roomsApi.endpoints.roomCoverages.useQuery;
export const useUpsertRoomCoverageMutation =
    roomsApi.endpoints.upsertRoomCoverage.useMutation;
export const useDeleteRoomCoverageMutation =
    roomsApi.endpoints.deleteRoomCoverage.useMutation;
export const useMyRoomsQuery = roomsApi.endpoints.myRooms.useQuery;
export const useOpenRoomSessionMutation =
    roomsApi.endpoints.openRoomSession.useMutation;
export const useForceCloseRoomSessionMutation =
    roomsApi.endpoints.forceCloseRoomSession.useMutation;
