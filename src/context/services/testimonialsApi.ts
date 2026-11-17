import { api } from "./index";

export interface LandingTestimonial {
    id: string;
    authorName: string;
    authorRole: string;
    restaurantName: string;
    quote: string;
    photoUrl: string | null;
    rating: number;
    isPublished: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertTestimonialPayload {
    authorName: string;
    authorRole: string;
    restaurantName: string;
    quote: string;
    photoUrl?: string | null;
    rating?: number;
    isPublished?: boolean;
    sortOrder?: number;
}

export const testimonialsApi = api.injectEndpoints({
    endpoints: builder => ({
        listPublicTestimonials: builder.query<
            { items: LandingTestimonial[] },
            void
        >({
            query: () => ({
                url: "/testimonials",
                method: "GET",
            }),
            providesTags: ["Marketing"],
        }),
        listSuperAdminTestimonials: builder.query<
            { items: LandingTestimonial[] },
            void
        >({
            query: () => ({
                url: "/super-admin/testimonials",
                method: "GET",
            }),
            providesTags: ["Marketing"],
        }),
        createTestimonial: builder.mutation<
            LandingTestimonial,
            UpsertTestimonialPayload
        >({
            query: body => ({
                url: "/super-admin/testimonials",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Marketing"],
        }),
        updateTestimonial: builder.mutation<
            LandingTestimonial,
            { id: string; body: Partial<UpsertTestimonialPayload> }
        >({
            query: ({ id, body }) => ({
                url: `/super-admin/testimonials/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Marketing"],
        }),
        deleteTestimonial: builder.mutation<
            { deleted: boolean; id: string },
            string
        >({
            query: id => ({
                url: `/super-admin/testimonials/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Marketing"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useListPublicTestimonialsQuery,
    useListSuperAdminTestimonialsQuery,
    useCreateTestimonialMutation,
    useUpdateTestimonialMutation,
    useDeleteTestimonialMutation,
} = testimonialsApi;
